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

describe("HelixChefNft", () => {
    let deployer, minter, alice, carol, dev, refFeeAddr, safuAddr
    let helixNft
    let helixChefNFT
    let tx, receipt
    let rewardToken

    beforeEach(async () => {
        [deployer, minter, alice, carol, dev, refFeeAddr, safuAddr] = await ethers.getSigners()

        const fixture = await loadFixture(fullExchangeFixture)
        helixNft = fixture.helixNft
        helixChefNft = fixture.helixChefNft

        //Add `minter` as minter of helixNft
        tx = await helixNft.addMinter(minter.address)
        receipt = await tx.wait()
        expect(receipt.status).to.eq(1)

        //mint helixNft to `alice` by `minter`
        const helixNftMinter = helixNft.connect(minter)

        await helixNftMinter.mint(alice.address)        // created tokenId will be 1.
        expect(await helixNft.ownerOf(1)).to.eq(alice.address)
        await helixNftMinter.mint(alice.address)        // created tokenId will be 2.
        expect(await helixNft.ownerOf(2)).to.eq(alice.address)

        //mint helixNft to `carol` by `minter`
        await helixNftMinter.mint(carol.address)             // created tokenId will be 3.
        expect(await helixNft.ownerOf(3)).to.eq(carol.address)
        await helixNftMinter.mint(carol.address)             // created tokenId will be 3.
        expect(await helixNft.ownerOf(4)).to.eq(carol.address)

        /*
        //Create RewardToken which named 'RWT' as symbol
        const rewardTokenContractFactory = await ethers.getContractFactory('BEP20') 
        rewardToken = await BEP20.new('RewardToken', 'RWT1', { from: deployer })
        assert.equal((await this.rwt1.preMineSupply()).toString(), '10000000000000000000000000')
        await this.rwt1.transfer(this.helixChefNFT.address, 1000000, {from: deployer})

        //Add RewardToken
        //addNewRewardToken(address newToken, uint startBlock, uint rewardPerBlock)
        await this.helixChefNFT.addNewRewardToken(this.rwt1.address, 0, REWARD_PER_BLOCK, { from: deployer })
        let listRewardTokens = await this.helixChefNFT.getListRewardTokens()
        assert.equal(listRewardTokens[0].toString(), this.rwt1.address.toString())
        */
    })

    describe("When token is deployed", async () => {
        it('Check owner, minter, staker', async () => {
            /*
            assert.equal((await this.helixNft.owner()).toString(), deployer.toString())
            assert.equal(await this.helixNft.isMinter(minter), true)
            assert.equal(await this.helixNft.isStaker(this.helixChefNFT.address), true)
            */
        })
    })

    /*
    describe("Initialize of Staking", async () => {
        it('When an user stakes, the helixPointAmount of user should have a default amount', async () => {
            await this.helixChefNFT.stake([1, 2], { from: alice })
            assert.equal((await this.helixChefNFT.getUserHelixPointAmount(alice)).toString(), (INITIAL_HELIXPOINTS * 2).toString())
        })
        it('Check token Owner', async () => {
            await expectRevert.unspecified(this.helixChefNFT.stake([1, 2], { from: carol }))//Not token owner
        })
        it('Double staking of an helixNft is not acceptable', async () => {
            await this.helixChefNFT.stake([1], { from: alice })
            await expectRevert.unspecified(this.helixChefNFT.stake([1], { from: alice }))//Token has already been staked
        })
    })

    describe("Calculation reward of Staking", async () => {
        it('Calc pending reward when one person staked', async () => {
            let startBlockNumber = parseInt((await time.latestBlock()).toString())
            await this.helixChefNFT.stake([1], { from: alice })// block.number is increased
         
            let res
            await time.advanceBlockTo(startBlockNumber + 21)
            res = await this.helixChefNFT.pendingReward(alice)// eventually, passed 20 from start
            assert.equal((res[0]).toString(), this.rwt1.address)// check reward token address
            assert.equal((res[1]).toString(), (REWARD_PER_BLOCK * 20).toString())

            await time.advanceBlockTo(startBlockNumber + 31)
            res = await this.helixChefNFT.pendingReward(alice)// eventually, passed 30 from start
            assert.equal((res[1]).toString(), (REWARD_PER_BLOCK * 30).toString())

            await this.helixChefNFT.withdrawRewardToken({ from: alice })// block.number is increased
            assert.equal((await this.rwt1.balanceOf(alice)).toString(), (REWARD_PER_BLOCK * (30 + 1)).toString())

            startBlockNumber = parseInt((await time.latestBlock()).toString())
            await this.helixChefNFT.stake([2], { from: alice })
            assert.equal((await this.rwt1.balanceOf(alice)).toString(), (REWARD_PER_BLOCK * (30 + 1 + 1)).toString())//because withdrawal before stake newly
         
            await time.advanceBlockTo(startBlockNumber + 11)
            assert.equal(((await this.helixChefNFT.pendingReward(alice))[1]).toString(), (REWARD_PER_BLOCK * 10).toString())
            assert.equal((await this.helixChefNFT.getUserHelixPointAmount(alice)).toString(), (INITIAL_HELIXPOINTS * 2).toString())
        })
     
        it('Calc withdrawReward when 2 persons staked', async () => {
            let res, _blockNumber
            await this.helixChefNFT.stake([1, 2], { from: alice })
            await this.helixChefNFT.stake([3], { from: carol })

            _blockNumber = parseInt((await time.latestBlock()).toString())
            await time.advanceBlockTo(_blockNumber + 10)
         
            await this.helixChefNFT.withdrawRewardToken({ from: alice })
            assert.equal((await this.rwt1.balanceOf(alice)).toString(), '25')

            await this.helixChefNFT.withdrawRewardToken({ from: carol })
            assert.equal((await this.rwt1.balanceOf(carol)).toString(), '12')
        })
     
    })
    */
})
