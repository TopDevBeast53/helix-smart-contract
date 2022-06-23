const { expect } = require("chai")                                                                                                      
                                                                                                   
const { waffle } = require("hardhat")                                                              
const { loadFixture } = waffle                                                                     
                                                                                                   
const { bigNumberify, MaxUint256 } = require("legacy-ethers/utils")                                            
const { expandTo18Decimals, print } = require("./shared/utilities")                                       
const { fullExchangeFixture } = require("./shared/fixtures")                                       
const { constants } = require("@openzeppelin/test-helpers")                                        
                                                                                                   
const verbose = true  

describe("TokenMultiSigWallet", () => {
    let alice, bobby, carol, david, edith
    let owners
    let tokenMultiSig
    let tokenA
    let tokenB

    beforeEach(async () => {
        [alice, bobby, carol, david, edith] = await ethers.getSigners()
        admins = [alice.address]
        owners = [bobby.address, carol.address, david.address]

        const fixture = await loadFixture(fullExchangeFixture)

        tokenMultiSig = fixture.tokenMultiSigWallet
        tokenA = fixture.tokenA
        tokenB = fixture.tokenB
    })

    it("tokenMultiSigWallet: initialized correctly", async () => {
        expect(await tokenMultiSig.getAdmins()).to.deep.eq(admins)
        expect(await tokenMultiSig.getOwners()).to.deep.eq(owners)
        expect(await tokenMultiSig.numAdminConfirmationsRequired()).to.eq(0)
        expect(await tokenMultiSig.numConfirmationsRequired()).to.eq(2)
        expect(await tokenMultiSig.name()).to.eq("TokenMultiSigWallet")
    })

    it("tokenMultiSigWallet: notify deposit emits NotifyDeposit event", async () => {
        const amount = expandTo18Decimals(100)
        await tokenA.transfer(tokenMultiSig.address, amount)
        await expect(tokenMultiSig.notifyDeposit(tokenA.address, amount))
            .to.emit(tokenMultiSig, "NotifyDeposit")
            .withArgs(
                alice.address,
                tokenA.address,
                amount,
                amount
            )
    })

    it("tokenMultiSigWallet: submit transfer to zero address fails", async () => {
        const amount = expandTo18Decimals(100)
        await expect(tokenMultiSig.submitTransfer(
            tokenA.address, 
            constants.ZERO_ADDRESS, 
            amount)
        ).to.be.revertedWith("ZeroAddress")
    })

    it("tokenMultiSigWallet: submit transfer with no amount fails", async () => {
        const amount = expandTo18Decimals(0)
        await expect(tokenMultiSig.submitTransfer(
            tokenA.address, 
            bobby.address,
            amount)
        ).to.be.revertedWith("ZeroTransferAmount")
    })

    it("tokenMultiSigWallet: submit transfer with insufficient balance fails", async () => {
        let amount = expandTo18Decimals(100)

        // fails when balance == 0
        await expect(tokenMultiSig.submitTransfer(
            tokenA.address, 
            bobby.address,
            amount)
        ).to.be.revertedWith("InsufficientBalance")

        await tokenA.transfer(tokenMultiSig.address, amount)

        // fails when amount == balance + 1
        amount = amount.add(expandTo18Decimals(1))
        await expect(tokenMultiSig.submitTransfer(
            tokenA.address, 
            bobby.address,
            amount)
        ).to.be.revertedWith("InsufficientBalance")
    })

    it("tokenMultiSigWallet: submit transfer as non-owner fails", async () => {
        const amount = expandTo18Decimals(100)
        await tokenA.transfer(tokenMultiSig.address, amount)

        const tokenMultiSigEdith = tokenMultiSig.connect(edith)
        await expect(tokenMultiSigEdith.submitTransfer(
            tokenA.address, 
            bobby.address,
            amount)
        ).to.be.revertedWith("NotAnOwner")
    })

    it("tokenMultiSigWallet: submit transfer creates transaction object", async () => {
        let amount = expandTo18Decimals(100)
        await tokenA.transfer(tokenMultiSig.address, amount)
         
        await tokenMultiSig.submitTransfer(tokenA.address, bobby.address, amount)
    
        const txIndex = (await tokenMultiSig.getTransactionCount()).sub(1)
        const transaction = await tokenMultiSig.getTransaction(txIndex)

        expect(transaction.to).to.eq(tokenMultiSig.address)
        expect(transaction.value).to.eq(0)
        expect(transaction.executed).to.be.false
        expect(transaction.numConfirmations).to.eq(0)
    })

    it("tokenMultiSigWallet: submit transfer emits SubmitTransfer event", async () => {
        let amount = expandTo18Decimals(100)
        await tokenA.transfer(tokenMultiSig.address, amount)
        
        const txIndex = await tokenMultiSig.getTransactionCount()
        await expect(tokenMultiSig.submitTransfer(tokenA.address, bobby.address, amount))
            .to.emit(tokenMultiSig, "SubmitTransfer")
            .withArgs(
                alice.address,
                txIndex,
                tokenA.address,
                bobby.address,
                amount
            )
    })

    it("tokenMultiSigWallet: approve transfer as non-owner fails", async () => {
        // Open a new transfer
        let amount = expandTo18Decimals(100)
        await tokenA.transfer(tokenMultiSig.address, amount)
         
        await tokenMultiSig.submitTransfer(tokenA.address, bobby.address, amount)
    
        const txIndex = (await tokenMultiSig.getTransactionCount()).sub(1)
        const transaction = await tokenMultiSig.getTransaction(txIndex)

        // Approve the transfer as a non-owner
        const tokenMultiSigEdith = tokenMultiSig.connect(edith)
        await expect(tokenMultiSigEdith.approveTransfer(txIndex))
            .to.be.revertedWith("NotAnOwner")
    })

    it("tokenMultiSigWallet: approve transfer when transaction does not exist fails", async () => {
        const txIndex = await tokenMultiSig.getTransactionCount()
         await expect(tokenMultiSig.approveTransfer(txIndex))
            .to.be.revertedWith("TxDoesNotExist")
    })

    it("tokenMultiSigWallet: approve transfer when transaction is executed fails", async () => {
        // Open a new transfer
        let amount = expandTo18Decimals(100)
        await tokenA.transfer(tokenMultiSig.address, amount)
         
        await tokenMultiSig.submitTransfer(tokenA.address, bobby.address, amount)
    
        let txIndex = (await tokenMultiSig.getTransactionCount()).sub(1)

        // Approve the transfer
        const tokenMultiSigBobby = tokenMultiSig.connect(bobby)
        await tokenMultiSigBobby.approveTransfer(txIndex)

        const tokenMultiSigCarol = tokenMultiSig.connect(carol)
        await tokenMultiSigCarol.approveTransfer(txIndex)

        // Execute the transfer
        await tokenMultiSig.executeTransfer(txIndex)
    
        // Approve the transfer
        await expect(tokenMultiSig.approveTransfer(txIndex))
            .to.be.revertedWith("TxAlreadyExecuted")
    })

    it("tokenMultiSigWallet: approve transfer when transaction is confirmed fails", async () => {
        // Open a new transfer
        let amount = expandTo18Decimals(100)
        await tokenA.transfer(tokenMultiSig.address, amount)
         
        await tokenMultiSig.submitTransfer(tokenA.address, bobby.address, amount)
    
        let txIndex = (await tokenMultiSig.getTransactionCount()).sub(1)

        // Approve the transfer
        await tokenMultiSig.approveTransfer(txIndex)

        // Approve the transfer again
        await expect(tokenMultiSig.approveTransfer(txIndex))
            .to.be.revertedWith("")
    })

    it("tokenMultiSigWallet: owner approve transfer increments transaction num confirmations", async () => {
        // Open a new transfer
        let amount = expandTo18Decimals(100)
        await tokenA.transfer(tokenMultiSig.address, amount)
        
        const tokenMultiSigBobby = tokenMultiSig.connect(bobby)
        await tokenMultiSig.submitTransfer(tokenA.address, bobby.address, amount)
    
        let txIndex = (await tokenMultiSig.getTransactionCount()).sub(1)
        let transaction = await tokenMultiSig.getTransaction(txIndex)

        expect(transaction.numConfirmations).to.eq(0)

        // Approve the transfer
        await tokenMultiSigBobby.approveTransfer(txIndex)

        transaction = await tokenMultiSig.getTransaction(txIndex)
        expect(transaction.numConfirmations).to.eq(1)
    })

    it("tokenMultiSigWallet: approve transfer as owner marks caller as confirmed", async () => {
        // Open a new transfer
        let amount = expandTo18Decimals(100)
        await tokenA.transfer(tokenMultiSig.address, amount)
         
        await tokenMultiSig.submitTransfer(tokenA.address, bobby.address, amount)
    
        let txIndex = (await tokenMultiSig.getTransactionCount()).sub(1)
        expect(await tokenMultiSig.isConfirmed(txIndex, alice.address)).to.be.false

        // Approve the transfer
        const tokenMultiSigBobby = tokenMultiSig.connect(bobby)
        await tokenMultiSigBobby.approveTransfer(txIndex)

        expect(await tokenMultiSig.isConfirmed(txIndex, bobby.address)).to.be.true
    })

    it("tokenMultiSigWallet: approve transfer emits ApproveTransfer event", async () => {
        // Open a new transfer
        let amount = expandTo18Decimals(100)
        await tokenA.transfer(tokenMultiSig.address, amount)
         
        await tokenMultiSig.submitTransfer(tokenA.address, bobby.address, amount)
    
        let txIndex = (await tokenMultiSig.getTransactionCount()).sub(1)

        // Approve the transfer
        await expect(tokenMultiSig.approveTransfer(txIndex))
            .to.emit(tokenMultiSig, "ApproveTransfer")
            .withArgs(alice.address, txIndex)
    })

    it("tokenMultiSigWallet: execute transfer as non-owner fails", async () => {
        // Open a new transfer
        let amount = expandTo18Decimals(100)
        await tokenA.transfer(tokenMultiSig.address, amount)
         
        await tokenMultiSig.submitTransfer(tokenA.address, bobby.address, amount)
    
        let txIndex = (await tokenMultiSig.getTransactionCount()).sub(1)
    
        const tokenMultiSigEdith = tokenMultiSig.connect(edith)
        await expect(tokenMultiSigEdith.executeTransfer(txIndex))
            .to.be.revertedWith("NotAnOwner")
    })

    it("tokenMultiSigWallet: execute transfer when transaction does not exist fails", async () => {
        let txIndex = await tokenMultiSig.getTransactionCount()
    
        await expect(tokenMultiSig.executeTransfer(txIndex))
            .to.be.revertedWith("TxDoesNotExist")
    })

    it("tokenMultiSigWallet: execute transfer when transaction is executed fails", async () => {
        // Open a new transfer
        let amount = expandTo18Decimals(100)
        await tokenA.transfer(tokenMultiSig.address, amount)
         
        await tokenMultiSig.submitTransfer(tokenA.address, bobby.address, amount)
   
        // Get the newly submitted transaction
        let txIndex = (await tokenMultiSig.getTransactionCount()).sub(1)

        // Approve the transfer
        const tokenMultiSigBobby = tokenMultiSig.connect(bobby)
        await tokenMultiSigBobby.approveTransfer(txIndex)

        const tokenMultiSigCarol = tokenMultiSig.connect(carol)
        await tokenMultiSigCarol.approveTransfer(txIndex)

        // Execute the transfer
        await tokenMultiSig.executeTransfer(txIndex)
   
        // Execute the transfer again
        await expect(tokenMultiSig.executeTransfer(txIndex))
            .to.be.revertedWith("TxAlreadyExecuted")
    })

    it("tokenMultiSigWallet: execute transfer transfers the funds in the transaction", async () => {
        // Open a new transfer
        let amount = expandTo18Decimals(100)
        await tokenA.transfer(tokenMultiSig.address, amount)
         
        await tokenMultiSig.submitTransfer(tokenA.address, bobby.address, amount)
   
        // Get the newly submitted transaction
        let txIndex = (await tokenMultiSig.getTransactionCount()).sub(1)

        // Approve the transfer
        const tokenMultiSigBobby = tokenMultiSig.connect(bobby)
        await tokenMultiSigBobby.approveTransfer(txIndex)

        const tokenMultiSigCarol = tokenMultiSig.connect(carol)
        await tokenMultiSigCarol.approveTransfer(txIndex)

        // Execute the transfer
        await tokenMultiSig.executeTransfer(txIndex)
   
        expect(await tokenA.balanceOf(bobby.address)).to.eq(amount)
    })

    it("tokenMultiSigWallet: revoke approval as non-owner fails", async () => {
        const tokenMultiSigEdith = tokenMultiSig.connect(edith)
        let txIndex = 0
        await expect(tokenMultiSigEdith.revokeApproval(txIndex))
            .to.be.revertedWith("NotAnOwner")
    })

    it("tokenMultiSigWallet: revoke approval when transaction does not exist faisl", async () => {
        let txIndex = 0
        await expect(tokenMultiSig.revokeApproval(txIndex))
            .to.be.revertedWith("TxDoesNotExist")
    })

    it("tokenMultiSigWallet: revoke approval when transaction already executed fails", async () => {
        // Open a new transfer
        let amount = expandTo18Decimals(100)
        await tokenA.transfer(tokenMultiSig.address, amount)
         
        await tokenMultiSig.submitTransfer(tokenA.address, bobby.address, amount)
   
        // Get the newly submitted transaction
        let txIndex = (await tokenMultiSig.getTransactionCount()).sub(1)

        // Approve the transfer
        const tokenMultiSigBobby = tokenMultiSig.connect(bobby)
        await tokenMultiSigBobby.approveTransfer(txIndex)

        const tokenMultiSigCarol = tokenMultiSig.connect(carol)
        await tokenMultiSigCarol.approveTransfer(txIndex)

        // Execute the transfer
        await tokenMultiSig.executeTransfer(txIndex)

        // Revoke the approval
        await expect(tokenMultiSig.revokeApproval(txIndex))
            .to.be.revertedWith("TxAlreadyExecuted")
    })

    it("tokenMultiSigWallet: revoke approval when transaction not confirmed fails", async () => {
        // Open a new transfer
        let amount = expandTo18Decimals(100)
        await tokenA.transfer(tokenMultiSig.address, amount)
         
        await tokenMultiSig.submitTransfer(tokenA.address, bobby.address, amount)
   
        // Get the newly submitted transaction
        let txIndex = (await tokenMultiSig.getTransactionCount()).sub(1)

        // Revoke the approval
        await expect(tokenMultiSig.revokeApproval(txIndex))
            .to.be.revertedWith("TxNotConfirmed")
    })

    it("tokenMultiSigWallet: revoke approval as owner decrements number of confirmations", async () => {
        // Open a new transfer
        let amount = expandTo18Decimals(100)
        await tokenA.transfer(tokenMultiSig.address, amount)
         
        await tokenMultiSig.submitTransfer(tokenA.address, bobby.address, amount)
   
        // Get the newly submitted transaction
        let txIndex = (await tokenMultiSig.getTransactionCount()).sub(1)

        // Approve the transfer
        const tokenMultiSigBobby = tokenMultiSig.connect(bobby)
        await tokenMultiSigBobby.approveTransfer(txIndex)

        let transaction = await tokenMultiSig.getTransaction(txIndex)

        // Check that the transaction is confirmed
        expect(transaction.numConfirmations).to.eq(1)

        // Revoke the approval
        await tokenMultiSigBobby.revokeApproval(txIndex)

        transaction = await tokenMultiSig.getTransaction(txIndex)

        // Check that the transaction is revoked
        expect(transaction.numConfirmations).to.eq(0)
    })

    it("tokenMultiSigWallet: revoke approval marks caller as not confirmed", async () => {
        // Open a new transfer
        let amount = expandTo18Decimals(100)
        await tokenA.transfer(tokenMultiSig.address, amount)
         
        await tokenMultiSig.submitTransfer(tokenA.address, bobby.address, amount)
   
        // Get the newly submitted transaction
        let txIndex = (await tokenMultiSig.getTransactionCount()).sub(1)

        // Approve the transfer
        const tokenMultiSigBobby = tokenMultiSig.connect(bobby)
        await tokenMultiSigBobby.approveTransfer(txIndex)

        let transaction = await tokenMultiSig.getTransaction(txIndex)

        // Check that the transaction is confirmed
        expect(transaction.numConfirmations).to.eq(1)

        // Revoke the approval
        await tokenMultiSigBobby.revokeApproval(txIndex)

        expect(await tokenMultiSig.isConfirmed(txIndex, alice.address)).to.be.false
    })

    it("tokenMultiSigWallet: revoke approval marks caller as not confirmed", async () => {
        // Open a new transfer
        let amount = expandTo18Decimals(100)
        await tokenA.transfer(tokenMultiSig.address, amount)
         
        await tokenMultiSig.submitTransfer(tokenA.address, bobby.address, amount)
   
        // Get the newly submitted transaction
        let txIndex = (await tokenMultiSig.getTransactionCount()).sub(1)

        // Approve the transfer
        const tokenMultiSigBobby = tokenMultiSig.connect(bobby)
        await tokenMultiSigBobby.approveTransfer(txIndex)

        let transaction = await tokenMultiSig.getTransaction(txIndex)

        // Check that the transaction is confirmed
        expect(transaction.numConfirmations).to.eq(1)

        // Revoke the approval
        await expect(tokenMultiSigBobby.revokeApproval(txIndex))
            .to.emit(tokenMultiSig, "RevokeApproval")
    })

    it("tokenMultiSigWallet: get balance returns the contract token balance", async () => {
        const amountA = expandTo18Decimals(100)
        await tokenA.transfer(tokenMultiSig.address, amountA)
        expect(await tokenMultiSig.getBalance(tokenA.address)).to.eq(amountA)

        const amountB = expandTo18Decimals(1000)
        await tokenB.transfer(tokenMultiSig.address, amountB)
        expect(await tokenMultiSig.getBalance(tokenB.address)).to.eq(amountB)
    })
})
