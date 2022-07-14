const { expect } = require("chai")                                                                                                      
                                                                                                   
const { waffle } = require("hardhat")                                                              
const { loadFixture } = waffle                                                                     
                                                                                                   
const { bigNumberify, MaxUint256 } = require("legacy-ethers/utils")                                            
const { expandTo18Decimals, print } = require("./shared/utilities")                                       
const { fullExchangeFixture } = require("./shared/fixtures")                                       
const { constants } = require("@openzeppelin/test-helpers")                                        
                                                                                                   
const verbose = true  

describe("AdvisorRewards", () => {
    let alice, bobby, carol, david, edith
    let multiSig
    let helixToken
    let tokenA
    let tokenB
    let referralRegister

    beforeEach(async () => {
        [alice, bobby, carol, david, edith] = await ethers.getSigners()

        const fixture = await loadFixture(fullExchangeFixture)

        advisorRewards = fixture.advisorRewards
    })

    it("advisorRewards: initialized correctly", async () => {
    })
})
