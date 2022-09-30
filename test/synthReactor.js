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
    let nftChef
    let helixNft

    beforeEach(async () => {
        [deployer, minter, alice, bobby, carol] = await ethers.getSigners()

        const fixture = await loadFixture(fullExchangeFixture)
        helixToken = fixture.helixToken 
        synthToken = fixture.synthToken
        synthReactor = fixture.synthReactor
        nftChef = fixture.helixChefNft
        helixNft = fixture.helixNft

        // add mintes
        await helixToken.addMinter(minter.address)
        await synthToken.addMinter(minter.address)
        await helixNft.addMinter(minter.address)
        await synthToken.addMinter(synthReactor.address)

        // mint helix to alice for her to lock
        const mintAmount = expandTo18Decimals(1000)
        await helixToken.connect(minter).mint(alice.address, mintAmount)
        await helixToken.connect(minter).mint(bobby.address, mintAmount)

        // mint nfts to alice for her to stake
        await helixNft.connect(minter).mint(alice.address)      // tokenId 1
        await helixNft.connect(minter).mint(alice.address)      // tokenId 2
        await helixNft.connect(minter).mint(alice.address)      // tokenId 3

        // set the nftChef synthReactor
        await nftChef.setSynthReactor(synthReactor.address)
    })

    it("initialized correctly", async () => {
        expect(await synthReactor.helixToken()).to.eq(helixToken.address)
        expect(await synthReactor.synthToken()).to.eq(synthToken.address)
        
        const duration0 = await synthReactor.lockModifiers(0)
        expect(duration0.duration).to.eq(90 * SECONDS_PER_DAY)
        expect(duration0.weight).to.eq(5)

        const duration1 = await synthReactor.lockModifiers(1)
        expect(duration1.duration).to.eq(180 * SECONDS_PER_DAY)
        expect(duration1.weight).to.eq(10)

        const duration2 = await synthReactor.lockModifiers(2)
        expect(duration2.duration).to.eq(360 * SECONDS_PER_DAY)
        expect(duration2.weight).to.eq(30)

        const duration3 = await synthReactor.lockModifiers(3)
        expect(duration3.duration).to.eq(540 * SECONDS_PER_DAY)
        expect(duration3.weight).to.eq(50)

        const duration4 = await synthReactor.lockModifiers(4)
        expect(duration4.duration).to.eq(720 * SECONDS_PER_DAY)
        expect(duration4.weight).to.eq(100)

        expect(await nftChef.synthReactor()).to.eq(synthReactor.address)
    })

    describe("updatePool", async () => {
        it("sets the lastUpdateBlock when the reactor has no shares", async () => {
            await synthReactor.updatePool()
            const prevUpdateBlock = await synthReactor.lastUpdateBlock()

            // check that the contract has no shares
            expect(await synthReactor.totalShares()).to.eq(0)

            // mine 256 blocks and update again
            await hre.network.provider.send("hardhat_mine", ["0x100"])
            await synthReactor.updatePool()
        
            expect(await synthReactor.lastUpdateBlock()).to.be.eq(prevUpdateBlock.add(256).add(1)) 
        })

        it("does not increment the accTokenPerShare when the reactor has no shares", async () => {
            // check that the block number condition will pass
            let latestBlock = (await hre.ethers.provider.getBlock("latest")).number
            latestBlock = hre.ethers.BigNumber.from(latestBlock)
            const lastUpdateBlock = await synthReactor.lastUpdateBlock()
            expect(lastUpdateBlock).to.be.below(latestBlock)

            // check that the contract has no shares
            expect(await synthReactor.totalShares()).to.eq(0)

            const expectedAccTokenPerShare = await synthReactor.accTokenPerShare()
            await synthReactor.updatePool()
            expect(await synthReactor.accTokenPerShare()).to.eq(expectedAccTokenPerShare)
        })

        it("sets the lastUpdateBlock when the reactor has shares", async () => {
            // alice locks her helix balance
            const lockAmount = await helixToken.balanceOf(alice.address)
            const lockModifierIndex = 0
            await helixToken.connect(alice).approve(synthReactor.address, lockAmount)
            await synthReactor.connect(alice).lock(lockAmount, lockModifierIndex)
    
            // check that the reactor has shares
            const weight = (await synthReactor.lockModifiers(lockModifierIndex)).weight
            const expectedTotalShares = lockAmount.mul(bigInt(100).add(weight)).div(bigInt(100))
            expect(await synthReactor.totalShares()).to.eq(expectedTotalShares)

            // store the previous update block to check that it's updated later
            const prevUpdateBlock = await synthReactor.lastUpdateBlock()

            // mine 256 blocks and update again
            await hre.network.provider.send("hardhat_mine", ["0x100"])
            await synthReactor.updatePool()
        
            expect(await synthReactor.lastUpdateBlock()).to.be.eq(prevUpdateBlock.add(256).add(1)) 
        })

        it("increments the accTokenPerShare when the reactor has shares", async () => {
            // set the synth to mint per block
            const synthToMintPerBlock = expandTo18Decimals(1)
            await synthReactor.setSynthToMintPerBlock(synthToMintPerBlock)

            // alice locks her helix balance
            const lockAmount = await helixToken.balanceOf(alice.address)
            const lockModifierIndex = 0
            await helixToken.connect(alice).approve(synthReactor.address, lockAmount)
            await synthReactor.connect(alice).lock(lockAmount, lockModifierIndex)
  
            // expect the current block number to be greater than the lastUpdateBlock
            await mineBlocks(1)
            const blockNumber = await currentBlockNumber()
            const lastUpdateBlock = await synthReactor.lastUpdateBlock()
            expect(blockNumber).to.be.above(lastUpdateBlock)
           
            // expect the totalShares to be greater than 0
            const weight = (await synthReactor.lockModifiers(lockModifierIndex)).weight
            const expectedTotalShares = lockAmount.mul(bigInt(100).add(weight)).div(bigInt(100))
            expect(expectedTotalShares).to.not.eq(0)
            const totalShares = await synthReactor.totalShares()
            expect(totalShares).to.eq(expectedTotalShares)

            // calculate the expected accTokenPerShare
            const prevAccTokenPerShare = await synthReactor.accTokenPerShare()
            const blockDelta = bigInt(blockNumber + 1).sub(lastUpdateBlock)
            // use .mul(1e10).mul(1e9) to avoid the overflow caused by .mul(1e19)
            const increment = blockDelta.mul(synthToMintPerBlock).mul(1e10).mul(1e9).div(totalShares)
            const expectedAccTokenPerShare = prevAccTokenPerShare.add(increment)

            // update the pool
            await synthReactor.updatePool()

            // check the accTokenPerShare
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

    describe("harvestReward", async () => {
        beforeEach(async () => {
            // set the synth to mint per block
            const synthToMintPerBlock = expandTo18Decimals(100)
            await synthReactor.setSynthToMintPerBlock(synthToMintPerBlock)
        })

        it("does nothing if reactor is paused", async () => {
            await synthReactor.connect(deployer).pause()
            expect(await synthReactor.paused()).to.be.true
            await expect(synthReactor.connect(alice).harvestReward())
                .to.not.emit(synthReactor, "HarvestReward")
        })

        it("calls updatePool", async () => {
            // alice locks her helix balance
            const lockAmount = await helixToken.balanceOf(alice.address)
            const lockModifierIndex = 0
            await helixToken.connect(alice).approve(synthReactor.address, lockAmount)
            await synthReactor.connect(alice).lock(lockAmount, lockModifierIndex)

            // check that updatePool is called
            await expect(synthReactor.connect(alice).harvestReward())
                .to.emit(synthReactor, "UpdatePool")
        })

        it("updates user.rewardDebt", async () => {
            // alice locks her helix balance
            const lockAmount = await helixToken.balanceOf(alice.address)
            const lockModifierIndex = 0
            await helixToken.connect(alice).approve(synthReactor.address, lockAmount)
            await synthReactor.connect(alice).lock(lockAmount, lockModifierIndex)

            // calculate the expected rewardDebt
            const userShares = (await synthReactor.users(alice.address)).shares
            const prevAccTokenPerShare = await synthReactor.accTokenPerShare()
            const blockNumber = bigInt((await currentBlockNumber()) + 1)
            const lastUpdateBlock = await synthReactor.lastUpdateBlock()
            const blockDelta = blockNumber.sub(lastUpdateBlock)
            const synthToMintPerBlock = await synthReactor.synthToMintPerBlock()
            const totalShares = await synthReactor.totalShares()
            const increment = blockDelta.mul(synthToMintPerBlock).mul(1e10).mul(1e9).div(totalShares)
            const accTokenPerShare = prevAccTokenPerShare.add(increment)
            const expectedRewardDebt = userShares.mul(accTokenPerShare).div(1e10).div(1e9)

            // harvest the reward
            await synthReactor.connect(alice).harvestReward()

            // compare the updated user rewardDebt with the expectedRewardDebt
            expect((await synthReactor.users(alice.address)).rewardDebt).to.eq(expectedRewardDebt)
        })

        it("mints synthToken reward to the caller", async () => {
            // contract's previous synth token balance
            const prevContractSynthBalance = await synthToken.balanceOf(synthReactor.address)

            // alice's previous synth token balance
            const prevAliceSynthBalance = await synthToken.balanceOf(alice.address)

            // alice locks her helix balance
            const lockAmount = await helixToken.balanceOf(alice.address)
            const lockModifierIndex = 0
            await helixToken.connect(alice).approve(synthReactor.address, lockAmount)
            await synthReactor.connect(alice).lock(lockAmount, lockModifierIndex)

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

        it("emits HarvestReward event", async () => {
            // alice locks her helix balance
            const lockAmount = await helixToken.balanceOf(alice.address)
            const lockModifierIndex = 0
            await helixToken.connect(alice).approve(synthReactor.address, lockAmount)
            await synthReactor.connect(alice).lock(lockAmount, lockModifierIndex)

            await expect(synthReactor.connect(alice).harvestReward())
                .to.emit(synthReactor, "HarvestReward")
        })
    })

    describe("lock", async () => {
        it("fails if called with an invalid amount", async () => {
            const lockAmount = bigInt(0)
            const lockModifierIndex = 0
            await helixToken.connect(alice).approve(synthReactor.address, lockAmount)
            await expect(synthReactor.connect(alice).lock(lockAmount, lockModifierIndex))
                .to.be.revertedWith("invalid amount")
        })

        it("fails if called with an invalid rationIndex", async () => {
            const lockAmount = await helixToken.balanceOf(alice.address)
            const lockModifierIndex = await synthReactor.getLockModifiersLength()
            await helixToken.connect(alice).approve(synthReactor.address, lockAmount)
            await expect(synthReactor.connect(alice).lock(lockAmount, lockModifierIndex))
                .to.be.revertedWith("invalid lock modifier index")
        })

        it("calls harvestReward", async () => {
            const lockAmount = await helixToken.balanceOf(alice.address)
            const lockModifierIndex = 0
            await helixToken.connect(alice).approve(synthReactor.address, lockAmount)
            await expect(synthReactor.connect(alice).lock(lockAmount, lockModifierIndex))
                .to.emit(synthReactor, "HarvestReward")
        })

        it("increments the contract totalShares", async () => {
            const prevTotalShares = await helixToken.balanceOf(synthReactor.address)

            const lockAmount = await helixToken.balanceOf(alice.address)
            const lockModifierIndex = 0
            await helixToken.connect(alice).approve(synthReactor.address, lockAmount)
            await synthReactor.connect(alice).lock(lockAmount, lockModifierIndex)
    
            const weight = (await synthReactor.lockModifiers(lockModifierIndex)).weight
            const expectedTotalShares = prevTotalShares.add(lockAmount.mul(bigInt(100).add(weight)).div(bigInt(100)))
            expect(await synthReactor.totalShares()).to.eq(expectedTotalShares)
        })

        it("pushes the deposit index into the user's deposit struct", async () => {
            const prevExpectedDepositIndices = []
            expect(await synthReactor.getUserDepositIndices(alice.address)).to.deep.eq(prevExpectedDepositIndices)

            const lockAmount = await helixToken.balanceOf(alice.address)
            const lockModifierIndex = 0
            await helixToken.connect(alice).approve(synthReactor.address, lockAmount)
            await synthReactor.connect(alice).lock(lockAmount, lockModifierIndex)

            const expectedDepositIndices = [bigInt(0)]
            expect(await synthReactor.getUserDepositIndices(alice.address)).to.deep.eq(expectedDepositIndices)
        })

        it("increments the user's deposited helix", async () => {
            expect((await synthReactor.users(alice.address)).depositedHelix).to.eq(bigInt(0))

            const lockAmount = await helixToken.balanceOf(alice.address)
            const lockModifierIndex = 0
            await helixToken.connect(alice).approve(synthReactor.address, lockAmount)
            await synthReactor.connect(alice).lock(lockAmount, lockModifierIndex)

            expect((await synthReactor.users(alice.address)).depositedHelix).to.eq(lockAmount)
        })

        it("increments the user's weighted deposits", async () => {
            const prevWeightedDeposits = (await synthReactor.users(alice.address)).weightedDeposits
            expect(prevWeightedDeposits).to.eq(bigInt(0))

            // alice locks her helix balance
            const lockAmount = await helixToken.balanceOf(alice.address)
            const lockModifierIndex = 0
            await helixToken.connect(alice).approve(synthReactor.address, lockAmount)
            await synthReactor.connect(alice).lock(lockAmount, lockModifierIndex)

            // calculate the weighted deposit increment
            const weight = (await synthReactor.lockModifiers(lockModifierIndex)).weight
            const expectedWeightedDeposits = lockAmount.mul(bigInt(100).add(weight)).div(bigInt(100))
            
            // check that the amount matches the expected
            const weightedDeposits = (await synthReactor.users(alice.address)).weightedDeposits
            expect(weightedDeposits).to.eq(expectedWeightedDeposits)
        })

        it("increments the user's shares", async () => {
            const prevShares = (await synthReactor.users(alice.address)).shares
            expect(prevShares).to.eq(bigInt(0))

            // alice locks her helix balance
            const lockAmount = await helixToken.balanceOf(alice.address)
            const lockModifierIndex = 0
            await helixToken.connect(alice).approve(synthReactor.address, lockAmount)
            await synthReactor.connect(alice).lock(lockAmount, lockModifierIndex)

            // calculate the shares increment
            const weight = (await synthReactor.lockModifiers(lockModifierIndex)).weight
            const weightedDeposits = lockAmount.mul(bigInt(100).add(weight)).div(bigInt(100))
            const expectedShares = weightedDeposits
            
            // check that the amount matches the expected
            const shares = (await synthReactor.users(alice.address)).shares
            expect(shares).to.eq(expectedShares)
        })

        it("pushes a new deposit into the deposits array", async () => {
            // expect an error to be thrown since the array is empty
            await expect(synthReactor.deposits(0)).to.be.revertedWith("")

            const lockAmount = await helixToken.balanceOf(alice.address)
            const lockModifierIndex = 0

            // expected deposit values
            const expectedDepositor = alice.address
            const expectedAmount = lockAmount
            const expectedWeight = bigInt(5)
            const now = bigInt((await hre.ethers.provider.getBlock("latest")).timestamp).add(2)
            const expectedDepositTimestamp = now
            const lockDuration = (await synthReactor.lockModifiers(0)).duration
            const expectedUnlockTimestamp = now.add(lockDuration)
            const expectedWithdrawn = false

            await helixToken.connect(alice).approve(synthReactor.address, lockAmount)
            await synthReactor.connect(alice).lock(lockAmount, lockModifierIndex)

            const deposit = await synthReactor.deposits(0)
            expect(deposit.depositor).to.eq(expectedDepositor)
            expect(deposit.deposited).to.eq(expectedAmount)
            expect(deposit.balance).to.eq(expectedAmount)
            expect(deposit.weight).to.eq(expectedWeight)
            expect(deposit.depositTimestamp).to.eq(expectedDepositTimestamp)
            expect(deposit.unlockTimestamp).to.eq(expectedUnlockTimestamp)
            expect(deposit.withdrawn).to.eq(expectedWithdrawn)
        })

        it("transfers helix from the caller to the synthReactor contract", async () => {
            const lockAmount = await helixToken.balanceOf(alice.address)
            const lockModifierIndex = 0
            await helixToken.connect(alice).approve(synthReactor.address, lockAmount)
            await synthReactor.connect(alice).lock(lockAmount, lockModifierIndex)

            expect(await helixToken.balanceOf(alice.address)).to.eq(bigInt(0))
        })

        it("emits Lock event", async () => {
            // alice locks her helix balance
            const lockAmount = await helixToken.balanceOf(alice.address)
            await helixToken.connect(alice).approve(synthReactor.address, lockAmount)
            const lockModifierIndex = 0
            await expect(synthReactor.connect(alice).lock(lockAmount, lockModifierIndex))
                .to.emit(synthReactor, "Lock")
        })

        it("accounts for stakedNfts when calculating shares", async () => {
            // alice stakes an nft
            await nftChef.connect(alice).stake([1])

            // alice locks her helix
            const lockAmount = await helixToken.balanceOf(alice.address)
            const lockModifierIndex = 0
            await helixToken.connect(alice).approve(synthReactor.address, lockAmount)
            await synthReactor.connect(alice).lock(lockAmount, lockModifierIndex)

            // calculate alice's expected totalShares accounting for stakedNfts
            const weight = (await synthReactor.lockModifiers(lockModifierIndex)).weight
            const weightedDeposits = lockAmount.mul(bigInt(100).add(weight)).div(bigInt(100))
            const expectedShares = weightedDeposits.mul(15).div(10)

            // check that the amount matches the expected 
            const shares = (await synthReactor.users(alice.address)).shares
            expect(shares).to.eq(expectedShares)
        })
    })

    describe("unlock", async () => {
        beforeEach(async () => {
            // set the synth to mint per block
            const synthToMintPerBlock = expandTo18Decimals(100)
            await synthReactor.setSynthToMintPerBlock(synthToMintPerBlock)
        })

        it("fails if the deposit index is invalid", async () => {
            const unlockAmount = bigInt(0)
            await expect(synthReactor.connect(alice).unlock(0, unlockAmount))
                .to.be.revertedWith("invalid deposit index")
        })

        it("fails if the amount is invalid", async () => {
            // fails if amount is 0
            // lock as alice
            const lockAmount = await helixToken.balanceOf(alice.address)
            const lockModifierIndex = 0
            await helixToken.connect(alice).approve(synthReactor.address, lockAmount)
            await synthReactor.connect(alice).lock(lockAmount, lockModifierIndex)

            let unlockAmount = bigInt(0)
            await expect(synthReactor.connect(alice).unlock(0, unlockAmount))
                .to.be.revertedWith("invalid amount")

            // fails if amount exceeds balance
            // advance time until the deposit can be unlocked
            const unlockTimestamp = ((await synthReactor.deposits(0)).unlockTimestamp).toNumber()
            await setNextBlockTimestamp(unlockTimestamp)

            unlockAmount = lockAmount.add(1) 
            await expect(synthReactor.connect(alice).unlock(0, unlockAmount))
                .to.be.revertedWith("amount exceeds balance")
        })

        it("fails if the caller is not the depositor", async () => {
            // lock as alice
            const lockAmount = await helixToken.balanceOf(alice.address)
            const lockModifierIndex = 0
            await helixToken.connect(alice).approve(synthReactor.address, lockAmount)
            await synthReactor.connect(alice).lock(lockAmount, lockModifierIndex)
        
            // unlock the deposit as bobby
            const depositIndex = bigInt(0)
            await expect(synthReactor.connect(bobby).unlock(depositIndex, lockAmount))
                .to.be.revertedWith("caller is not depositor")
        })

        it("fails if the deposit is still locked", async () => {
            // lock as alice
            const lockAmount = await helixToken.balanceOf(alice.address)
            const lockModifierIndex = 0
            await helixToken.connect(alice).approve(synthReactor.address, lockAmount)
            await synthReactor.connect(alice).lock(lockAmount, lockModifierIndex)

            // do not advance time until unlocked

            // try to unlock the deposit
            const depositIndex = bigInt(0)
            await expect(synthReactor.connect(alice).unlock(depositIndex, lockAmount))
                .to.be.revertedWith("deposit is locked")
        })

        it("calls harvestReward", async () => {
            const lockAmount = await helixToken.balanceOf(alice.address)
            const lockModifierIndex = 0
            await helixToken.connect(alice).approve(synthReactor.address, lockAmount)
            await synthReactor.connect(alice).lock(lockAmount, lockModifierIndex)

            // advance time until the deposit can be unlocked
            const unlockTimestamp = ((await synthReactor.deposits(0)).unlockTimestamp).toNumber()
            await setNextBlockTimestamp(unlockTimestamp)

            const depositIndex = bigInt(0)
            await expect(synthReactor.connect(alice).unlock(depositIndex, lockAmount))
                .to.emit(synthReactor, "HarvestReward")
        })

        it("decrements the deposit balance", async () => {
            const lockAmount = await helixToken.balanceOf(alice.address)
            const lockModifierIndex = 0
            await helixToken.connect(alice).approve(synthReactor.address, lockAmount)
            await synthReactor.connect(alice).lock(lockAmount, lockModifierIndex)

            // advance time until the deposit can be unlocked
            const unlockTimestamp = ((await synthReactor.deposits(0)).unlockTimestamp).toNumber()
            await setNextBlockTimestamp(unlockTimestamp)

            // unlock some portion of the locked helix
            const depositIndex = bigInt(0)
            const unlockAmount = bigInt(100)
            synthReactor.connect(alice).unlock(depositIndex, unlockAmount)

            // calculate the expected balance left in the deposit after unlocking
            let expectedBalance = lockAmount.sub(unlockAmount)
            let balance = (await synthReactor.deposits(depositIndex)).balance
            expect(roundBigInt(balance)).to.eq(roundBigInt(expectedBalance))

            // unlock again
            synthReactor.connect(alice).unlock(depositIndex, unlockAmount)

            // calculate the expected balance left in the deposit after unlocking
            expectedBalance = lockAmount.sub(unlockAmount).sub(unlockAmount)
            balance = (await synthReactor.deposits(depositIndex)).balance
            expect(roundBigInt(balance)).to.eq(roundBigInt(expectedBalance))
        })

        it("decrements the contract totalShares", async () => {
            const lockAmount = await helixToken.balanceOf(alice.address)
            const lockModifierIndex = 0
            await helixToken.connect(alice).approve(synthReactor.address, lockAmount)
            await synthReactor.connect(alice).lock(lockAmount, lockModifierIndex)

            // advance time until the deposit can be unlocked
            const unlockTimestamp = ((await synthReactor.deposits(0)).unlockTimestamp).toNumber()
            await setNextBlockTimestamp(unlockTimestamp)

            // alice unlocks her locked helix
            const depositIndex = bigInt(0)
            await synthReactor.connect(alice).unlock(depositIndex, lockAmount)

            expect(await synthReactor.totalShares()).to.eq(bigInt(0))
        })

        it("decrements the user's deposited helix", async () => {
            const lockAmount = await helixToken.balanceOf(alice.address)
            const lockModifierIndex = 0
            await helixToken.connect(alice).approve(synthReactor.address, lockAmount)
            await synthReactor.connect(alice).lock(lockAmount, lockModifierIndex)

            // advance time until the deposit can be unlocked
            const unlockTimestamp = ((await synthReactor.deposits(0)).unlockTimestamp).toNumber()
            await setNextBlockTimestamp(unlockTimestamp)

            // alice unlocks her locked helix
            const depositIndex = bigInt(0)
            await synthReactor.connect(alice).unlock(depositIndex, lockAmount)

            // compare the amount with the expected
            expect((await synthReactor.users(alice.address)).depositedHelix).to.eq(bigInt(0))
        })

        it("decrements the user's weighted deposits", async () => {
            const lockAmount = await helixToken.balanceOf(alice.address)
            const lockModifierIndex = 0
            await helixToken.connect(alice).approve(synthReactor.address, lockAmount)
            await synthReactor.connect(alice).lock(lockAmount, lockModifierIndex)

            // advance time until the deposit can be unlocked
            const unlockTimestamp = ((await synthReactor.deposits(0)).unlockTimestamp).toNumber()
            await setNextBlockTimestamp(unlockTimestamp)

            // alice unlocks her locked helix
            const depositIndex = bigInt(0)
            await synthReactor.connect(alice).unlock(depositIndex, lockAmount)

            // compare the amount with the expected
            expect((await synthReactor.users(alice.address)).weightedDeposits).to.eq(bigInt(0))
        })

        it("decrements the user's shares", async () => {
            const lockAmount = await helixToken.balanceOf(alice.address)
            const lockModifierIndex = 0
            await helixToken.connect(alice).approve(synthReactor.address, lockAmount)
            await synthReactor.connect(alice).lock(lockAmount, lockModifierIndex)

            // advance time until the deposit can be unlocked
            const unlockTimestamp = ((await synthReactor.deposits(0)).unlockTimestamp).toNumber()
            await setNextBlockTimestamp(unlockTimestamp)

            // alice unlocks her locked helix
            const depositIndex = bigInt(0)
            await synthReactor.connect(alice).unlock(depositIndex, lockAmount)

            // compare the amount with the expected
            expect((await synthReactor.users(alice.address)).shares).to.eq(bigInt(0))
        })

        it("marks deposit as withdrawn", async () => {
            const lockAmount = await helixToken.balanceOf(alice.address)
            const lockModifierIndex = 0
            await helixToken.connect(alice).approve(synthReactor.address, lockAmount)
            await synthReactor.connect(alice).lock(lockAmount, lockModifierIndex)
           
            // expect the deposit not to be withdrawn
            expect((await synthReactor.deposits(0)).withdrawn).to.be.false

            // advance time until the deposit can be unlocked
            const unlockTimestamp = ((await synthReactor.deposits(0)).unlockTimestamp).toNumber()
            await setNextBlockTimestamp(unlockTimestamp)

            // unlock the deposit
            const depositIndex = bigInt(0)
            await synthReactor.connect(alice).unlock(depositIndex, lockAmount)

            // expect the deposit to be marked as withdrawn
            expect((await synthReactor.deposits(0)).withdrawn).to.be.true
        })

        it("returns the deposited amount to the caller", async () => {
            const lockAmount = await helixToken.balanceOf(alice.address)
            const lockModifierIndex = 0
            await helixToken.connect(alice).approve(synthReactor.address, lockAmount)
            await synthReactor.connect(alice).lock(lockAmount, lockModifierIndex)

            // expect alice's helix balance to be 0
            const prevHelixBalance = await helixToken.balanceOf(alice.address)
            expect(prevHelixBalance).to.eq(bigInt(0))
           
            // advance time until the deposit can be unlocked
            const unlockTimestamp = ((await synthReactor.deposits(0)).unlockTimestamp).toNumber()
            await setNextBlockTimestamp(unlockTimestamp)

            // alice unlocks her locked helix
            const depositIndex = bigInt(0)
            await synthReactor.connect(alice).unlock(depositIndex, lockAmount)

            // expect alice's deposited amount to be returned
            const expectedHelixBalance = prevHelixBalance.add(lockAmount)
            expect(await helixToken.balanceOf(alice.address)).to.eq(expectedHelixBalance)
        })

        it("emits Unlock event", async () => {
            const lockAmount = await helixToken.balanceOf(alice.address)
            const lockModifierIndex = 0
            await helixToken.connect(alice).approve(synthReactor.address, lockAmount)
            await synthReactor.connect(alice).lock(lockAmount, lockModifierIndex)

            // advance time until the deposit can be unlocked
            const unlockTimestamp = ((await synthReactor.deposits(0)).unlockTimestamp).toNumber()
            await setNextBlockTimestamp(unlockTimestamp)

            // alice unlocks her locked helix
            const depositIndex = bigInt(0)
            await expect(synthReactor.connect(alice).unlock(depositIndex, lockAmount))
                .to.emit(synthReactor, "Unlock")
        })
    })

    describe("updateUserStakedNfts", async () => {
        beforeEach(async () => {
            // set the synth to mint per block
            const synthToMintPerBlock = expandTo18Decimals(100)
            await synthReactor.setSynthToMintPerBlock(synthToMintPerBlock)

            const aliceHelixBalance = await helixToken.balanceOf(alice.address)
            await helixToken.connect(alice).approve(synthReactor.address, aliceHelixBalance)

            const bobbyHelixBalance = await helixToken.balanceOf(bobby.address)
            await helixToken.connect(bobby).approve(synthReactor.address, bobbyHelixBalance)
        })

        it("fails if caller is not nftChef", async () => {
            await expect(synthReactor.connect(alice).updateUserStakedNfts(alice.address, 1))
                .to.be.revertedWith("caller is not nftChef")
        })

        it("does nothing if the user has no open deposits", async () => {
            const aliceTokenIds = [1]
            await expect(nftChef.connect(alice).stake(aliceTokenIds))
                .to.not.emit(synthReactor, "UpdateUserStakedNfts")
        })

        it("calls harvestReward", async () => {
            // alice locks her helix
            const lockAmount = await helixToken.balanceOf(alice.address)
            const lockModifierIndex = 0
            await synthReactor.connect(alice).lock(lockAmount, lockModifierIndex)

            // check that alice has deposited helix
            const aliceDepositedHelix = (await synthReactor.users(alice.address)).depositedHelix
            expect(aliceDepositedHelix).to.not.eq(bigInt(0))
            expect(aliceDepositedHelix).to.eq(lockAmount)

            // alice stakes an nft
            const aliceTokenIds = [1]
            await expect(nftChef.connect(alice).stake(aliceTokenIds))
                .to.emit(synthReactor, "UpdateUserStakedNfts")
        })

        it("increases the total shares when the user increases their stakedNfts", async () => {
            // alice locks her helix
            const lockAmount = await helixToken.balanceOf(alice.address)
            const lockModifierIndex = 0
            await synthReactor.connect(alice).lock(lockAmount, lockModifierIndex)

            // record the total shares before staking
            const prevTotalShares = await synthReactor.totalShares()

            // the nft(s) alice will stake
            const tokenIds = [1]
            const stakedNfts = tokenIds.length

            // calculate alice's shares she should have after staking
            const weight = (await synthReactor.lockModifiers(lockModifierIndex)).weight
            const weightedDeposit = await getWeightedDeposit(lockAmount, weight)
            const expectedTotalShares = await getShares(weightedDeposit, stakedNfts)

            // alice stakes an nft
            await expect(nftChef.connect(alice).stake(tokenIds))
                .to.emit(synthReactor, "UpdateUserStakedNfts")

            // check that alice's shares were increased and correctly set
            const totalShares = await synthReactor.totalShares()
            expect(totalShares).to.be.above(prevTotalShares)
            expect(totalShares).to.eq(expectedTotalShares)
        })

        it("decreases the total shares when the user decreases their stakedNfts", async () => {
            // alice locks her helix
            const lockAmount = await helixToken.balanceOf(alice.address)
            const lockModifierIndex = 0
            await synthReactor.connect(alice).lock(lockAmount, lockModifierIndex)

            // the nft(s) alice will stake
            const tokenIds = [1]

            // alice stakes an nft
            await expect(nftChef.connect(alice).stake(tokenIds))
                .to.emit(synthReactor, "UpdateUserStakedNfts")

            // record the total shares before unstaking
            const prevTotalShares = await synthReactor.totalShares()

            // calculate alice's shares she should have after unstaking
            const weight = (await synthReactor.lockModifiers(lockModifierIndex)).weight
            const weightedDeposit = await getWeightedDeposit(lockAmount, weight)
            const stakedNfts = bigInt(0)
            const expectedTotalShares = await getShares(weightedDeposit, stakedNfts)

            // alice unstakes her nft
            await expect(nftChef.connect(alice).unstake(tokenIds))
                .to.emit(synthReactor, "UpdateUserStakedNfts")

            // check that alice's shares were decreased and correctly set
            const totalShares = await synthReactor.totalShares()
            expect(totalShares).to.be.below(prevTotalShares)
            expect(totalShares).to.eq(expectedTotalShares)
        })

        it("increases the user's shares when the user increases their stakedNfts", async () => {
            // alice locks her helix
            const lockAmount = await helixToken.balanceOf(alice.address)
            const lockModifierIndex = 0
            await synthReactor.connect(alice).lock(lockAmount, lockModifierIndex)

            // record alice's shares before staking
            const prevShares = (await synthReactor.users(alice.address)).shares

            // the nft(s) alice will stake
            const tokenIds = [1]
            const stakedNfts = tokenIds.length

            // calculate alice's shares she should have after staking
            const weight = (await synthReactor.lockModifiers(lockModifierIndex)).weight
            const weightedDeposit = await getWeightedDeposit(lockAmount, weight)
            const expectedShares = await getShares(weightedDeposit, stakedNfts)

            // alice stakes an nft
            await expect(nftChef.connect(alice).stake(tokenIds))
                .to.emit(synthReactor, "UpdateUserStakedNfts")

            // check that alice's shares were increased and correctly set
            const shares = (await synthReactor.users(alice.address)).shares
            expect(shares).to.be.above(prevShares)
            expect(shares).to.eq(expectedShares)
        })

        it("decreases the user's shares when the user decreases their stakedNfts", async () => {
            // alice locks her helix
            const lockAmount = await helixToken.balanceOf(alice.address)
            const lockModifierIndex = 0
            await synthReactor.connect(alice).lock(lockAmount, lockModifierIndex)

            // the nft(s) alice will stake
            const tokenIds = [1]

            // alice stakes an nft
            await expect(nftChef.connect(alice).stake(tokenIds))
                .to.emit(synthReactor, "UpdateUserStakedNfts")

            // record alice's shares before unstaking
            const prevShares = (await synthReactor.users(alice.address)).shares

            // calculate alice's shares she should have after unstaking
            const weight = (await synthReactor.lockModifiers(lockModifierIndex)).weight
            const weightedDeposit = await getWeightedDeposit(lockAmount, weight)
            const stakedNfts = bigInt(0)
            const expectedShares = await getShares(weightedDeposit, stakedNfts)

            // alice unstakes her nft
            await expect(nftChef.connect(alice).unstake(tokenIds))
                .to.emit(synthReactor, "UpdateUserStakedNfts")

            // check that alice's shares were decreased and correctly set
            const shares = (await synthReactor.users(alice.address)).shares
            expect(shares).to.be.below(prevShares)
            expect(shares).to.eq(expectedShares)
        })

        it("emits UpdateUserStakedNfts event", async() => {
            // alice locks her helix
            const lockAmount = await helixToken.balanceOf(alice.address)
            const lockModifierIndex = 0
            await synthReactor.connect(alice).lock(lockAmount, lockModifierIndex)

            // the nft(s) alice will stake
            const tokenIds = [1]

            // alice stakes an nft
            await expect(nftChef.connect(alice).stake(tokenIds))
                .to.emit(synthReactor, "UpdateUserStakedNfts")
        })
    })

    describe("multiple locks with different weights and stakedNfts", async () => {
        beforeEach(async () => {
            // set the synth to mint per block
            const synthToMintPerBlock = expandTo18Decimals(100)
            await synthReactor.setSynthToMintPerBlock(synthToMintPerBlock)

            const aliceHelixBalance = await helixToken.balanceOf(alice.address)
            await helixToken.connect(alice).approve(synthReactor.address, aliceHelixBalance)

            const bobbyHelixBalance = await helixToken.balanceOf(bobby.address)
            await helixToken.connect(bobby).approve(synthReactor.address, bobbyHelixBalance)
        })

        it("calculates shares properly", async() => {
            // sanity check that all are zero before any deposits
            let expectedAliceShares = bigInt(0)
            let expectedBobbyShares = bigInt(0)
            let expectedTotalShares = bigInt(0)

            expect((await synthReactor.users(alice.address)).shares).to.eq(expectedAliceShares)
            expect((await synthReactor.users(bobby.address)).shares).to.eq(expectedBobbyShares)
            expect(await synthReactor.totalShares()).to.eq(expectedTotalShares)

            // alice deposits some helix
            let aliceLockAmount = expandTo18Decimals(100)
            let aliceDurationIndex = 0
            await synthReactor.connect(alice).lock(aliceLockAmount, aliceDurationIndex)

            // check that alice's values are properly calculated
            let expectedAliceDepositedHelix = aliceLockAmount
            expect((await synthReactor.users(alice.address)).depositedHelix).to.eq(expectedAliceDepositedHelix)

            let expectedAliceWeightedDeposits = getWeightedDeposit(aliceLockAmount, await weight(aliceDurationIndex))
            expect((await synthReactor.users(alice.address)).weightedDeposits).to.eq(expectedAliceWeightedDeposits)

            expectedAliceShares = getShares(expectedAliceWeightedDeposits, await stakedNfts(alice.address))
            expect((await synthReactor.users(alice.address)).shares).to.eq(expectedAliceShares)

            // check that the total shares match alice's shares
            expectedTotalShares = expectedAliceShares
            expect(await synthReactor.totalShares()).to.eq(expectedTotalShares)

            // bobby deposits some helix
            let bobbyLockAmount = expandTo18Decimals(50)
            let bobbyDurationIndex = 2
            await synthReactor.connect(bobby).lock(bobbyLockAmount, bobbyDurationIndex)

            // check that bobby's values are properly calculated
            let expectedBobbyDepositedHelix = bobbyLockAmount
            expect((await synthReactor.users(bobby.address)).depositedHelix).to.eq(expectedBobbyDepositedHelix)

            let expectedBobbyWeightedDeposits = getWeightedDeposit(bobbyLockAmount, await weight(bobbyDurationIndex))
            expect((await synthReactor.users(bobby.address)).weightedDeposits).to.eq(expectedBobbyWeightedDeposits)

            expectedBobbyShares = getShares(expectedBobbyWeightedDeposits, await stakedNfts(bobby.address))
            expect((await synthReactor.users(bobby.address)).shares).to.eq(expectedBobbyShares)

            // check that the total shares match the sum of alice's and bobby's shares
            expectedTotalShares = expectedAliceShares.add(expectedBobbyShares)
            expect(await synthReactor.totalShares()).to.eq(expectedTotalShares)

            // alice deposits more helix
            aliceLockAmount = expandTo18Decimals(115)
            aliceDurationIndex = 1
            await synthReactor.connect(alice).lock(aliceLockAmount, aliceDurationIndex)

            // check that alice's values are properly calculated
            expectedAliceDepositedHelix = expectedAliceDepositedHelix.add(aliceLockAmount)
            expect((await synthReactor.users(alice.address)).depositedHelix).to.eq(expectedAliceDepositedHelix)

            expectedAliceWeightedDeposits = expectedAliceWeightedDeposits.add(getWeightedDeposit(aliceLockAmount, await weight(aliceDurationIndex)))
            expect((await synthReactor.users(alice.address)).weightedDeposits).to.eq(expectedAliceWeightedDeposits)

            expectedAliceShares = getShares(expectedAliceWeightedDeposits, await stakedNfts(alice.address))
            expect((await synthReactor.users(alice.address)).shares).to.eq(expectedAliceShares)

            // check that the total shares match the sum of alice's and bobby's shares
            expectedTotalShares = expectedAliceShares.add(expectedBobbyShares)
            expect(await synthReactor.totalShares()).to.eq(expectedTotalShares)

            // alice stakes an nft
            let aliceTokenIds = [1]
            await nftChef.connect(alice).stake(aliceTokenIds)

            // check that alice's values are properly calculated
            expect((await synthReactor.users(alice.address)).depositedHelix).to.eq(expectedAliceDepositedHelix)
            expect((await synthReactor.users(alice.address)).weightedDeposits).to.eq(expectedAliceWeightedDeposits)

            expectedAliceShares = getShares(expectedAliceWeightedDeposits, await stakedNfts(alice.address))
            expect((await synthReactor.users(alice.address)).shares).to.eq(expectedAliceShares)

            // check that the total shares match the sum of alice's and bobby's shares
            expectedTotalShares = expectedAliceShares.add(expectedBobbyShares)
            expect(await synthReactor.totalShares()).to.eq(expectedTotalShares)

            // alice stakes 2 more nfts
            aliceTokenIds = [2, 3]
            await nftChef.connect(alice).stake(aliceTokenIds)

            // check that alice's values are properly calculated
            expect((await synthReactor.users(alice.address)).depositedHelix).to.eq(expectedAliceDepositedHelix)
            expect((await synthReactor.users(alice.address)).weightedDeposits).to.eq(expectedAliceWeightedDeposits)

            expectedAliceShares = getShares(expectedAliceWeightedDeposits, await stakedNfts(alice.address))
            expect((await synthReactor.users(alice.address)).shares).to.eq(expectedAliceShares)

            // check that the total shares match the sum of alice's and bobby's shares
            expectedTotalShares = expectedAliceShares.add(expectedBobbyShares)
            expect(await synthReactor.totalShares()).to.eq(expectedTotalShares)

            // bobby deposits more helix
            bobbyLockAmount = expandTo18Decimals(211)
            bobbyDurationIndex = 4
            await synthReactor.connect(bobby).lock(bobbyLockAmount, bobbyDurationIndex)

            // check that bobby's values are properly calculated
            expectedBobbyDepositedHelix = expectedBobbyDepositedHelix.add(bobbyLockAmount)
            expect((await synthReactor.users(bobby.address)).depositedHelix).to.eq(expectedBobbyDepositedHelix)

            expectedBobbyWeightedDeposits = expectedBobbyWeightedDeposits.add(getWeightedDeposit(bobbyLockAmount, await weight(bobbyDurationIndex)))
            expect((await synthReactor.users(bobby.address)).weightedDeposits).to.eq(expectedBobbyWeightedDeposits)

            expectedBobbyShares = getShares(expectedBobbyWeightedDeposits, await stakedNfts(bobby.address))
            expect((await synthReactor.users(bobby.address)).shares).to.eq(expectedBobbyShares)

            // check that the total shares match the sum of alice's and bobby's shares
            expectedTotalShares = expectedAliceShares.add(expectedBobbyShares)
            expect(await synthReactor.totalShares()).to.eq(expectedTotalShares)

            // alice unstakes all of her nfts
            aliceTokenIds = [1, 2, 3]
            await nftChef.connect(alice).unstake(aliceTokenIds)

            // check that alice's values are properly calculated
            expect((await synthReactor.users(alice.address)).depositedHelix).to.eq(expectedAliceDepositedHelix)
            expect((await synthReactor.users(alice.address)).weightedDeposits).to.eq(expectedAliceWeightedDeposits)

            expectedAliceShares = getShares(expectedAliceWeightedDeposits, await stakedNfts(alice.address))
            expect((await synthReactor.users(alice.address)).shares).to.eq(expectedAliceShares)

            // check that the total shares match the sum of alice's and bobby's shares
            expectedTotalShares = expectedAliceShares.add(expectedBobbyShares)
            expect(await synthReactor.totalShares()).to.eq(expectedTotalShares)
        })

        it("accrues higher rewards to users with higher weights", async () => {
            // alice prepares to lock her helix balance
            const prevAliceSynthBalance = await synthToken.balanceOf(alice.address)
            const aliceLockAmount = await helixToken.balanceOf(alice.address)
            const aliceDurationIndex = 0
            await helixToken.connect(alice).approve(synthReactor.address, aliceLockAmount)
            const aliceWeight = (await synthReactor.lockModifiers(aliceDurationIndex)).weight

            // bobby prepares to lock his helix balance
            const prevBobbySynthBalance = await synthToken.balanceOf(bobby.address)
            const bobbyLockAmount = await helixToken.balanceOf(bobby.address)
            const bobbyDurationIndex = 1
            await helixToken.connect(bobby).approve(synthReactor.address, bobbyLockAmount)
            const bobbyWeight = (await synthReactor.lockModifiers(bobbyDurationIndex)).weight

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

            await synthReactor.connect(alice).harvestReward()

            const aliceSynthBalance = await synthToken.balanceOf(alice.address)
            // TODO
            // expect(aliceSynthBalance).to.eq(expectedAliceReward)
        })
    })

    function getWeightedDeposit(amount, weight) {
        return amount.mul(bigInt(100).add(weight)).div(bigInt(100))
    }

    function getShares(weightedDeposit, stakedNfts) {
        if (stakedNfts <= 0) {
            return weightedDeposit
        } else if (stakedNfts <= 2) {
            return weightedDeposit.mul(15).div(10)
        } else {
            return weightedDeposit.mul(2)
        }
    }

    async function stakedNfts(user) {
        return await nftChef.getUserStakedNfts(user)
    }

    async function weight(lockModifierIndex) {
        return (await synthReactor.lockModifiers(lockModifierIndex)).weight
    }

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
