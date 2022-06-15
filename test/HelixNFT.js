const { expect } = require("chai")                                                                   
                                                                                                     
const { waffle } = require("hardhat")                                                                
const { loadFixture } = waffle                                                                       
                                                                                                     
const { bigNumberify, MaxUint256 } = require("legacy-ethers/utils")                                  
const { expandTo18Decimals } = require("./shared/utilities")                                         
const { fullExchangeFixture } = require("./shared/fixtures")                                       
const { constants } = require("@openzeppelin/test-helpers")                                        
                                                                                                   
const verbose = true                                                                               
                           
const BASE_URI_TEST = 'https://niftyroyale.mypinata.cloud/ipfs/QmQRi3cigw8rjVP5BWAQxxBWQyMjXKfy8W4LZieMKtHbzK'
const INITIAL_HELIXPOINTS = 5
const LEVELUPPERCENT = 10
const REWARD_PER_BLOCK = 3

describe("HelixNFT", () => {
    let deployer, helixNftMinter, helixNftAccruer, alice, betty
    let helixNFT
    let helixChefNFT
    let tx, receipt

    beforeEach(async () => {
        [deployer, helixNftMinter, alice, betty] = await ethers.getSigners()

        const fixture = await loadFixture(fullExchangeFixture)
        helixNFT = fixture.helixNft
        helixChefNFT = fixture.helixChefNft

        // Set `HelixChefNFT` contract as staker of HelixNFT
        tx = await helixNFT.addStaker(helixChefNFT.address)
        receipt = await tx.wait()
        expect(receipt.status).to.eq(1)

        // Add `helixNftMinter` as minter of HelixNFT
        tx = await helixNFT.addMinter(helixNftMinter.address)
        receipt = await tx.wait()
        expect(receipt.status).to.eq(1)

        tx = await helixNFT.addMinter(deployer.address)
        receipt = await tx.wait()
        expect(receipt.status).to.eq(1)

        //mint HelixNFT to `alice` by `helixNftMinter`
        await helixNFT.mint(alice.address)      // created tokenId will be 1.
        expect(await helixNFT.ownerOf(1)).to.eq(alice.address)

        await helixNFT.mint(alice.address)      // created tokenId will be 2.
        expect(await helixNFT.ownerOf(2)).to.eq(alice.address)
    })

    describe("When token is deployed", async () => {
        it('Check owner, minter, staker, accruer', async () => {
            expect(await helixNFT.owner()).to.eq(deployer.address)
            expect(await helixNFT.isMinter(helixNftMinter.address)).to.be.true
            expect(await helixNFT.isStaker(helixChefNFT.address)).to.be.true
        })
    })
})
