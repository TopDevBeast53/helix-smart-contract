const { expect } = require("chai")                                                                   

const { waffle } = require("hardhat")
const { loadFixture } = waffle

const { bigNumberify, MaxUint256 } = require("legacy-ethers/utils") 
const { expandTo18Decimals } = require("./shared/utilities")                                       
const { fullExchangeFixture } = require("./shared/fixtures")                                       
const { constants } = require("@openzeppelin/test-helpers")                                        

const SECONDS_PER_DAY = 86400
                                                                                                   
describe("SynthReactor", () => {
    let deployer, minter, alice, bobby, carol
    let helixToken
    let synthToken
    let synthReactor

    beforeEach(async () => {
        [deployer, minter, alice, bobby, carol] = await ethers.getSigners()

        const fixture = await loadFixture(fullExchangeFixture)
        helixToken = fixture.helixToken 
        synthToken = fixture.synthToken
        synthReactor = fixture.synthReactor

        await helixToken.addMinter(minter.address)
        await synthToken.addMinter(minter.address)
    })

    it("initialized correctly", async () => {
        expect(await synthReactor.helixToken()).to.eq(helixToken.address)
        expect(await synthReactor.synthToken()).to.eq(synthToken.address)
        
        const durations = await synthReactor.getDurations()
        expect(durations[0].duration).to.eq(90 * SECONDS_PER_DAY)
        expect(durations[0].weight).to.eq(5)

        expect(durations[1].duration).to.eq(180 * SECONDS_PER_DAY)
        expect(durations[1].weight).to.eq(10)

        expect(durations[2].duration).to.eq(360 * SECONDS_PER_DAY)
        expect(durations[2].weight).to.eq(30)

        expect(durations[3].duration).to.eq(540 * SECONDS_PER_DAY)
        expect(durations[3].weight).to.eq(50)

        expect(durations[4].duration).to.eq(720 * SECONDS_PER_DAY)
        expect(durations[4].weight).to.eq(100)
    })

    describe("updatePool", async () => {
        it("sets the lastUpdateBlock", async () => {
            await synthReactor.updatePool()
            const prevUpdateBlock = await synthReactor.lastUpdateBlock()

            // mine 256 blocks and update again
            await hre.network.provider.send("hardhat_mine", ["0x100"])
            await synthReactor.updatePool()
        
            expect(await synthReactor.lastUpdateBlock()).to.be.eq(prevUpdateBlock.add(256).add(1)) 
        })

        it("does not increment the accTokenPerShare if the reactor has no helixToken balance", async () => {
            // check that the block number condition will pass
            let latestBlock = (await hre.ethers.provider.getBlock("latest")).number
            latestBlock = hre.ethers.BigNumber.from(latestBlock)
            const lastUpdateBlock = await synthReactor.lastUpdateBlock()
            expect(lastUpdateBlock).to.be.below(latestBlock)

            // check that the contract has no balance
            expect(await helixToken.balanceOf(synthReactor.address)).to.eq(0)

            const expectedAccTokenPerShare = await synthReactor.accTokenPerShare()
            await synthReactor.updatePool()
            expect(await synthReactor.accTokenPerShare()).to.eq(expectedAccTokenPerShare)
        })

        it("increments the accTokenPerShare", async () => {
            // check that the helix token balance condition will pass by minting helix to reactor
            const mintAmount = expandTo18Decimals(1000)
            await helixToken.connect(minter).mint(synthReactor.address, mintAmount)
            expect(await helixToken.balanceOf(synthReactor.address)).to.eq(mintAmount)

            // check that the block number condition will pass
            let latestBlock = (await hre.ethers.provider.getBlock("latest")).number
            latestBlock = hre.ethers.BigNumber.from(latestBlock)
            const lastUpdateBlock = await synthReactor.lastUpdateBlock()
            expect(lastUpdateBlock).to.be.below(latestBlock)

            // calculate the expected accTokenPerShare before update
            const blockDelta = latestBlock - lastUpdateBlock
            const reward = blockDelta * (await synthReactor.synthToMintPerBlock())
            let accTokenPerShare = await synthReactor.accTokenPerShare()
            const expectedAccTokenPerShare = accTokenPerShare + (reward * 1e12 / mintAmount)

            // update the pool
            await synthReactor.updatePool()

            // check that the accTokenPerShare is correctly incremented
            expect(await synthReactor.accTokenPerShare()).to.eq(expectedAccTokenPerShare)
        })

        it("emits UpdatePool event", async () => {
            // check that the block number condition will pass
            let latestBlock = (await hre.ethers.provider.getBlock("latest")).number
            latestBlock = hre.ethers.BigNumber.from(latestBlock)
            const lastUpdateBlock = await synthReactor.lastUpdateBlock()
            expect(lastUpdateBlock).to.be.below(latestBlock)

            // check that the helix token balance condition will pass by minting helix to reactor
            const mintAmount = expandTo18Decimals(1000)
            await helixToken.connect(minter).mint(synthReactor.address, mintAmount)
            expect(await helixToken.balanceOf(synthReactor.address)).to.eq(mintAmount)

            await expect(synthReactor.updatePool())
                .to.emit(synthReactor, "UpdatePool")
        })
    })


    describe("harvestRewards", async () => {
        it("calls updatePool", async () => {
            // mint helix to alice for her to lock
            const mintAmount = expandTo18Decimals(1000)
            await helixToken.connect(minter).mint(alice.address, mintAmount)

            // alice locks her helix balance
            await helixToken.connect(alice).approve(synthReactor.address, mintAmount)
            const durationIndex = 0
            await synthReactor.connect(alice).lock(mintAmount, durationIndex)

            // check that updatePool is called
            const depositIndex = 0
            await expect(synthReactor.connect(alice).harvestReward(depositIndex))
                .to.emit(synthReactor, "UpdatePool")
        })
    })

    /*
    describe("stake", async () => {
        it("emits Stake event", async () => {
            await expect(synthReactor.connect(alice).stake([1])).to.emit(synthReactor, "Stake")
        })

        it("updates the pool", async () => {
            // update the pool so that it's as up-to-date as possible
            await synthReactor.updatePool()

            // record the data before staking
            const prevLastUpdateBlock = await synthReactor.lastUpdateBlock()
            const prevAccTokenPerShare = await synthReactor.accTokenPerShare()
           
            // stake and update so that rewards are accruing
            await synthReactor.connect(alice).stake([1])
            await synthReactor.updatePool()

            // get the data after staking
            const lastUpdateBlock = await synthReactor.lastUpdateBlock()
            const accTokenPerShare = await synthReactor.accTokenPerShare()

            // expect the lastUpdateBlock to be incremented by 2
            const blockDelta = 2 
            expect(lastUpdateBlock).to.eq(prevLastUpdateBlock.add(blockDelta))

            // calculate the expected accumulatedTokensPerShare 
            const totalStakedNfts = await synthReactor.totalStakedNfts()
            const rewardsPerBlock = await feeMinter.getToMintPerBlock(synthReactor.address)
            const rewards = rewardsPerBlock.mul(blockDelta - 1) // sub 1 because rewards only accruing for 1 block (not 2)
            const expectedAccTokenPerShare = prevAccTokenPerShare.add(rewards.mul(1e12).div(totalStakedNfts))
            expect(accTokenPerShare).to.eq(expectedAccTokenPerShare)
        })

        it("increments the user's staked nfts", async () => {
            const prevUserStakedNfts = (await synthReactor.users(alice.address)).stakedNfts
            await synthReactor.connect(alice).stake([1])
            const userStakedNfts = (await synthReactor.users(alice.address)).stakedNfts
            expect(userStakedNfts).to.eq(prevUserStakedNfts.add(1))
        })

        it("increments the total staked nfts", async () => {
            const prevTotalStakedNfts = await synthReactor.totalStakedNfts()
            await synthReactor.connect(alice).stake([1])
            expect(await synthReactor.totalStakedNfts()).to.eq(prevTotalStakedNfts.add(1))
        })

        it("harvests rewards", async () => {
            await synthReactor.updatePool()
            await synthReactor.connect(alice).stake([1])

            const prevBalance = await helixToken.balanceOf(alice.address)
            const aliceUserInfo = await synthReactor.users(alice.address)
            const rewardDebt = aliceUserInfo.rewardDebt
            const stakedNfts = aliceUserInfo.stakedNfts

            await synthReactor.connect(alice).stake([2])
            
            const accTokenPerShare = await synthReactor.accTokenPerShare()
            const rewards = (stakedNfts.mul(accTokenPerShare).div(1e12)).sub(rewardDebt)
            const expectedBalance = prevBalance.add(rewards)

            expect(await helixToken.balanceOf(alice.address)).to.eq(expectedBalance)
        })

        it("fails if no tokenIds passed", async () => {
            await expect(synthReactor.connect(alice).stake([]))
                .to.be.revertedWith("tokenIds length can not be zero")
        })

        it("fails if staking same nft more than once", async () => {
            await synthReactor.connect(alice).stake([1])
            await expect(synthReactor.connect(alice).stake([1]))
                .to.be.revertedWith("token is already staked")
        })

        it("fails if staker is not token owner", async () => {
            await expect(synthReactor.connect(bobby).stake([1]))
                .to.be.revertedWith("caller is not token owner")
        })

        it("staking allows re-unstaking the nft", async () => {
            // can't unstake the same nft twice without staking
            await synthReactor.connect(alice).stake([1])
            await synthReactor.connect(alice).stake([2])
            await synthReactor.connect(alice).unstake([1])
            await expect(synthReactor.connect(alice).unstake([1]))
                .to.be.revertedWith("token is already unstaked")


            await synthReactor.connect(alice).stake([1])
            await synthReactor.connect(alice).unstake([1])
        })

        it("stake multiple tokens", async () => {
            const prevAliceUserInfo = await synthReactor.users(alice.address)
            const prevStakedNfts = prevAliceUserInfo.stakedNfts
            const prevTotalStakedNfts = await synthReactor.totalStakedNfts()

            await synthReactor.connect(alice).stake([1, 2])
            
            // increments alice staked nfts by 2
            const aliceUserInfo = await synthReactor.users(alice.address)
            const stakedNfts = aliceUserInfo.stakedNfts
            expect(stakedNfts).to.eq(prevStakedNfts.add(2))

            // increments total staked nfts by 2
            const totalStakedNfts = await synthReactor.totalStakedNfts()
            expect(totalStakedNfts).to.eq(prevTotalStakedNfts.add(2))
        })
    })

    describe("unstake", async () => {
        it("fails if no tokenIds passed", async () => {
            await expect(synthReactor.connect(alice).unstake([]))
                .to.be.revertedWith("tokenIds length can not be zero")
        }) 

        it("fails if caller hasn't staked any nfts", async () => {
            await expect(synthReactor.connect(alice).unstake([1]))
                .to.be.revertedWith("caller has not staked any nfts")
        })

        it("updates the pool", async () => {
            await synthReactor.connect(alice).stake([1])
            await expect(synthReactor.connect(alice).unstake([1]))
                .to.emit(synthReactor, "UpdatePool")
        })

        it("harvests rewards", async () => {
            await synthReactor.connect(alice).stake([1])
            await expect(synthReactor.connect(alice).unstake([1]))
                .to.emit(synthReactor, "HarvestRewards")
        })

        it("decrements the users staked nfts", async () => {
            await synthReactor.connect(alice).stake([1])
            const prevAliceUserInfo = await synthReactor.users(alice.address)
            const prevStakedNfts = prevAliceUserInfo.stakedNfts

            await synthReactor.connect(alice).unstake([1])
            const aliceUserInfo = await synthReactor.users(alice.address)
            const stakedNfts = aliceUserInfo.stakedNfts

            expect(stakedNfts).to.eq(prevStakedNfts.sub(1))
        })

        it("decrements the total staked nfts", async () => {
            await synthReactor.connect(alice).stake([1])
            const prevTotalStakedNfts = await synthReactor.totalStakedNfts()

            await synthReactor.connect(alice).unstake([1])
            const totalStakedNfts = await synthReactor.totalStakedNfts()

            expect(totalStakedNfts).to.eq(prevTotalStakedNfts.sub(1))
        })

        it("emits Unstake event", async () => {
            await synthReactor.connect(alice).stake([1])
            await expect(synthReactor.connect(alice).unstake([1]))
                .to.emit(synthReactor, "Unstake")
        })

        it("unstaking allows re-staking the nft", async () => {
            // can't stake the same nft twice without first unstaking
            await synthReactor.connect(alice).stake([1])
            await expect(synthReactor.connect(alice).stake([1]))
                .to.be.revertedWith("token is already staked")

            
            await synthReactor.connect(alice).unstake([1])
            await synthReactor.connect(alice).stake([1])
        })
    })

    describe("getPendingReward", async () => {
        it("returns the correct reward with a single staker", async () => {
            // alice stakes tokens
            await synthReactor.connect(alice).stake([1])

            const rewardPerBlock = await feeMinter.getToMintPerBlock(synthReactor.address)
            const blockDelta = 256
            const expectedReward = rewardPerBlock.mul(blockDelta)
            
            // wait 256 blocks
            await hre.network.provider.send("hardhat_mine", [hex(blockDelta)])

            const pendingReward = await synthReactor.getPendingReward(alice.address)
            expect(pendingReward).to.eq(expectedReward)
        })
    })

    describe("getStakedNftIds", async () => {
        it("returns the array of staked nft ids", async () => {
            let expectedStakedNftIds = []
            expect(await synthReactor.getStakedNftIds(alice.address)).to.deep.eq(expectedStakedNftIds)

            await synthReactor.connect(alice).stake([1])
            expectedStakedNftIds.push(hre.ethers.BigNumber.from(1))
            expect(await synthReactor.getStakedNftIds(alice.address)).to.deep.eq(expectedStakedNftIds)

            await synthReactor.connect(alice).stake([2])
            expectedStakedNftIds.push(hre.ethers.BigNumber.from(2))
            expect(await synthReactor.getStakedNftIds(alice.address)).to.deep.eq(expectedStakedNftIds)

            await synthReactor.connect(alice).unstake([1])
            expectedStakedNftIds = [hre.ethers.BigNumber.from(2)]
            expect(await synthReactor.getStakedNftIds(alice.address)).to.deep.eq(expectedStakedNftIds)

            await synthReactor.connect(alice).unstake([2])
            expectedStakedNftIds.pop()
            expect(await synthReactor.getStakedNftIds(alice.address)).to.deep.eq(expectedStakedNftIds)
        })
    })

    it("multiple users stake and collect rewards", async () => {
        // Mint 2 more nfts to Bobby so that he has a total of 4 nfts
        await helixNft.connect(minter).mint(bobby.address)    // id 7 
        await helixNft.connect(minter).mint(bobby.address)    // id 8
    
        // record the helix being minted per block
        const rewardPerBlock = await feeMinter.getToMintPerBlock(synthReactor.address)

        // alice stakes her nft on block "0"
        await synthReactor.connect(alice).stake([1])                        // block 0

        // mine 9 blocks
        let blockDelta = 9
        await hre.network.provider.send("hardhat_mine", [hex(blockDelta)])  // block 9

        // bobby stakes his 4 nfts on block "10"
        expect(await synthReactor.getPendingReward(bobby.address)).to.eq(0)
        await synthReactor.connect(bobby).stake([3, 4, 7, 8])               // block 10
        
        // check alice rewards after 10 blocks
        expect(await synthReactor.getPendingReward(alice.address)).to.eq(rewardPerBlock.mul(10))

        // mine 4 more blocks
        blockDelta = 4
        await hre.network.provider.send("hardhat_mine", [hex(blockDelta)])  // block 14
    
        // check alice rewards 
        expect(await synthReactor.getPendingReward(alice.address)).to.eq(rewardPerBlock.mul(10).add(rewardPerBlock.mul(4).mul(1).div(5)))

        // check bobby rewards
        let bobbyUserInfo = await synthReactor.users(bobby.address)
        let bobbyStakedNfts = bobbyUserInfo.stakedNfts
        let bobbyRewardDebt = bobbyUserInfo.rewardDebt

        let blockNumber = hre.ethers.BigNumber.from((await hre.ethers.provider.getBlock("latest")).number)
        let lastUpdateBlock = await synthReactor.lastUpdateBlock()
        blockDelta = blockNumber.sub(lastUpdateBlock)

        let rewards = blockDelta.mul(rewardPerBlock)
        let totalStakedNfts = await synthReactor.totalStakedNfts()

        let accTokenPerShare = await synthReactor.accTokenPerShare()
        accTokenPerShare = accTokenPerShare.add(rewards.mul(1e12).div(totalStakedNfts))

        let expectedBobbyReward = bobbyStakedNfts.mul(accTokenPerShare).div(1e12).sub(bobbyRewardDebt)
        expect(await synthReactor.getPendingReward(bobby.address)).to.eq(expectedBobbyReward)
    })
    */

    function hex(int) {
        return "0x" + int.toString(16)
    }
})
