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

        await synthToken.addMinter(synthReactor.address)

        // mint helix to alice for her to lock
        const mintAmount = expandTo18Decimals(1000)
        await helixToken.connect(minter).mint(alice.address, mintAmount)
        await helixToken.connect(minter).mint(bobby.address, mintAmount)
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
        beforeEach(async () => {
            // set the synth to mint per block
            const synthToMintPerBlock = expandTo18Decimals(100)
            await synthReactor.setSynthToMintPerBlock(synthToMintPerBlock)
        })

        it("calls updatePool", async () => {
            // alice locks her helix balance
            const lockAmount = await helixToken.balanceOf(alice.address)
            const durationIndex = 0
            await helixToken.connect(alice).approve(synthReactor.address, lockAmount)
            await synthReactor.connect(alice).lock(lockAmount, durationIndex)

            // check that updatePool is called
            await expect(synthReactor.connect(alice).harvestReward())
                .to.emit(synthReactor, "UpdatePool")
        })

        it("mints synthToken reward to the caller", async () => {
            // contract's previous synth token balance
            const prevContractSynthBalance = await synthToken.balanceOf(synthReactor.address)

            // alice's previous synth token balance
            const prevAliceSynthBalance = await synthToken.balanceOf(alice.address)

            // alice locks her helix balance
            const lockAmount = await helixToken.balanceOf(alice.address)
            const durationIndex = 0
            await helixToken.connect(alice).approve(synthReactor.address, lockAmount)
            await synthReactor.connect(alice).lock(lockAmount, durationIndex)

            // harvest rewards on the next block
            const depositIndex = 0
            await synthReactor.connect(alice).harvestReward()
        
            // expect alice to recieve the full amount minted 
            const synthToMintPerBlock = await synthReactor.synthToMintPerBlock()
            const expectedAliceSynthBalance = prevAliceSynthBalance.add(synthToMintPerBlock)
            const aliceSynthBalance = await synthToken.balanceOf(alice.address)
            expect(roundBigInt(aliceSynthBalance)).to.eq(roundBigInt(expectedAliceSynthBalance))

            // expect the contract balance to be the same, i.e. minted synth and not transferred
            const expectedContractSynthBalance = prevContractSynthBalance
            expect(await synthToken.balanceOf(synthReactor.address)).to.eq(expectedContractSynthBalance)
        })

        it("accrues higher rewards to users with higher weights", async () => {
            // alice prepares to lock her helix balance
            const prevAliceSynthBalance = await synthToken.balanceOf(alice.address)
            const aliceLockAmount = await helixToken.balanceOf(alice.address)
            const aliceDurationIndex = 0
            await helixToken.connect(alice).approve(synthReactor.address, aliceLockAmount)
            const aliceWeight = (await synthReactor.durations(aliceDurationIndex)).weight

            // bobby prepares to lock his helix balance
            const prevBobbySynthBalance = await synthToken.balanceOf(bobby.address)
            const bobbyLockAmount = await helixToken.balanceOf(bobby.address)
            const bobbyDurationIndex = 1
            await helixToken.connect(bobby).approve(synthReactor.address, bobbyLockAmount)
            const bobbyWeight = (await synthReactor.durations(bobbyDurationIndex)).weight

            // alice locks her helix 
            await synthReactor.connect(alice).lock(aliceLockAmount, aliceDurationIndex)

            // bobby locks his helix
            await synthReactor.connect(bobby).lock(bobbyLockAmount, bobbyDurationIndex)
            
            const synthToMintPerBlock = await synthReactor.synthToMintPerBlock()

            // calculate alice's expected reward
            // she'll be staked by herself for 1 block
            // and she'll be staked with bobby for 1 block
            const aliceDeposited = aliceLockAmount.mul(bigInt(100).add(aliceWeight)).div(bigInt(100))
            const bobbyDeposited = bobbyLockAmount.mul(bigInt(100).add(bobbyWeight)).div(bigInt(100))
            const expectedTotalShares = aliceDeposited.add(bobbyDeposited)
            const totalShares = await synthReactor.totalShares()
            expect(totalShares).to.eq(expectedTotalShares)

            await synthReactor.updatePool()

            const expectedAliceReward = synthToMintPerBlock.add(
                aliceDeposited.mul(expandTo18Decimals(100)).div(totalShares)
            )
            const aliceDepositIndex = 0
            const aliceReward = await synthReactor.getPendingReward(alice.address)
            // TODO
            // expect(roundBigInt(aliceReward)).to.eq(roundBigInt(expectedAliceReward))

            /**
            console.log(`synthToMintPerBlock ${synthToMintPerBlock}`)
            console.log(`bobbyDeposited ${bobbyDeposited}`)
            console.log(`totalShares ${totalShares}`)
            const expectedBobbyReward = synthToMintPerBlock.add(
                bobbyDeposited.mul(expandTo18Decimals(100)).div(totalShares)
            )
            console.log(`expectedBobbyReward ${expectedBobbyReward}`)
            const bobbyDepositIndex = 1
            const bobbyReward = await synthReactor.getPendingReward(bobbyDepositIndex)
            expect(roundBigInt(bobbyReward)).to.eq(roundBigInt(expectedBobbyReward))
            */
        })


        it("emits HarvestReward event", async () => {
            // alice locks her helix balance
            const lockAmount = await helixToken.balanceOf(alice.address)
            const durationIndex = 0
            await helixToken.connect(alice).approve(synthReactor.address, lockAmount)
            await synthReactor.connect(alice).lock(lockAmount, durationIndex)

            await expect(synthReactor.connect(alice).harvestReward())
                .to.emit(synthReactor, "HarvestReward")
        })

    })

    describe("lock", async () => {
        it("fails if called with an invalid amount", async () => {
            const lockAmount = bigInt(0)
            const durationIndex = 0
            await helixToken.connect(alice).approve(synthReactor.address, lockAmount)
            await expect(synthReactor.connect(alice).lock(lockAmount, durationIndex))
                .to.be.revertedWith("invalid amount")

        })

        it("fails if called with an invalid durationIndex", async () => {
            const lockAmount = await helixToken.balanceOf(alice.address)
            const durationIndex = (await synthReactor.getDurations()).length
            await helixToken.connect(alice).approve(synthReactor.address, lockAmount)
            await expect(synthReactor.connect(alice).lock(lockAmount, durationIndex))
                .to.be.revertedWith("invalid duration index")

        })

        it("calls updatePool", async () => {
            const lockAmount = await helixToken.balanceOf(alice.address)
            const durationIndex = 0
            await helixToken.connect(alice).approve(synthReactor.address, lockAmount)
            await expect(synthReactor.connect(alice).lock(lockAmount, durationIndex))
                .to.emit(synthReactor, "UpdatePool")
        })

        it("pushes the deposit index into the user's deposit struct", async () => {
            const prevExpectedDepositIndices = []
            expect(await synthReactor.getUserDepositIndices(alice.address)).to.deep.eq(prevExpectedDepositIndices)

            const lockAmount = await helixToken.balanceOf(alice.address)
            const durationIndex = 0
            await helixToken.connect(alice).approve(synthReactor.address, lockAmount)
            await synthReactor.connect(alice).lock(lockAmount, durationIndex)

            const expectedDepositIndices = [bigInt(0)]
            expect(await synthReactor.getUserDepositIndices(alice.address)).to.deep.eq(expectedDepositIndices)
        })

        it("increments the user's totalAmount", async () => {
            expect(await synthReactor.getUserHelixDeposited(alice.address)).to.eq(bigInt(0))

            const lockAmount = await helixToken.balanceOf(alice.address)
            const durationIndex = 0
            await helixToken.connect(alice).approve(synthReactor.address, lockAmount)
            await synthReactor.connect(alice).lock(lockAmount, durationIndex)

            expect(await synthReactor.getUserHelixDeposited(alice.address)).to.eq(lockAmount)
        })

        it("increments the contract totalShares", async () => {
            const prevTotalShares = await helixToken.balanceOf(synthReactor.address)

            const lockAmount = await helixToken.balanceOf(alice.address)
            const durationIndex = 0
            await helixToken.connect(alice).approve(synthReactor.address, lockAmount)
            await synthReactor.connect(alice).lock(lockAmount, durationIndex)
    
            // TODO expect this to fail when accounting for weight/staked multipliers
            const weight = (await synthReactor.durations(durationIndex)).weight
            const expectedTotalShares = prevTotalShares.add(lockAmount.mul(bigInt(100).add(weight)).div(bigInt(100)))
            expect(await synthReactor.totalShares()).to.eq(expectedTotalShares)
        })

        it("pushes a new deposit into the deposits array", async () => {
            // expect an error to be thrown since the array is empty
            await expect(synthReactor.deposits(0)).to.be.revertedWith("")

            const lockAmount = await helixToken.balanceOf(alice.address)
            const durationIndex = 0

            // expected deposit values
            const expectedDepositor = alice.address
            const expectedAmount = lockAmount
            const expectedWeight = bigInt(5)
            const now = bigInt((await hre.ethers.provider.getBlock("latest")).timestamp).add(2)
            const expectedDepositTimestamp = now
            const lockDuration = (await synthReactor.durations(0)).duration
            const expectedUnlockTimestamp = now.add(lockDuration)
            const expectedWithdrawn = false

            await helixToken.connect(alice).approve(synthReactor.address, lockAmount)
            await synthReactor.connect(alice).lock(lockAmount, durationIndex)

            const deposit = await synthReactor.deposits(0)
            expect(deposit.depositor).to.eq(expectedDepositor)
            expect(deposit.amount).to.eq(expectedAmount)
            expect(deposit.weight).to.eq(expectedWeight)
            expect(deposit.depositTimestamp).to.eq(expectedDepositTimestamp)
            expect(deposit.unlockTimestamp).to.eq(expectedUnlockTimestamp)
            expect(deposit.withdrawn).to.eq(expectedWithdrawn)
        })

        it("transfers helix from the caller to the synthReactor contract", async () => {
            const lockAmount = await helixToken.balanceOf(alice.address)
            const durationIndex = 0
            await helixToken.connect(alice).approve(synthReactor.address, lockAmount)
            await synthReactor.connect(alice).lock(lockAmount, durationIndex)

            expect(await helixToken.balanceOf(alice.address)).to.eq(bigInt(0))
        })

        it("emits Lock event", async () => {
            // alice locks her helix balance
            const lockAmount = await helixToken.balanceOf(alice.address)
            await helixToken.connect(alice).approve(synthReactor.address, lockAmount)
            const durationIndex = 0
            await expect(synthReactor.connect(alice).lock(lockAmount, durationIndex))
                .to.emit(synthReactor, "Lock")
        })

        /* TODO 
        it("sets totalShares when user has stakedNfts", async () => {
            // set alice's staked nfts
            const stakedNfts = 1
            await synthReactor.setUserStakedNfts(alice.address, stakedNfts);

            // alice locks her helix
            const lockAmount = await helixToken.balanceOf(alice.address)
            const durationIndex = 0
            await helixToken.connect(alice).approve(synthReactor.address, lockAmount)
            await synthReactor.connect(alice).lock(lockAmount, durationIndex)
    
            // check the resulting totalShares
            const weight = (await synthReactor.durations(durationIndex)).weight
            const weightModifier = await synthReactor.getTotalShares(lockAmount, weight)
            const expectedTotalShares = await synthReactor.getNftModifier(weightModifier, stakedNfts)
            expect(await synthReactor.totalShares()).to.eq(expectedTotalShares)
        })
        */
    })

    describe("unlock", async () => {
        beforeEach(async () => {
            // set the synth to mint per block
            const synthToMintPerBlock = expandTo18Decimals(100)
            await synthReactor.setSynthToMintPerBlock(synthToMintPerBlock)
        })

        it("fails if the deposit index is invalid", async () => {
            await expect(synthReactor.connect(alice).unlock(0))
                .to.be.revertedWith("invalid deposit index")
        })

        it("fails if the caller is not the depositor", async () => {
            // lock as alice
            const lockAmount = await helixToken.balanceOf(alice.address)
            const durationIndex = 0
            await helixToken.connect(alice).approve(synthReactor.address, lockAmount)
            await synthReactor.connect(alice).lock(lockAmount, durationIndex)
        
            // unlock the deposit as bobby
            const depositIndex = bigInt(0)
            await expect(synthReactor.connect(bobby).unlock(depositIndex))
                .to.be.revertedWith("caller is not depositor")
        })

        it("fails if the deposit is still locked", async () => {
            // lock as alice
            const lockAmount = await helixToken.balanceOf(alice.address)
            const durationIndex = 0
            await helixToken.connect(alice).approve(synthReactor.address, lockAmount)
            await synthReactor.connect(alice).lock(lockAmount, durationIndex)

            // do not advance time until unlocked

            // try to unlock the deposit
            const depositIndex = bigInt(0)
            await expect(synthReactor.connect(alice).unlock(depositIndex))
                .to.be.revertedWith("deposit is locked")
        })

        it("calls harvestReward", async () => {
            const lockAmount = await helixToken.balanceOf(alice.address)
            const durationIndex = 0
            await helixToken.connect(alice).approve(synthReactor.address, lockAmount)
            await synthReactor.connect(alice).lock(lockAmount, durationIndex)

            // advance time until the deposit can be unlocked
            const unlockTimestamp = ((await synthReactor.deposits(0)).unlockTimestamp).toNumber()
            await setNextBlockTimestamp(unlockTimestamp)

            const depositIndex = bigInt(0)
            await expect(synthReactor.connect(alice).unlock(depositIndex))
                .to.emit(synthReactor, "HarvestReward")
        })

        it("marks deposit as withdrawn", async () => {
            const lockAmount = await helixToken.balanceOf(alice.address)
            const durationIndex = 0
            await helixToken.connect(alice).approve(synthReactor.address, lockAmount)
            await synthReactor.connect(alice).lock(lockAmount, durationIndex)
           
            // expect the deposit not to be withdrawn
            expect((await synthReactor.deposits(0)).withdrawn).to.be.false

            // advance time until the deposit can be unlocked
            const unlockTimestamp = ((await synthReactor.deposits(0)).unlockTimestamp).toNumber()
            await setNextBlockTimestamp(unlockTimestamp)

            // unlock the deposit
            const depositIndex = bigInt(0)
            await synthReactor.connect(alice).unlock(depositIndex)

            // expect the deposit to be marked as withdrawn
            expect((await synthReactor.deposits(0)).withdrawn).to.be.true
        })

        it("decrements the contract totalShares", async () => {
            const lockAmount = await helixToken.balanceOf(alice.address)
            const durationIndex = 0
            await helixToken.connect(alice).approve(synthReactor.address, lockAmount)
            await synthReactor.connect(alice).lock(lockAmount, durationIndex)

            // advance time until the deposit can be unlocked
            const unlockTimestamp = ((await synthReactor.deposits(0)).unlockTimestamp).toNumber()
            await setNextBlockTimestamp(unlockTimestamp)

            // alice unlocks her locked helix
            const depositIndex = bigInt(0)
            await synthReactor.connect(alice).unlock(depositIndex)

            expect(await synthReactor.totalShares()).to.eq(bigInt(0))
        })

        it("decrements the user's totalAmount", async () => {
            const lockAmount = await helixToken.balanceOf(alice.address)
            const durationIndex = 0
            await helixToken.connect(alice).approve(synthReactor.address, lockAmount)
            await synthReactor.connect(alice).lock(lockAmount, durationIndex)

            // advance time until the deposit can be unlocked
            const unlockTimestamp = ((await synthReactor.deposits(0)).unlockTimestamp).toNumber()
            await setNextBlockTimestamp(unlockTimestamp)

            // alice unlocks her locked helix
            const depositIndex = bigInt(0)
            await synthReactor.connect(alice).unlock(depositIndex)

            expect(await synthReactor.getUserHelixDeposited(alice.address)).to.eq(bigInt(0))
        })

        it("returns the deposited amount to the caller", async () => {
            const lockAmount = await helixToken.balanceOf(alice.address)
            const durationIndex = 0
            await helixToken.connect(alice).approve(synthReactor.address, lockAmount)
            await synthReactor.connect(alice).lock(lockAmount, durationIndex)

            // expect alice's helix balance to be 0
            const prevHelixBalance = await helixToken.balanceOf(alice.address)
            expect(prevHelixBalance).to.eq(bigInt(0))
           
            // advance time until the deposit can be unlocked
            const unlockTimestamp = ((await synthReactor.deposits(0)).unlockTimestamp).toNumber()
            await setNextBlockTimestamp(unlockTimestamp)

            // alice unlocks her locked helix
            const depositIndex = bigInt(0)
            await synthReactor.connect(alice).unlock(depositIndex)

            // expect alice's deposited amount to be returned
            const expectedHelixBalance = prevHelixBalance.add(lockAmount)
            expect(await helixToken.balanceOf(alice.address)).to.eq(expectedHelixBalance)
        })

        it("emits Unlock event", async () => {
            const lockAmount = await helixToken.balanceOf(alice.address)
            const durationIndex = 0
            await helixToken.connect(alice).approve(synthReactor.address, lockAmount)
            await synthReactor.connect(alice).lock(lockAmount, durationIndex)

            // advance time until the deposit can be unlocked
            const unlockTimestamp = ((await synthReactor.deposits(0)).unlockTimestamp).toNumber()
            await setNextBlockTimestamp(unlockTimestamp)

            // alice unlocks her locked helix
            const depositIndex = bigInt(0)
            await expect(synthReactor.connect(alice).unlock(depositIndex))
                .to.emit(synthReactor, "Unlock")
        })
    })

    function hex(int) {
        return "0x" + int.toString(16)
    }

    function bigInt(int) {
        return hre.ethers.BigNumber.from(int)
    }

    async function mineBlocks(int) {
        await hre.network.provider.send("hardhat_mine", [hex(int)])
    }
    
    async function increaseTime(int) {
        await hre.network.provider.send("evm_increaseTime", [int])
        await hre.network.provider.send("evm_mine")
    }

    async function setNextBlockTimestamp(int) {
        await hre.network.provider.send("evm_setNextBlockTimestamp", [int])
        await hre.network.provider.send("evm_mine")
    }

    function roundBigInt(bigInt) {
        return Math.round(bigInt.div(1e10).toNumber() / 1e6)
    }

    async function now() {
        return bigInt((await hre.ethers.provider.getBlock("latest")).timestamp)
    }

    async function currentBlockNumber() {
        return (await hre.ethers.provider.getBlock("latest")).number
    }

})
