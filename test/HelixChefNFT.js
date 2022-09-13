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
    let deployer, minter, alice, bobby, carol, dev, refFeeAddr, safuAddr
    let helixNft
    let helixChefNft
    let tx, receipt
    let helixToken
    let feeMinter

    const totalToMintPerBlock = expandTo18Decimals(100)
    
    beforeEach(async () => {
        [deployer, minter, alice, bobby, carol, dev, refFeeAddr, safuAddr] = await ethers.getSigners()

        const fixture = await loadFixture(fullExchangeFixture)
        helixNft = fixture.helixNft
        helixChefNft = fixture.helixChefNft
        helixToken = fixture.helixToken 
        feeMinter = fixture.feeMinter

        //Add `minter` as minter of helixNft
        const tx = await helixNft.addMinter(minter.address)
        receipt = await tx.wait()
        expect(receipt.status).to.eq(1)

        //mint helixNft to `alice` by `minter`
        const helixNftMinter = helixNft.connect(minter)

        await helixNftMinter.mint(alice.address)             // created tokenId will be 1.
        expect(await helixNft.ownerOf(1)).to.eq(alice.address)
        await helixNftMinter.mint(alice.address)             // created tokenId will be 2.
        expect(await helixNft.ownerOf(2)).to.eq(alice.address)

        //mint helixNft to `bobby` by `minter`
        await helixNftMinter.mint(bobby.address)             // created tokenId will be 3.
        expect(await helixNft.ownerOf(3)).to.eq(bobby.address)
        await helixNftMinter.mint(bobby.address)             // created tokenId will be 4.
        expect(await helixNft.ownerOf(4)).to.eq(bobby.address)

        //mint helixNft to `carol` by `minter`
        await helixNftMinter.mint(carol.address)             // created tokenId will be 5
        expect(await helixNft.ownerOf(5)).to.eq(carol.address)
        await helixNftMinter.mint(carol.address)             // created tokenId will be 6
        expect(await helixNft.ownerOf(6)).to.eq(carol.address)

        // config the feeMinter
        await feeMinter.setTotalToMintPerBlock(totalToMintPerBlock)
        const minters = [helixChefNft.address]
        const toMintPercents = [10000]
        await feeMinter.setToMintPercents(minters, toMintPercents)

        // make helixChefNft a helixToken minter
        await helixToken.addMinter(helixChefNft.address)
    })

    it("initialized correctly", async () => {
        expect(await helixChefNft.helixNFT()).to.eq(helixNft.address)
        expect(await helixChefNft.helixToken()).to.eq(helixToken.address)
        expect(await helixChefNft.feeMinter()).to.eq(feeMinter.address)
       
        expect(await feeMinter.totalToMintPerBlock()).to.eq(totalToMintPerBlock)
        expect(await feeMinter.getMinters()).to.deep.eq([helixChefNft.address])
        expect(await feeMinter.getToMintPercent(helixChefNft.address)).to.eq(10000)
    })

    describe("updatePool", async () => {
        it("increments the lastUpdateBlock", async () => {
            await helixChefNft.updatePool()
            const prevUpdateBlock = await helixChefNft.lastUpdateBlock()

            // mine 256 blocks and update again
            await hre.network.provider.send("hardhat_mine", ["0x100"])
            await helixChefNft.updatePool()
        
            expect(await helixChefNft.lastUpdateBlock()).to.be.eq(prevUpdateBlock.add(256).add(1)) 
        })

        it("updates the accTokenPerShare", async () => {
            // update the pool so that it's as up-to-date as possible
            await helixChefNft.updatePool()

            // record the data before staking
            const prevAccTokenPerShare = await helixChefNft.accTokenPerShare()
           
            // stake and update so that rewards are accruing
            await helixChefNft.connect(alice).stake([1])
            await helixChefNft.updatePool()

            // calculate the expected accumulatedTokensPerShare 
            const blockDelta = 2 
            const totalStakedNfts = await helixChefNft.totalStakedNfts()
            const rewardsPerBlock = await feeMinter.getToMintPerBlock(helixChefNft.address)
            const rewards = rewardsPerBlock.mul(blockDelta - 1) // sub 1 because rewards only accruing for 1 block (not 2)
            const expectedAccTokenPerShare = prevAccTokenPerShare.add(rewards.mul(1e12).div(totalStakedNfts))

            // check that the results are as expected
            const accTokenPerShare = await helixChefNft.accTokenPerShare()
            expect(accTokenPerShare).to.eq(expectedAccTokenPerShare)
        })

        it("emits UpdatePool event", async () => {
            await helixChefNft.updatePool()

            // check that it emits event when only updating lastUpdateBlock
            const blockDelta = 1
            await hre.network.provider.send("hardhat_mine", [hex(blockDelta)])
            await expect(helixChefNft.updatePool()).to.emit(helixChefNft, "UpdatePool")

            // check that it emits when totalStakedNfts > 0
            await helixChefNft.connect(alice).stake([1])
            await expect(helixChefNft.updatePool()).to.emit(helixChefNft, "UpdatePool")
        })
    })

    describe("harvestRewards", async () => {
        it("updatePool is called", async () => {
            await expect(helixChefNft.harvestRewards()).to.emit(helixChefNft, "UpdatePool")
        })

        it("emits HarvestRewards event", async () => {
            await helixChefNft.connect(alice).stake([1])
            await expect(helixChefNft.connect(alice).harvestRewards()).to.emit(helixChefNft, "HarvestRewards")
        })

        it("mints helix to harvester", async () => {
            await helixChefNft.connect(alice).stake([1])

            const prevBalance = await helixToken.balanceOf(alice.address)
            const aliceUserInfo = await helixChefNft.users(alice.address)
            const rewardDebt = aliceUserInfo.rewardDebt
            const stakedNfts = aliceUserInfo.stakedNfts

            const blockDelta = 256
            await hre.network.provider.send("hardhat_mine", [hex(blockDelta)])
            await helixChefNft.connect(alice).harvestRewards()

            const accTokenPerShare = await helixChefNft.accTokenPerShare()
            const rewards = (stakedNfts.mul(accTokenPerShare).div(1e12)).sub(rewardDebt)
            const expectedBalance = prevBalance.add(rewards)

            expect(await helixToken.balanceOf(alice.address)).to.eq(expectedBalance)
        })

        it("updates the harvester's rewardDebt", async () => {
            const prevAliceUserInfo  = await helixChefNft.users(alice.address)
            const prevRewardDebt = prevAliceUserInfo.rewardDebt

            await helixChefNft.connect(alice).stake([1])
            await helixChefNft.connect(alice).harvestRewards()

            const aliceUserInfo  = await helixChefNft.users(alice.address)
            const stakedNfts = aliceUserInfo.stakedNfts
            const accTokenPerShare = await helixChefNft.accTokenPerShare()
            const calcRewardDebt = stakedNfts.mul(accTokenPerShare).div(1e12)
            const expectedRewardDebt = prevRewardDebt.add(calcRewardDebt)

            const rewardDebt = aliceUserInfo.rewardDebt
            
            expect(rewardDebt).to.eq(expectedRewardDebt)
        })
    })

    describe("stake", async () => {
        it("emits Stake event", async () => {
            await expect(helixChefNft.connect(alice).stake([1])).to.emit(helixChefNft, "Stake")
        })

        it("updates the pool", async () => {
            // update the pool so that it's as up-to-date as possible
            await helixChefNft.updatePool()

            // record the data before staking
            const prevLastUpdateBlock = await helixChefNft.lastUpdateBlock()
            const prevAccTokenPerShare = await helixChefNft.accTokenPerShare()
           
            // stake and update so that rewards are accruing
            await helixChefNft.connect(alice).stake([1])
            await helixChefNft.updatePool()

            // get the data after staking
            const lastUpdateBlock = await helixChefNft.lastUpdateBlock()
            const accTokenPerShare = await helixChefNft.accTokenPerShare()

            // expect the lastUpdateBlock to be incremented by 2
            const blockDelta = 2 
            expect(lastUpdateBlock).to.eq(prevLastUpdateBlock.add(blockDelta))

            // calculate the expected accumulatedTokensPerShare 
            const totalStakedNfts = await helixChefNft.totalStakedNfts()
            const rewardsPerBlock = await feeMinter.getToMintPerBlock(helixChefNft.address)
            const rewards = rewardsPerBlock.mul(blockDelta - 1) // sub 1 because rewards only accruing for 1 block (not 2)
            const expectedAccTokenPerShare = prevAccTokenPerShare.add(rewards.mul(1e12).div(totalStakedNfts))
            expect(accTokenPerShare).to.eq(expectedAccTokenPerShare)
        })

        it("increments the user's staked nfts", async () => {
            const prevUserStakedNfts = (await helixChefNft.users(alice.address)).stakedNfts
            await helixChefNft.connect(alice).stake([1])
            const userStakedNfts = (await helixChefNft.users(alice.address)).stakedNfts
            expect(userStakedNfts).to.eq(prevUserStakedNfts.add(1))
        })

        it("increments the total staked nfts", async () => {
            const prevTotalStakedNfts = await helixChefNft.totalStakedNfts()
            await helixChefNft.connect(alice).stake([1])
            expect(await helixChefNft.totalStakedNfts()).to.eq(prevTotalStakedNfts.add(1))
        })

        it("harvests rewards", async () => {
            await helixChefNft.updatePool()
            await helixChefNft.connect(alice).stake([1])

            const prevBalance = await helixToken.balanceOf(alice.address)
            const aliceUserInfo = await helixChefNft.users(alice.address)
            const rewardDebt = aliceUserInfo.rewardDebt
            const stakedNfts = aliceUserInfo.stakedNfts

            await helixChefNft.connect(alice).stake([2])
            
            const accTokenPerShare = await helixChefNft.accTokenPerShare()
            const rewards = (stakedNfts.mul(accTokenPerShare).div(1e12)).sub(rewardDebt)
            const expectedBalance = prevBalance.add(rewards)

            expect(await helixToken.balanceOf(alice.address)).to.eq(expectedBalance)
        })

        it("fails if no tokenIds passed", async () => {
            await expect(helixChefNft.connect(alice).stake([]))
                .to.be.revertedWith("tokenIds length can not be zero")
        })

        it("fails if staking same nft more than once", async () => {
            await helixChefNft.connect(alice).stake([1])
            await expect(helixChefNft.connect(alice).stake([1]))
                .to.be.revertedWith("token is already staked")
        })

        it("fails if staker is not token owner", async () => {
            await expect(helixChefNft.connect(bobby).stake([1]))
                .to.be.revertedWith("caller is not token owner")
        })

        it("staking allows re-unstaking the nft", async () => {
            // can't unstake the same nft twice without staking
            await helixChefNft.connect(alice).stake([1])
            await helixChefNft.connect(alice).stake([2])
            await helixChefNft.connect(alice).unstake([1])
            await expect(helixChefNft.connect(alice).unstake([1]))
                .to.be.revertedWith("token is already unstaked")


            await helixChefNft.connect(alice).stake([1])
            await helixChefNft.connect(alice).unstake([1])
        })

        it("stake multiple tokens", async () => {
            const prevAliceUserInfo = await helixChefNft.users(alice.address)
            const prevStakedNfts = prevAliceUserInfo.stakedNfts
            const prevTotalStakedNfts = await helixChefNft.totalStakedNfts()

            await helixChefNft.connect(alice).stake([1, 2])
            
            // increments alice staked nfts by 2
            const aliceUserInfo = await helixChefNft.users(alice.address)
            const stakedNfts = aliceUserInfo.stakedNfts
            expect(stakedNfts).to.eq(prevStakedNfts.add(2))

            // increments total staked nfts by 2
            const totalStakedNfts = await helixChefNft.totalStakedNfts()
            expect(totalStakedNfts).to.eq(prevTotalStakedNfts.add(2))
        })
    })

    describe("unstake", async () => {
        it("fails if no tokenIds passed", async () => {
            await expect(helixChefNft.connect(alice).unstake([]))
                .to.be.revertedWith("tokenIds length can not be zero")
        }) 

        it("fails if caller hasn't staked any nfts", async () => {
            await expect(helixChefNft.connect(alice).unstake([1]))
                .to.be.revertedWith("caller has not staked any nfts")
        })

        it("updates the pool", async () => {
            await helixChefNft.connect(alice).stake([1])
            await expect(helixChefNft.connect(alice).unstake([1]))
                .to.emit(helixChefNft, "UpdatePool")
        })

        it("harvests rewards", async () => {
            await helixChefNft.connect(alice).stake([1])
            await expect(helixChefNft.connect(alice).unstake([1]))
                .to.emit(helixChefNft, "HarvestRewards")
        })

        it("decrements the users staked nfts", async () => {
            await helixChefNft.connect(alice).stake([1])
            const prevAliceUserInfo = await helixChefNft.users(alice.address)
            const prevStakedNfts = prevAliceUserInfo.stakedNfts

            await helixChefNft.connect(alice).unstake([1])
            const aliceUserInfo = await helixChefNft.users(alice.address)
            const stakedNfts = aliceUserInfo.stakedNfts

            expect(stakedNfts).to.eq(prevStakedNfts.sub(1))
        })

        it("decrements the total staked nfts", async () => {
            await helixChefNft.connect(alice).stake([1])
            const prevTotalStakedNfts = await helixChefNft.totalStakedNfts()

            await helixChefNft.connect(alice).unstake([1])
            const totalStakedNfts = await helixChefNft.totalStakedNfts()

            expect(totalStakedNfts).to.eq(prevTotalStakedNfts.sub(1))
        })

        it("emits Unstake event", async () => {
            await helixChefNft.connect(alice).stake([1])
            await expect(helixChefNft.connect(alice).unstake([1]))
                .to.emit(helixChefNft, "Unstake")
        })

        it("unstaking allows re-staking the nft", async () => {
            // can't stake the same nft twice without first unstaking
            await helixChefNft.connect(alice).stake([1])
            await expect(helixChefNft.connect(alice).stake([1]))
                .to.be.revertedWith("token is already staked")

            
            await helixChefNft.connect(alice).unstake([1])
            await helixChefNft.connect(alice).stake([1])
        })
    })

    describe("getPendingReward", async () => {
        it("returns the correct reward with a single staker", async () => {
            // alice stakes tokens
            await helixChefNft.connect(alice).stake([1])

            const rewardPerBlock = await feeMinter.getToMintPerBlock(helixChefNft.address)
            const blockDelta = 256
            const expectedReward = rewardPerBlock.mul(blockDelta)
            
            // wait 256 blocks
            await hre.network.provider.send("hardhat_mine", [hex(blockDelta)])

            const pendingReward = await helixChefNft.getPendingReward(alice.address)
            expect(pendingReward).to.eq(expectedReward)
        })
    })

    it("multiple users stake and collect rewards", async () => {
        // Mint 2 more nfts to Bobby so that he has a total of 4 nfts
        await helixNft.connect(minter).mint(bobby.address)    // id 7 
        await helixNft.connect(minter).mint(bobby.address)    // id 8
    
        // record the helix being minted per block
        const rewardPerBlock = await feeMinter.getToMintPerBlock(helixChefNft.address)

        // alice stakes her nft on block "0"
        await helixChefNft.connect(alice).stake([1])                        // block 0

        // mine 9 blocks
        let blockDelta = 9
        await hre.network.provider.send("hardhat_mine", [hex(blockDelta)])  // block 9

        // bobby stakes his 4 nfts on block "10"
        expect(await helixChefNft.getPendingReward(bobby.address)).to.eq(0)
        await helixChefNft.connect(bobby).stake([3, 4, 7, 8])               // block 10
        
        // check alice rewards after 10 blocks
        expect(await helixChefNft.getPendingReward(alice.address)).to.eq(rewardPerBlock.mul(10))

        // mine 4 more blocks
        blockDelta = 4
        await hre.network.provider.send("hardhat_mine", [hex(blockDelta)])  // block 14
    
        // check alice rewards 
        expect(await helixChefNft.getPendingReward(alice.address)).to.eq(rewardPerBlock.mul(10).add(rewardPerBlock.mul(4).mul(1).div(5)))

        // check bobby rewards
        let bobbyUserInfo = await helixChefNft.users(bobby.address)
        let bobbyStakedNfts = bobbyUserInfo.stakedNfts
        let bobbyRewardDebt = bobbyUserInfo.rewardDebt

        let blockNumber = hre.ethers.BigNumber.from((await hre.ethers.provider.getBlock("latest")).number)
        let lastUpdateBlock = await helixChefNft.lastUpdateBlock()
        blockDelta = blockNumber.sub(lastUpdateBlock)

        let rewards = blockDelta.mul(rewardPerBlock)
        let totalStakedNfts = await helixChefNft.totalStakedNfts()

        let accTokenPerShare = await helixChefNft.accTokenPerShare()
        accTokenPerShare = accTokenPerShare.add(rewards.mul(1e12).div(totalStakedNfts))

        let expectedBobbyReward = bobbyStakedNfts.mul(accTokenPerShare).div(1e12).sub(bobbyRewardDebt)
        expect(await helixChefNft.getPendingReward(bobby.address)).to.eq(expectedBobbyReward)
    })

    /*
    describe("When token is deployed", async () => {
        it('helixChefNft: Check owner, minter, staker', async () => {
            assert.equal((await this.helixNft.owner()).toString(), deployer.toString())
            assert.equal(await this.helixNft.isMinter(minter), true)
            assert.equal(await this.helixNft.isStaker(this.helixChefNft.address), true)
        })
    })

    describe("Initialize of Staking", async () => {
        it('helixChefNft: When an user stakes, the helixPointAmount of user should have a default amount', async () => {
            await this.helixChefNft.stake([1, 2], { from: alice })
            assert.equal((await this.helixChefNft.getUserHelixPointAmount(alice)).toString(), (INITIAL_HELIXPOINTS * 2).toString())
        })
        it('helixChefNft: Check token Owner', async () => {
            await expectRevert.unspecified(this.helixChefNft.stake([1, 2], { from: carol }))//Not token owner
        })
        it('helixChefNft: Double staking of an helixNft is not acceptable', async () => {
            await this.helixChefNft.stake([1], { from: alice })
            await expectRevert.unspecified(this.helixChefNft.stake([1], { from: alice }))//Token has already been staked
        })
    })

    describe("Calculation reward of Staking", async () => {
        it('helixChefNft: Calc pending reward when one person staked', async () => {
            let startBlockNumber = parseInt((await time.latestBlock()).toString())
            await this.helixChefNft.stake([1], { from: alice })// block.number is increased
         
            let res
            await time.advanceBlockTo(startBlockNumber + 21)
            res = await this.helixChefNft.pendingReward(alice)// eventually, passed 20 from start
            assert.equal((res[0]).toString(), this.rwt1.address)// check reward token address
            assert.equal((res[1]).toString(), (REWARD_PER_BLOCK * 20).toString())

            await time.advanceBlockTo(startBlockNumber + 31)
            res = await this.helixChefNft.pendingReward(alice)// eventually, passed 30 from start
            assert.equal((res[1]).toString(), (REWARD_PER_BLOCK * 30).toString())

            await this.helixChefNft.withdrawHelixToken({ from: alice })// block.number is increased
            assert.equal((await this.rwt1.balanceOf(alice)).toString(), (REWARD_PER_BLOCK * (30 + 1)).toString())

            startBlockNumber = parseInt((await time.latestBlock()).toString())
            await this.helixChefNft.stake([2], { from: alice })
            assert.equal((await this.rwt1.balanceOf(alice)).toString(), (REWARD_PER_BLOCK * (30 + 1 + 1)).toString())//because withdrawal before stake newly
         
            await time.advanceBlockTo(startBlockNumber + 11)
            assert.equal(((await this.helixChefNft.pendingReward(alice))[1]).toString(), (REWARD_PER_BLOCK * 10).toString())
            assert.equal((await this.helixChefNft.getUserHelixPointAmount(alice)).toString(), (INITIAL_HELIXPOINTS * 2).toString())
        })
     
        it('helixChefNft: Calc withdrawReward when 2 persons staked', async () => {
            let res, _blockNumber
            await this.helixChefNft.stake([1, 2], { from: alice })
            await this.helixChefNft.stake([3], { from: carol })

            _blockNumber = parseInt((await time.latestBlock()).toString())
            await time.advanceBlockTo(_blockNumber + 10)
         
            await this.helixChefNft.withdrawHelixToken({ from: alice })
            assert.equal((await this.rwt1.balanceOf(alice)).toString(), '25')

            await this.helixChefNft.withdrawHelixToken({ from: carol })
            assert.equal((await this.rwt1.balanceOf(carol)).toString(), '12')
        })
    })
    */

    function hex(int) {
        return "0x" + int.toString(16)
    }
})
