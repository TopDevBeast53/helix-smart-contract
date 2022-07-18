const { expect } = require("chai")                                                                                                      
                                                                                                   
const { waffle } = require("hardhat")                                                              
const { loadFixture } = waffle                                                                     
                                                                                                   
const { bigNumberify, MaxUint256 } = require("legacy-ethers/utils")                                            
const { expandTo18Decimals, print } = require("./shared/utilities")                                       
const { fullExchangeFixture } = require("./shared/fixtures")                                       
const { constants } = require("@openzeppelin/test-helpers")                                        
                                                                                                   
const verbose = true  

const multiSigWalletJson = require("../artifacts/contracts/multisig/MultiSigWallet.sol/MultiSigWallet.json")
const multiSigWalletAbi = multiSigWalletJson.abi
const multiSigInterface = new ethers.utils.Interface(multiSigWalletAbi)

const helixTokenJson = require("../artifacts/contracts/tokens/HelixToken.sol/HelixToken.json")
const helixTokenAbi = helixTokenJson.abi
const helixTokenInterface = new ethers.utils.Interface(helixTokenAbi)

const tokenJson = require("../artifacts/contracts/test/TestToken.sol/TestToken.json")
const tokenAbi = tokenJson.abi
const tokenInterface = new ethers.utils.Interface(tokenAbi)

const referralRegisterJson = require("../artifacts/contracts/referrals/ReferralRegister.sol/ReferralRegister.json")
const referralRegisterAbi = referralRegisterJson.abi
const referralRegisterInterface = new ethers.utils.Interface(referralRegisterAbi)

describe("MultiSigWallet", () => {
    let alice, bobby, carol, david, edith
    let owners
    let multiSig
    let helixToken
    let tokenA
    let tokenB
    let referralRegister

    beforeEach(async () => {
        [alice, bobby, carol, david, edith] = await ethers.getSigners()
        admins = [alice.address]
        owners = [bobby.address, carol.address]

        const fixture = await loadFixture(fullExchangeFixture)

        multiSig = fixture.multiSigWallet
        helixToken = fixture.helixToken
        tokenA = fixture.tokenA
        tokenB = fixture.tokenB
        referralRegister = fixture.referralRegister
    })

    it("multiSigWallet: initialized correctly", async () => {
        expect(await multiSig.getAdmins()).to.deep.eq(admins)
        expect(await multiSig.getOwners()).to.deep.eq(owners)
        expect(await multiSig.adminConfirmationsRequired()).to.eq(1)
        expect(await multiSig.ownerConfirmationsRequired()).to.eq(1)
    })

    it("multiSigWallet: submit transfer as non-admin/owner fails", async () => {
        const amount = expandTo18Decimals(100)
        await tokenA.transfer(multiSig.address, amount)

        const multiSigEdith = multiSig.connect(edith)
        await expect(multiSigEdith.submitTransaction(
            tokenA.address, 
            bobby.address,
            amount)
        ).to.be.revertedWith("NotAnAdminOrOwner")
    })

    it("multiSigWallet: submit transfer creates transaction object", async () => {
        let amount = expandTo18Decimals(100)
        await tokenA.transfer(multiSig.address, amount)
         
        await multiSig.submitTransfer(tokenA.address, bobby.address, amount)
    
        const txIndex = (await multiSig.getTransactionCount()).sub(1)
        const transaction = await multiSig.getTransaction(txIndex)

        expect(transaction.to).to.eq(multiSig.address)
        expect(transaction.value).to.eq(0)
        expect(transaction.executed).to.be.false
        expect(transaction.ownerConfirmations).to.eq(0)
    })

    it("multiSigWallet: submit transfer emits SubmitTransaction event", async () => {
        let amount = expandTo18Decimals(100)
        await tokenA.transfer(multiSig.address, amount)
        
        const txIndex = await multiSig.getTransactionCount()
        const data = multiSigInterface.encodeFunctionData(
            "_transfer", 
            [tokenA.address, bobby.address, amount]
        )
        await expect(multiSig.submitTransfer(tokenA.address, bobby.address, amount))
            .to.emit(multiSig, "SubmitTransaction")
            .withArgs(
                alice.address,
                txIndex,
                multiSig.address,
                0,
                data
            )
    })

    it("multiSigWallet: submit transfer succeeds", async () => {
        // Use bobby's current balance later to check that transfer succeeds
        const prevBobbyHelixBalance = await helixToken.balanceOf(bobby.address)

        // Fund the wallet with helix
        let amount = expandTo18Decimals(100)
        await helixToken.transfer(multiSig.address, amount)

        // Submit a transfer transaction as alice to transfer amount of helix to bobby
        await multiSig.submitTransfer(helixToken.address,  bobby.address, amount)
        const txIndex = (await multiSig.getTransactionCount()).sub(1)

        // Expect the admin unconfirmed tx to fail
        await expect(multiSig.executeTransaction(txIndex))
            .to.be.revertedWith("InsufficientAdminConfirmations")

        // Confirm the transaction as admin
        await multiSig.confirmTransaction(txIndex)

        // Expect the owner unconfirmed tx to fail
        await expect(multiSig.executeTransaction(txIndex))
            .to.be.revertedWith("InsufficientOwnerConfirmations")

        // Confirm the transaction as owner
        const multiSigBobby = multiSig.connect(bobby)
        await multiSigBobby.confirmTransaction(txIndex)
       
        // Execute the transaction
        await multiSig.executeTransaction(txIndex)

        // Check that bobby has received amount of helix
        expect(await helixToken.balanceOf(bobby.address)).to.eq(prevBobbyHelixBalance.add(amount))

        // Check that the transaction is marked as executed
        const transaction = await multiSig.getTransaction(txIndex)
        expect(transaction.executed).to.be.true
    })

    it("multiSigWallet: transfer emits Transfer event", async () => {
        // Use bobby's current balance later to check that transfer succeeds
        const prevBobbyHelixBalance = await helixToken.balanceOf(bobby.address)

        // Fund the wallet with helix
        let amount = expandTo18Decimals(100)
        await helixToken.transfer(multiSig.address, amount)

        // Submit a transfer transaction as alice to transfer amount of helix to bobby
        await multiSig.submitTransfer(helixToken.address,  bobby.address, amount)
        const txIndex = (await multiSig.getTransactionCount()).sub(1)

        // Confirm the transaction as admin and owner
        await multiSig.confirmTransaction(txIndex)

        const multiSigBobby = multiSig.connect(bobby)
        await multiSigBobby.confirmTransaction(txIndex)
       
        // Execute the transaction
        await expect(multiSig.executeTransaction(txIndex))
            .to.emit(multiSig, "Transfer")
            .withArgs(
                helixToken.address,
                bobby.address,
                amount
            )
    })

    it("multiSigWallet: submit add admin succeeds", async () => {
        // Submit an add admin transaction to add edith as admin
        await multiSig.submitAddAdmin(edith.address)
        const txIndex = (await multiSig.getTransactionCount()).sub(1)

        // Expect the admin unconfirmed tx to fail
        await expect(multiSig.executeTransaction(txIndex))
            .to.be.revertedWith("InsufficientAdminConfirmations")

        // Confirm the transaction as admin
        await multiSig.confirmTransaction(txIndex)

        // Expect the owner unconfirmed tx to fail
        await expect(multiSig.executeTransaction(txIndex))
            .to.be.revertedWith("InsufficientOwnerConfirmations")

        // Confirm the transaction as owner
        const multiSigBobby = multiSig.connect(bobby)
        await multiSigBobby.confirmTransaction(txIndex)
       
        // Execute the transaction
        await multiSig.executeTransaction(txIndex)

        // Check that edith is an admin
        expect(await multiSig.isAdmin(edith.address)).to.be.true

        // Check that the transaction is marked as executed
        const transaction = await multiSig.getTransaction(txIndex)
        expect(transaction.executed).to.be.true
    })

    it("multiSigWallet: add admin emits AddAdmin event", async () => {
        // Submit an add admin transaction to add edith as admin
        await multiSig.submitAddAdmin(edith.address)
        const txIndex = (await multiSig.getTransactionCount()).sub(1)

        // Confirm the transaction as admin and owner
        await multiSig.confirmTransaction(txIndex)

        const multiSigBobby = multiSig.connect(bobby)
        await multiSigBobby.confirmTransaction(txIndex)
       
        // Execute the transaction
        await expect(multiSig.executeTransaction(txIndex))
            .to.emit(multiSig, "AddAdmin")
    })

    it("multiSigWallet: submit add owner succeeds", async () => {
        // Submit an add owner transaction to add edith as owner
        await multiSig.submitAddOwner(edith.address)
        const txIndex = (await multiSig.getTransactionCount()).sub(1)

        // Expect the admin unconfirmed tx to fail
        await expect(multiSig.executeTransaction(txIndex))
            .to.be.revertedWith("InsufficientAdminConfirmations")

        // Confirm the transaction as admin
        await multiSig.confirmTransaction(txIndex)

        // Expect the owner unconfirmed tx to fail
        await expect(multiSig.executeTransaction(txIndex))
            .to.be.revertedWith("InsufficientOwnerConfirmations")

        // Confirm the transaction as owner
        const multiSigBobby = multiSig.connect(bobby)
        await multiSigBobby.confirmTransaction(txIndex)
       
        // Execute the transaction
        await multiSig.executeTransaction(txIndex)

        // Check that edith is an admin
        expect(await multiSig.isOwner(edith.address)).to.be.true

        // Check that the transaction is marked as executed
        const transaction = await multiSig.getTransaction(txIndex)
        expect(transaction.executed).to.be.true
    })

    it("multiSigWallet: add owner emits AddOwner event", async () => {
        // Submit an add owner transaction to add edith as owner
        await multiSig.submitAddOwner(edith.address)
        const txIndex = (await multiSig.getTransactionCount()).sub(1)

        // Confirm the transaction as admin and owner
        await multiSig.confirmTransaction(txIndex)

        const multiSigBobby = multiSig.connect(bobby)
        await multiSigBobby.confirmTransaction(txIndex)
       
        // Execute the transaction
        await expect(multiSig.executeTransaction(txIndex))
            .to.emit(multiSig, "AddOwner")
    })

    it("multiSigWallet: submit remove admin succeeds", async () => {
        // FIRST
        // Add edith as admin so that there's an admin after removing alice
        await multiSig.submitAddAdmin(edith.address)
        const addEdithTxIndex = (await multiSig.getTransactionCount()).sub(1)

        // Confirm adding edith as admin and owner
        await multiSig.confirmTransaction(addEdithTxIndex)

        const multiSigBobby = multiSig.connect(bobby)
        await multiSigBobby.confirmTransaction(addEdithTxIndex)

        // Execute adding edith as admin
        await multiSig.executeTransaction(addEdithTxIndex)

        // Check that edith is an admin
        expect(await multiSig.isAdmin(edith.address)).to.be.true

        // SECOND
        // Submit a remove admin transaction to remove alice as admin
        await multiSig.submitRemoveAdmin(alice.address)
        const txIndex = (await multiSig.getTransactionCount()).sub(1)

        // Expect the admin unconfirmed tx to fail
        await expect(multiSig.executeTransaction(txIndex))
            .to.be.revertedWith("InsufficientAdminConfirmations")

        // Confirm the transaction as admin
        await multiSig.confirmTransaction(txIndex)

        // Expect the owner unconfirmed tx to fail
        await expect(multiSig.executeTransaction(txIndex))
            .to.be.revertedWith("InsufficientOwnerConfirmations")

        // Confirm the transaction as owner
        await multiSigBobby.confirmTransaction(txIndex)
       
        // Execute the transaction
        await multiSig.executeTransaction(txIndex)

        // Check that edith is an admin
        expect(await multiSig.isAdmin(alice.address)).to.be.false

        // Check that the transaction is marked as executed
        const transaction = await multiSig.getTransaction(txIndex)
        expect(transaction.executed).to.be.true
    })

    it("multiSigWallet: remove admin emits RemoveAdmin event", async () => {
        // FIRST
        // Add edith as admin so that there's an admin after removing alice
        await multiSig.submitAddAdmin(edith.address)
        const addEdithTxIndex = (await multiSig.getTransactionCount()).sub(1)

        // Confirm adding edith as admin and owner
        await multiSig.confirmTransaction(addEdithTxIndex)

        const multiSigBobby = multiSig.connect(bobby)
        await multiSigBobby.confirmTransaction(addEdithTxIndex)

        // Execute adding edith as admin
        await multiSig.executeTransaction(addEdithTxIndex)

        // SECOND
        // Submit a remove admin transaction to remove alice as admin
        await multiSig.submitRemoveAdmin(alice.address)
        const txIndex = (await multiSig.getTransactionCount()).sub(1)

        // Confirm the transaction as admin and owner
        await multiSig.confirmTransaction(txIndex)
        await multiSigBobby.confirmTransaction(txIndex)
       
        // Execute the transaction
        await expect(multiSig.executeTransaction(txIndex))
            .to.emit(multiSig, "RemoveAdmin")
    })

    it("multiSigWallet: submit remove owner succeeds", async () => {
        // Submit a remove owner transaction to remove bobby as owner
        await multiSig.submitRemoveOwner(bobby.address)
        const txIndex = (await multiSig.getTransactionCount()).sub(1)

        // Expect the admin unconfirmed tx to fail
        await expect(multiSig.executeTransaction(txIndex))
            .to.be.revertedWith("InsufficientAdminConfirmations")

        // Confirm the transaction as admin
        await multiSig.confirmTransaction(txIndex)

        // Expect the owner unconfirmed tx to fail
        await expect(multiSig.executeTransaction(txIndex))
            .to.be.revertedWith("InsufficientOwnerConfirmations")

        // Confirm the transaction as owner
        const multiSigBobby = multiSig.connect(bobby)
        await multiSigBobby.confirmTransaction(txIndex)
       
        // Execute the transaction
        await multiSig.executeTransaction(txIndex)

        // Check that edith is an admin
        expect(await multiSig.isOwner(bobby.address)).to.be.false

        // Check that the transaction is marked as executed
        const transaction = await multiSig.getTransaction(txIndex)
        expect(transaction.executed).to.be.true
    })

    it("multiSigWallet: remove owner emits RemoveOwner event", async () => {
        // Submit a remove owner transaction to remove bobby as owner
        await multiSig.submitRemoveOwner(bobby.address)
        const txIndex = (await multiSig.getTransactionCount()).sub(1)

        // Confirm the transaction as admin and owner
        await multiSig.confirmTransaction(txIndex)

        const multiSigBobby = multiSig.connect(bobby)
        await multiSigBobby.confirmTransaction(txIndex)
       
        // Execute the transaction
        await expect(multiSig.executeTransaction(txIndex))
            .to.emit(multiSig, "RemoveOwner")
    })

    it("multiSigWallet: submit set admin confirmations required succeeds", async () => {
        // Check that the new admin confirmations requrired does not equal the current setting
        const newAdminConfirmationsRequired = 0
        expect(await multiSig.adminConfirmationsRequired()).to.not.eq(newAdminConfirmationsRequired)

        // Submit a set admin confirmations required transaction
        await multiSig.submitSetAdminConfirmationsRequired(newAdminConfirmationsRequired)
        const txIndex = (await multiSig.getTransactionCount()).sub(1)

        // Confirm the transaction as admin and owner
        await multiSig.confirmTransaction(txIndex)

        const multiSigBobby = multiSig.connect(bobby)
        await multiSigBobby.confirmTransaction(txIndex)

        // Execute the transaction
        await multiSig.executeTransaction(txIndex)

        // Check that the new admin confirmations required is set
        expect(await multiSig.adminConfirmationsRequired()).to.eq(newAdminConfirmationsRequired)
    })

    it("multiSigWallet: set admin confirmations required emits SetAdminConfirmationsRequired event", async () => {
        // Submit a set admin confirmations required transaction
        const newAdminConfirmationsRequired = 0
        await multiSig.submitSetAdminConfirmationsRequired(newAdminConfirmationsRequired)
        const txIndex = (await multiSig.getTransactionCount()).sub(1)

        // Confirm the transaction as admin and owner
        await multiSig.confirmTransaction(txIndex)

        const multiSigBobby = multiSig.connect(bobby)
        await multiSigBobby.confirmTransaction(txIndex)

        // Execute the transaction
        await expect(multiSig.executeTransaction(txIndex))
            .to.emit(multiSig, "SetAdminConfirmationsRequired")
    })

    it("multiSigWallet: submit set owner confirmations required succeeds", async () => {
        // Check that the new owner confirmations requrired does not equal the current setting
        const newOwnerConfirmationsRequired = 2
        expect(await multiSig.ownerConfirmationsRequired()).to.not.eq(newOwnerConfirmationsRequired)

        // Submit a set owner confirmations required transaction
        await multiSig.submitSetOwnerConfirmationsRequired(newOwnerConfirmationsRequired)
        const txIndex = (await multiSig.getTransactionCount()).sub(1)

        // Confirm the transaction as admin and owner
        await multiSig.confirmTransaction(txIndex)

        const multiSigBobby = multiSig.connect(bobby)
        await multiSigBobby.confirmTransaction(txIndex)

        // Execute the transaction
        await multiSig.executeTransaction(txIndex)

        // Check that the new owner confirmations required is set
        expect(await multiSig.ownerConfirmationsRequired()).to.eq(newOwnerConfirmationsRequired)
    })

    it("multiSigWallet: set owner confirmations required emits SetOwnerConfirmationsRequired event", async () => {
        // Submit a set owner confirmations required transaction
        const newOwnerConfirmationsRequired = 2
        await multiSig.submitSetOwnerConfirmationsRequired(newOwnerConfirmationsRequired)
        const txIndex = (await multiSig.getTransactionCount()).sub(1)

        // Confirm the transaction as admin and owner
        await multiSig.confirmTransaction(txIndex)

        const multiSigBobby = multiSig.connect(bobby)
        await multiSigBobby.confirmTransaction(txIndex)

        // Execute the transaction
        await expect(multiSig.executeTransaction(txIndex))
            .to.emit(multiSig, "SetOwnerConfirmationsRequired")
    })

    it("multiSigWallet: confirm transaction as non-admin/owner fails", async () => {
        // Open a new transfer
        let amount = expandTo18Decimals(100)
        await tokenA.transfer(multiSig.address, amount)
         
        await multiSig.submitTransaction(tokenA.address, bobby.address, amount)
    
        const txIndex = (await multiSig.getTransactionCount()).sub(1)
        const transaction = await multiSig.getTransaction(txIndex)

        // confirm the transfer as a non-admin/owner
        const multiSigEdith = multiSig.connect(edith)
        await expect(multiSigEdith.confirmTransaction(txIndex))
            .to.be.revertedWith("NotAnAdminOrOwner")
    })

    it("multiSigWallet: confirm transaction when transaction does not exist fails", async () => {
        const txIndex = await multiSig.getTransactionCount()
         await expect(multiSig.confirmTransaction(txIndex))
            .to.be.revertedWith("TxDoesNotExist")
    })

    it("multiSigWallet: confirm transaction when transaction is executed fails", async () => {
        // Open a new transfer
        let amount = expandTo18Decimals(100)
        await tokenA.transfer(multiSig.address, amount)
         
        await multiSig.submitTransfer(tokenA.address, bobby.address, amount)
    
        let txIndex = (await multiSig.getTransactionCount()).sub(1)

        // confirm the transfer
        await multiSig.confirmTransaction(txIndex) 

        const multiSigBobby = multiSig.connect(bobby)
        await multiSigBobby.confirmTransaction(txIndex)

        const multiSigCarol = multiSig.connect(carol)
        await multiSigCarol.confirmTransaction(txIndex)

        // Execute the transfer
        await multiSig.executeTransaction(txIndex)
    
        // confirm the transfer
        await expect(multiSig.confirmTransaction(txIndex))
            .to.be.revertedWith("TxAlreadyConfirmed")
    })

    it("multiSigWallet: confirm transaction when transaction is confirmed fails", async () => {
        // Open a new transfer
        let amount = expandTo18Decimals(100)
        await tokenA.transfer(multiSig.address, amount)
         
        await multiSig.submitTransaction(tokenA.address, bobby.address, amount)
    
        let txIndex = (await multiSig.getTransactionCount()).sub(1)

        // confirm the transfer
        await multiSig.confirmTransaction(txIndex)

        // confirm the transfer again
        await expect(multiSig.confirmTransaction(txIndex))
            .to.be.revertedWith("")
    })

    it("multiSigWallet: admin confirm transaction increments transaction num admin confirmations", async () => {
        // Open a new transfer
        let amount = expandTo18Decimals(100)
        await tokenA.transfer(multiSig.address, amount)
        
        await multiSig.submitTransaction(tokenA.address, bobby.address, amount)

        let txIndex = (await multiSig.getTransactionCount()).sub(1)
        let transaction = await multiSig.getTransaction(txIndex)

        expect(transaction.ownerConfirmations).to.eq(0)

        // confirm the transfer
        await multiSig.confirmTransaction(txIndex)

        transaction = await multiSig.getTransaction(txIndex)
        expect(transaction.adminConfirmations).to.eq(1)
    })

    it("multiSigWallet: owner confirm transaction increments transaction num owner confirmations", async () => {
        // Open a new transfer
        let amount = expandTo18Decimals(100)
        await tokenA.transfer(multiSig.address, amount)
        
        const multiSigBobby = multiSig.connect(bobby)
        await multiSig.submitTransaction(tokenA.address, bobby.address, amount)
    
        let txIndex = (await multiSig.getTransactionCount()).sub(1)
        let transaction = await multiSig.getTransaction(txIndex)

        expect(transaction.ownerConfirmations).to.eq(0)

        // confirm the transfer
        await multiSigBobby.confirmTransaction(txIndex)

        transaction = await multiSig.getTransaction(txIndex)
        expect(transaction.ownerConfirmations).to.eq(1)
    })

    it("multiSigWallet: confirm transfer as owner marks caller as confirmed", async () => {
        // Open a new transfer
        let amount = expandTo18Decimals(100)
        await tokenA.transfer(multiSig.address, amount)
         
        await multiSig.submitTransfer(tokenA.address, bobby.address, amount)
    
        let txIndex = (await multiSig.getTransactionCount()).sub(1)
        expect(await multiSig.isConfirmed(txIndex, alice.address)).to.be.false

        // confirm the transfer
        const multiSigBobby = multiSig.connect(bobby)
        await multiSigBobby.confirmTransaction(txIndex)

        expect(await multiSig.isConfirmed(txIndex, bobby.address)).to.be.true
    })

    it("multiSigWallet: confirm transfer emits ConfirmTransaction event", async () => {
        // Open a new transfer
        let amount = expandTo18Decimals(100)
        await tokenA.transfer(multiSig.address, amount)
         
        await multiSig.submitTransaction(tokenA.address, bobby.address, amount)
    
        let txIndex = (await multiSig.getTransactionCount()).sub(1)

        // confirm the transfer
        await expect(multiSig.confirmTransaction(txIndex))
            .to.emit(multiSig, "ConfirmTransaction")
            .withArgs(alice.address, txIndex, 1, 0)
    })

    it("multiSigWallet: execute transfer as non-admin/owner fails", async () => {
        // Open a new transfer
        let amount = expandTo18Decimals(100)
        await tokenA.transfer(multiSig.address, amount)
         
        await multiSig.submitTransaction(tokenA.address, bobby.address, amount)
    
        let txIndex = (await multiSig.getTransactionCount()).sub(1)
    
        const multiSigEdith = multiSig.connect(edith)
        await expect(multiSigEdith.executeTransaction(txIndex))
            .to.be.revertedWith("NotAnAdminOrOwner")
    })

    it("multiSigWallet: execute transfer when transaction does not exist fails", async () => {
        let txIndex = await multiSig.getTransactionCount()
    
        await expect(multiSig.executeTransaction(txIndex))
            .to.be.revertedWith("TxDoesNotExist")
    })

    it("multiSigWallet: execute transfer when transaction is executed fails", async () => {
        // Open a new transfer
        let amount = expandTo18Decimals(100)
        await tokenA.transfer(multiSig.address, amount)
         
        await multiSig.submitTransfer(tokenA.address, bobby.address, amount)
   
        // Get the newly submitted transaction
        let txIndex = (await multiSig.getTransactionCount()).sub(1)

        // confirm the transfer
        await multiSig.confirmTransaction(txIndex)

        const multiSigBobby = multiSig.connect(bobby)
        await multiSigBobby.confirmTransaction(txIndex)

        const multiSigCarol = multiSig.connect(carol)
        await multiSigCarol.confirmTransaction(txIndex)

        // Execute the transfer
        await multiSig.executeTransaction(txIndex)
   
        // Execute the transfer again
        await expect(multiSig.executeTransaction(txIndex))
            .to.be.revertedWith("TxAlreadyExecuted")
    })

    it("multiSigWallet: execute transfer transfers the funds in the transaction", async () => {
        // Open a new transfer
        let amount = expandTo18Decimals(100)
        await tokenA.transfer(multiSig.address, amount)
         
        await multiSig.submitTransfer(tokenA.address, bobby.address, amount)
   
        // Get the newly submitted transaction
        let txIndex = (await multiSig.getTransactionCount()).sub(1)

        // confirm the transfer
        await multiSig.confirmTransaction(txIndex)

        const multiSigBobby = multiSig.connect(bobby)
        await multiSigBobby.confirmTransaction(txIndex)

        const multiSigCarol = multiSig.connect(carol)
        await multiSigCarol.confirmTransaction(txIndex)

        // Execute the transfer
        await multiSig.executeTransaction(txIndex)
   
        expect(await tokenA.balanceOf(bobby.address)).to.eq(amount)
    })

    it("multiSigWallet: execute transaction on another contract succeeds", async () => {
        // Transfer ownership of referralRegister to multiSigWallet
        await referralRegister.transferOwnership(multiSig.address)

        // Expect that alice can no longer call onlyOwner restricted function
        await expect(referralRegister.pause())
            .to.be.revertedWith("Ownable: caller is not the owner")

        // Confirm that the referralRegister is not paused
        expect(await referralRegister.paused()).to.be.false

        // Submit a transaction to pause the referralRegister
        const data = referralRegisterInterface.encodeFunctionData("pause")
        await multiSig.submitTransaction(referralRegister.address, 0, data)

        // Get the newly submitted transaction
        let txIndex = (await multiSig.getTransactionCount()).sub(1)

        // Confirm the transaction as admin and owner
        await multiSig.confirmTransaction(txIndex)

        const multiSigBobby = multiSig.connect(bobby)
        await multiSigBobby.confirmTransaction(txIndex)

        // Execute the transaction
        await multiSig.executeTransaction(txIndex)

        // Expect the referralRegister to be paused
        expect(await referralRegister.paused()).to.be.true
    })

    it("multiSigWallet: execute transaction emits ExecuteTransaction event", async () => {
        // Transfer ownership of referralRegister to multiSigWallet
        await referralRegister.transferOwnership(multiSig.address)

        // Expect that alice can no longer call onlyOwner restricted function
        await expect(referralRegister.pause())
            .to.be.revertedWith("Ownable: caller is not the owner")

        // Confirm that the referralRegister is not paused
        expect(await referralRegister.paused()).to.be.false

        // Submit a transaction to pause the referralRegister
        const data = referralRegisterInterface.encodeFunctionData("pause")
        await multiSig.submitTransaction(referralRegister.address, 0, data)

        // Get the newly submitted transaction
        let txIndex = (await multiSig.getTransactionCount()).sub(1)

        // Confirm the transaction as admin and owner
        await multiSig.confirmTransaction(txIndex)

        const multiSigBobby = multiSig.connect(bobby)
        await multiSigBobby.confirmTransaction(txIndex)

        // Execute the transaction
        await expect(multiSig.executeTransaction(txIndex))
            .to.emit(multiSig, "ExecuteTransaction")
            .withArgs(txIndex)
    })

    it("multiSigWallet: revoke confirmation as non-admin/owner fails", async () => {
        const multiSigEdith = multiSig.connect(edith)
        let txIndex = 0
        await expect(multiSigEdith.revokeConfirmation(txIndex))
            .to.be.revertedWith("NotAnAdminOrOwner")
    })

    it("multiSigWallet: revoke confirmation when transaction does not exist faisl", async () => {
        let txIndex = 0
        await expect(multiSig.revokeConfirmation(txIndex))
            .to.be.revertedWith("TxDoesNotExist")
    })

    it("multiSigWallet: revoke confirmation when transaction already executed fails", async () => {
        // Open a new transfer
        let amount = expandTo18Decimals(100)
        await helixToken.transfer(multiSig.address, amount)
        
        // Submit transaction to transfer amount of tokenA to bobby
        await multiSig.submitTransfer(helixToken.address, bobby.address, amount)
   
        // Get the newly submitted transaction
        let txIndex = (await multiSig.getTransactionCount()).sub(1)

        // confirm the transfer
        await multiSig.confirmTransaction(txIndex)

        const multiSigBobby = multiSig.connect(bobby)
        await multiSigBobby.confirmTransaction(txIndex)

        const multiSigCarol = multiSig.connect(carol)
        await multiSigCarol.confirmTransaction(txIndex)

        // Execute the transfer
        await multiSig.executeTransaction(txIndex)

        // Revoke the confirmation
        await expect(multiSig.revokeConfirmation(txIndex))
            .to.be.revertedWith("TxAlreadyExecuted")
    })

    it("multiSigWallet: revoke confirmation when transaction not confirmed fails", async () => {
        // Open a new transfer
        let amount = expandTo18Decimals(100)
        await tokenA.transfer(multiSig.address, amount)
         
        await multiSig.submitTransaction(tokenA.address, bobby.address, amount)
   
        // Get the newly submitted transaction
        let txIndex = (await multiSig.getTransactionCount()).sub(1)

        // Revoke the confirmation
        await expect(multiSig.revokeConfirmation(txIndex))
            .to.be.revertedWith("TxNotConfirmed")
    })

    it("multiSigWallet: revoke confirmation as admin decrements number of confirmations", async () => {
        // Open a new transfer
        let amount = expandTo18Decimals(100)
        await tokenA.transfer(multiSig.address, amount)
         
        await multiSig.submitTransaction(tokenA.address, bobby.address, amount)
   
        // Get the newly submitted transaction
        let txIndex = (await multiSig.getTransactionCount()).sub(1)

        // confirm the transfer
        await multiSig.confirmTransaction(txIndex)

        let transaction = await multiSig.getTransaction(txIndex)

        // Check that the transaction is confirmed
        expect(transaction.adminConfirmations).to.eq(1)

        // Revoke the confirmation
        await multiSig.revokeConfirmation(txIndex)

        transaction = await multiSig.getTransaction(txIndex)

        // Check that the transaction is revoked
        expect(transaction.ownerConfirmations).to.eq(0)
    })

    it("multiSigWallet: revoke confirmation as owner decrements number of confirmations", async () => {
        // Open a new transfer
        let amount = expandTo18Decimals(100)
        await tokenA.transfer(multiSig.address, amount)
         
        await multiSig.submitTransaction(tokenA.address, bobby.address, amount)
   
        // Get the newly submitted transaction
        let txIndex = (await multiSig.getTransactionCount()).sub(1)

        // confirm the transfer
        const multiSigBobby = multiSig.connect(bobby)
        await multiSigBobby.confirmTransaction(txIndex)

        let transaction = await multiSig.getTransaction(txIndex)

        // Check that the transaction is confirmed
        expect(transaction.ownerConfirmations).to.eq(1)

        // Revoke the confirmation
        await multiSigBobby.revokeConfirmation(txIndex)

        transaction = await multiSig.getTransaction(txIndex)

        // Check that the transaction is revoked
        expect(transaction.ownerConfirmations).to.eq(0)
    })

    it("multiSigWallet: revoke confirmation marks caller as not confirmed", async () => {
        // Open a new transfer
        let amount = expandTo18Decimals(100)
        await tokenA.transfer(multiSig.address, amount)
         
        await multiSig.submitTransaction(tokenA.address, bobby.address, amount)
   
        // Get the newly submitted transaction
        let txIndex = (await multiSig.getTransactionCount()).sub(1)

        // confirm the transfer
        const multiSigBobby = multiSig.connect(bobby)
        await multiSigBobby.confirmTransaction(txIndex)

        let transaction = await multiSig.getTransaction(txIndex)

        // Check that the transaction is confirmed
        expect(transaction.ownerConfirmations).to.eq(1)

        // Revoke the confirmation
        await multiSigBobby.revokeConfirmation(txIndex)

        expect(await multiSig.isConfirmed(txIndex, alice.address)).to.be.false
    })

    it("multiSigWallet: revoke confirmation emits RevokeConfirmation event", async () => {
        // Open a new transfer
        let amount = expandTo18Decimals(100)
        await tokenA.transfer(multiSig.address, amount)
         
        await multiSig.submitTransaction(tokenA.address, bobby.address, amount)
   
        // Get the newly submitted transaction
        let txIndex = (await multiSig.getTransactionCount()).sub(1)

        // confirm the transfer
        const multiSigBobby = multiSig.connect(bobby)
        await multiSigBobby.confirmTransaction(txIndex)

        let transaction = await multiSig.getTransaction(txIndex)

        // Check that the transaction is confirmed
        expect(transaction.ownerConfirmations).to.eq(1)

        // Revoke the confirmation
        await expect(multiSigBobby.revokeConfirmation(txIndex))
            .to.emit(multiSig, "RevokeConfirmation")
    })

    it("multiSigWallet: onlyThis restricted functions are not externally callable", async () => {
        await expect(multiSig._transfer(helixToken.address, bobby.address, expandTo18Decimals(100)))
            .to.be.revertedWith("MsgSenderIsNotThis")
        await expect(multiSig._addAdmin(edith.address))
            .to.be.revertedWith("MsgSenderIsNotThis")
        await expect(multiSig._addOwner(edith.address))
            .to.be.revertedWith("MsgSenderIsNotThis")
        await expect(multiSig._removeAdmin(alice.address))
            .to.be.revertedWith("MsgSenderIsNotThis")
        await expect(multiSig._removeOwner(bobby.address))
            .to.be.revertedWith("MsgSenderIsNotThis")
        await expect(multiSig._setAdminConfirmationsRequired(0))
            .to.be.revertedWith("MsgSenderIsNotThis")
        await expect(multiSig._setOwnerConfirmationsRequired(2))
            .to.be.revertedWith("MsgSenderIsNotThis")
    })

    it("multiSigWallet: calls to submit functions by non-admin/owner fail", async () => {
        const multiSigEdith = multiSig.connect(edith)
        await expect(multiSigEdith.submitTransfer(helixToken.address, bobby.address, expandTo18Decimals(100)))
            .to.be.revertedWith("NotAnAdminOrOwner")
        await expect(multiSigEdith.submitAddAdmin(edith.address))
            .to.be.revertedWith("NotAnAdminOrOwner")
        await expect(multiSigEdith.submitAddOwner(edith.address))
            .to.be.revertedWith("NotAnAdminOrOwner")
        await expect(multiSigEdith.submitRemoveAdmin(alice.address))
            .to.be.revertedWith("NotAnAdminOrOwner")
        await expect(multiSigEdith.submitRemoveOwner(bobby.address))
            .to.be.revertedWith("NotAnAdminOrOwner")
        await expect(multiSigEdith.submitSetAdminConfirmationsRequired(0))
            .to.be.revertedWith("NotAnAdminOrOwner")
        await expect(multiSigEdith.submitSetOwnerConfirmationsRequired(2))
            .to.be.revertedWith("NotAnAdminOrOwner")
    })
})
