const { expect } = require("chai")                                                                                                      
                                                                                                   
const { waffle } = require("hardhat")                                                              
const { loadFixture, createFixtureLoader, createMockProvider, getWallets } = waffle                                                                     
                                                                                                   
const { bigNumberify, MaxUint256 } = require("legacy-ethers/utils")                                            
const { expandTo18Decimals, print } = require("./shared/utilities")                                       
const { fullExchangeFixture } = require("./shared/fixtures")                                       
const { constants } = require("@openzeppelin/test-helpers")                                        
                                                                                                   
const verbose = true  

describe("TokenMultiSigWallet", () => {
    let alice, bobby, carol, david, edith
    let owners
    let subMultiSig
    let tokenA
    let tokenB

    beforeEach(async () => {
        [alice, bobby, carol, david, edith] = await ethers.getSigners()
        owners = [alice.address, bobby.address, carol.address]

        const loadFixture = createFixtureLoader(owners, createMockProvider)
        const fixture = await loadFixture(fullExchangeFixture)

        subMultiSig = fixture.subMultiSigWallet
        tokenA = fixture.tokenA
        tokenB = fixture.tokenB
    })

    it("subMultiSigWallet: initialized correctly", async () => {
        expect(await subMultiSig.getOwners()).to.deep.eq(owners)
        expect(await subMultiSig.numConfirmationsRequired()).to.eq(2)
    })

    it("subMultiSigWallet: execute transaction if called by non-owner fails", async () => {
        const subMultiSigDavid = subMultiSig.connect(david)
        const txIndex = 0
        await expect(subMultiSigDavid.executeTransaction(txIndex))
            .to.be.revertedWith("NotAnOwner")
    })

    it("subMultiSigWallet: execute transaction if transaction doex not exist fails", async () => {
        const txIndex = 0
        await expect(subMultiSig.executeTransaction(txIndex))
            .to.be.revertedWith("TxDoesNotExist")
    })
    
    it("subMultiSigWallet: execute transaction if master has not confirmed fails", async () => {
        await subMultiSig.submitTransaction(constants.ZERO_ADDRESS, 0, constants.ZERO_ADDRESS)
        const txIndex = (await subMultiSig.getTransactionCount()).sub(1)

        await expect(subMultiSig.executeTransaction(txIndex))
            .to.be.revertedWith("NotMasterConfirmed")
    })

    it("subMultiSigWallet: execute transaction", async () => {
        // submit transaction
        await subMultiSig.submitTransaction(constants.ZERO_ADDRESS, 0, constants.ZERO_ADDRESS)
        const txIndex = (await subMultiSig.getTransactionCount()).sub(1)

        // confirm the transaction as master (alice)
        await subMultiSig.confirmTransaction(txIndex)

        // confirm the transaction as owner (bobby)
        const subMultiSigBobby = subMultiSig.connect(bobby)
        await subMultiSigBobby.confirmTransaction(txIndex)

        // execute the transaction
        await subMultiSig.executeTransaction(txIndex)

        // confirm that the transaction is marked as executed
        const transaction = await subMultiSig.getTransaction(txIndex)
        expect(transaction.executed).to.be.true
    })
})
