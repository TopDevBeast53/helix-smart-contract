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

describe("MultiSigWallet", () => {
    let alice, bobby, carol, david, edith
    let owners
    let multiSig
    let helixToken
    let tokenA
    let tokenB

    beforeEach(async () => {
        [alice, bobby, carol, david, edith] = await ethers.getSigners()
        admins = [alice.address]
        owners = [bobby.address, carol.address]

        const fixture = await loadFixture(fullExchangeFixture)

        multiSig = fixture.multiSigWallet
        helixToken = fixture.helixToken
        tokenA = fixture.tokenA
        tokenB = fixture.tokenB
    })

    it("multiSigWallet: initialized correctly", async () => {
        expect(await multiSig.getAdmins()).to.deep.eq(admins)
        expect(await multiSig.getOwners()).to.deep.eq(owners)
        expect(await multiSig.adminConfirmationsRequired()).to.eq(1)
        expect(await multiSig.ownerConfirmationsRequired()).to.eq(1)
    })

    it("multiSigWallet: submit transfer as non-owner fails", async () => {
        const amount = expandTo18Decimals(100)
        await tokenA.transfer(multiSig.address, amount)

        const multiSigEdith = multiSig.connect(edith)
        await expect(multiSigEdith.submitTransaction(
            tokenA.address, 
            bobby.address,
            amount)
        ).to.be.revertedWith("NotAnOwner")
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

    it("multiSigWallet: confirm transfer as non-owner fails", async () => {
        // Open a new transfer
        let amount = expandTo18Decimals(100)
        await tokenA.transfer(multiSig.address, amount)
         
        await multiSig.submitTransaction(tokenA.address, bobby.address, amount)
    
        const txIndex = (await multiSig.getTransactionCount()).sub(1)
        const transaction = await multiSig.getTransaction(txIndex)

        // confirm the transfer as a non-owner
        const multiSigEdith = multiSig.connect(edith)
        await expect(multiSigEdith.confirmTransaction(txIndex))
            .to.be.revertedWith("NotAnOwner")
    })

    it("multiSigWallet: confirm transfer when transaction does not exist fails", async () => {
        const txIndex = await multiSig.getTransactionCount()
         await expect(multiSig.confirmTransaction(txIndex))
            .to.be.revertedWith("TxDoesNotExist")
    })

    it("multiSigWallet: confirm transfer when transaction is executed fails", async () => {
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

    it("multiSigWallet: confirm transfer when transaction is confirmed fails", async () => {
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

    it("multiSigWallet: owner confirm transfer increments transaction num confirmations", async () => {
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
         
        await multiSig.submitTransaction(tokenA.address, bobby.address, amount)
    
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

    it("multiSigWallet: execute transfer as non-owner fails", async () => {
        // Open a new transfer
        let amount = expandTo18Decimals(100)
        await tokenA.transfer(multiSig.address, amount)
         
        await multiSig.submitTransaction(tokenA.address, bobby.address, amount)
    
        let txIndex = (await multiSig.getTransactionCount()).sub(1)
    
        const multiSigEdith = multiSig.connect(edith)
        await expect(multiSigEdith.executeTransaction(txIndex))
            .to.be.revertedWith("NotAnOwner")
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

    it("multiSigWallet: revoke confirmation as non-owner fails", async () => {
        const multiSigEdith = multiSig.connect(edith)
        let txIndex = 0
        await expect(multiSigEdith.revokeConfirmation(txIndex))
            .to.be.revertedWith("NotAnOwner")
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
        await expect(multiSigBobby.revokeConfirmation(txIndex))
            .to.emit(multiSig, "RevokeConfirmation")
    })

    it("multiSigWallet: add owner", async () => {
        // Submit an add owner tx
        await multiSig.submitAddOwner(edith.address)

        // Get the txIndex
        const addOwnerTxIndex = (await multiSig.getTransactionCount()) - 1

        // Confirm the tx as admin
        await multiSig.confirmTransaction(addOwnerTxIndex)

        // Confirm the tx as owners
        const multiSigBobby = await multiSig.connect(bobby)
        await multiSigBobby.confirmTransaction(addOwnerTxIndex)

        const multiSigCarol = await multiSig.connect(carol)
        await multiSigCarol.confirmTransaction(addOwnerTxIndex)

        // Expect the tx to have required admin and owner confirmations
        const tx = await multiSig.getTransaction(addOwnerTxIndex)

        const adminConfirmationsRequired = await multiSig.adminConfirmationsRequired()
        const ownerConfirmationsRequired = await multiSig.ownerConfirmationsRequired()

        expect(tx.adminConfirmations).to.be.at.least(adminConfirmationsRequired)
        expect(tx.ownerConfirmations).to.be.at.least(ownerConfirmationsRequired)

        // Execute the tx
        await multiSig.executeTransaction(addOwnerTxIndex) 
    })
})
