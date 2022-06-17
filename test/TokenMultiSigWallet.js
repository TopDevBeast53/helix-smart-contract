/*
const { expect } = require("chai")                                                                                                      
                                                                                                   
const { waffle } = require("hardhat")                                                              
const { loadFixture, createFixtureLoader } = waffle                                                                     
                                                                                                   
const { bigNumberify, MaxUint256 } = require("legacy-ethers/utils")                                            
const { expandTo18Decimals, print } = require("./shared/utilities")                                       
const { fullExchangeFixture } = require("./shared/fixtures")                                       
const { constants } = require("@openzeppelin/test-helpers")                                        
                                                                                                   
const verbose = true  

describe('TokenMultiSigWallet', () => {
    let deployer, alice, bobby, carol, david, edith
    let tokenMultiSig

    let tokenA
    let tokenB

    let wallet, user

    beforeEach(async () => {
        [deployer, alice, bobby, carol, david, edith] = await ethers.getSigners()

        // Load all the contracts used in creating swapRewards contract.
        const fixture = await loadFixture(fullExchangeFixture)
        factory = fixture.factory
        router = fixture.router
        oracleFactory = fixture.oracleFactory
        refReg = fixture.referralRegister
        swapRewards = fixture.swapRewards
        helixToken = fixture.helixToken
        helixNFT = fixture.helixNFT
        tokenA = fixture.tokenA
        tokenB = fixture.tokenB

        await initPairs(tokenA, tokenB)

        // Add the user as the wallet's referrer
        await refReg.addReferrer(user.address)
    })
})
*/
