const { expect } = require("chai")                                                                                                      
                                                                                                   
const { waffle } = require("hardhat")                                                              
const { loadFixture } = waffle                                                                     
                                                                                                   
const { bigNumberify, MaxUint256 } = require("legacy-ethers/utils")                                            
const { expandTo18Decimals, print } = require("./shared/utilities")                                       
const { fullExchangeFixture } = require("./shared/fixtures")                                       
const { constants } = require("@openzeppelin/test-helpers")                                        
                                                                                                   
const verbose = true  

describe("MultiSigWallet", () => {
    let alice, bobby, carol, david, edith
    let owners
    let multiSig
    let tokenA
    let tokenB

    beforeEach(async () => {
        [alice, bobby, carol, david, edith] = await ethers.getSigners()
        owners = [alice.address, bobby.address, carol.address]

        const fixture = await loadFixture(fullExchangeFixture)

        multiSig = fixture.subMultiSigWallet
        tokenA = fixture.tokenA
        tokenB = fixture.tokenB
    })

    it("multiSigWallet: initialized correctly", async () => {
        expect(await multiSig.getAdmins()).to.deep.eq([])
        expect(await multiSig.getOwners()).to.deep.eq(owners)
        expect(await multiSig.adminConfirmationsRequired()).to.eq(0)
        expect(await multiSig.ownerConfirmationsRequired()).to.eq(2)
    })

    it("multiSigWallet: execute transaction if called by non-owner fails", async () => {
        const multiSigDavid = multiSig.connect(david)
        const txIndex = 0
        await expect(multiSigDavid.executeTransaction(txIndex))
            .to.be.revertedWith("NotAnOwner")
    })

    it("multiSigWallet: execute transaction if transaction doex not exist fails", async () => {
        const txIndex = 0
        await expect(multiSig.executeTransaction(txIndex))
            .to.be.revertedWith("TxDoesNotExist")
    })
    
    it("multiSigWallet: execute transaction if master has not confirmed fails", async () => {
        await multiSig.submitTransaction(constants.ZERO_ADDRESS, 0, constants.ZERO_ADDRESS)
        const txIndex = (await multiSig.getTransactionCount()).sub(1)

        await expect(multiSig.executeTransaction(txIndex))
            .to.be.revertedWith("InsufficientConfirmations")
    })

    it("multiSigWallet: execute transaction if transaction already executed fails", async () => {
        // submit transaction
        await multiSig.submitTransaction(constants.ZERO_ADDRESS, 0, constants.ZERO_ADDRESS)
        const txIndex = (await multiSig.getTransactionCount()).sub(1)

        // confirm the transaction as master (alice)
        await multiSig.confirmTransaction(txIndex)

        // confirm the transaction as owner (bobby)
        const multiSigBobby = multiSig.connect(bobby)
        await multiSigBobby.confirmTransaction(txIndex)

        // execute the transaction
        await multiSig.executeTransaction(txIndex)

        // try to execute again
        await expect(multiSig.executeTransaction(txIndex))
            .to.be.revertedWith("TxAlreadyExecuted")
    })

    it("multiSigWallet: execute transaction marks transaction as executed", async () => {
        // submit transaction
        await multiSig.submitTransaction(constants.ZERO_ADDRESS, 0, constants.ZERO_ADDRESS)
        const txIndex = (await multiSig.getTransactionCount()).sub(1)

        // confirm the transaction as master (alice)
        await multiSig.confirmTransaction(txIndex)

        // confirm the transaction as owner (bobby)
        const multiSigBobby = multiSig.connect(bobby)
        await multiSigBobby.confirmTransaction(txIndex)

        // execute the transaction
        await multiSig.executeTransaction(txIndex)

        // confirm that the transaction is marked as executed
        const transaction = await multiSig.getTransaction(txIndex)
        expect(transaction.executed).to.be.true
    })

    it("multiSigWallet: execute transaction emits ExecuteTransaction event", async () => {
        // submit transaction
        await multiSig.submitTransaction(constants.ZERO_ADDRESS, 0, constants.ZERO_ADDRESS)
        const txIndex = (await multiSig.getTransactionCount()).sub(1)

        // confirm the transaction as master (alice)
        await multiSig.confirmTransaction(txIndex)

        // confirm the transaction as owner (bobby)
        const multiSigBobby = multiSig.connect(bobby)
        await multiSigBobby.confirmTransaction(txIndex)

        // execute the transaction
        await expect(multiSig.executeTransaction(txIndex))
            .to.emit(multiSig, "ExecuteTransaction")
    })
})
