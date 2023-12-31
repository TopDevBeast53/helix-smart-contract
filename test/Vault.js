const { expect } = require("chai")

const { waffle } = require("hardhat")
const { loadFixture } = waffle

const { constants } = require( "legacy-ethers")
const { MaxUint256 } = require("legacy-ethers/constants")

const { expandTo18Decimals } = require("./shared/utilities")
const { fullExchangeFixture } = require("./shared/fixtures")

const env = require("../constants/env")
const initials = require("../constants/initials")
const addresses = require("../constants/addresses")

const startBlock = initials.HELIX_VAULT_START_BLOCK[env.testNetwork]
const lastRewardBlock = initials.HELIX_VAULT_LAST_REWARD_BLOCK[env.testNetwork]

const treasuryAddress = addresses.TREASURY[env.testNetwork]

const SECONDS_PER_DAY = 86400
const rewardPerBlock = "937000000000000000"

const verbose = true

describe('Vault', () => {
    let provider
    let wallet0, wallet1

    let vault
    let helixToken
    let feeHandler
    let feeMinter

    // Vault owned by wallet1 (not the owner), used for checking isOwner privileges
    let vault1

    beforeEach(async () => {
        [wallet0, wallet1] = await ethers.getSigners()

        const fullExchange = await loadFixture(fullExchangeFixture)
        vault = fullExchange.vault
        helixToken = fullExchange.helixToken
        feeHandler = fullExchange.feeHandler
        feeMinter = fullExchange.feeMinter

        // Fund vault with reward tokens
        await helixToken.transfer(vault.address, expandTo18Decimals(10000))

        // Approve the vault to spend caller's funds
        await helixToken.approve(vault.address, MaxUint256)

        // Create the wallet1 owned vault
        vault1 = await vault.connect(wallet1)
    })

    it('vault: initialized with expected values', async () => {
        expect(await vault.token()).to.eq(helixToken.address)
        expect(await vault.getToMintPerBlock()).to.eq(rewardPerBlock)
        expect(await vault.lastRewardBlock()).to.eq(lastRewardBlock)
        expect(await helixToken.balanceOf(vault.address)).to.eq(expandTo18Decimals(10000))
    })

    it('vault: get durations initialized by constructor', async () => {
        const durations = await vault.getDurations()

        expect(durations[0].duration).to.eq(90 * SECONDS_PER_DAY)     // duration (n days * seconds per day)
        expect(durations[0].weight).to.eq(5)                          // weight

        expect(durations[1].duration).to.eq(180 * SECONDS_PER_DAY)
        expect(durations[1].weight).to.eq(10)

        expect(durations[2].duration).to.eq(360 * SECONDS_PER_DAY)
        expect(durations[2].weight).to.eq(30)

        expect(durations[3].duration).to.eq(540 * SECONDS_PER_DAY)
        expect(durations[3].weight).to.eq(50)

        expect(durations[4].duration).to.eq(720 * SECONDS_PER_DAY)
        expect(durations[4].weight).to.eq(100)
    })

    it('vault: add duration', async () => {
        const duration = 1;
        const weight = 100;
        await vault.addDuration(duration, weight)

        const durations = await vault.getDurations()
        // expect the length to equal 6 since 5 durations were added by the constructor
        expect(durations.length).to.eq(6)

        expect(durations[5].duration).to.eq(duration)
        expect(durations[5].weight).to.eq(weight)
    })

    it('vault: add duration with invalid duration fails to add', async () => {
        const invalidDuration = 0;
        const weight = 100;
        await expect(vault.addDuration(invalidDuration, weight))
            .to.be.revertedWith("Vault: zero duration")
    })

    it('vault: add duration with invalid weight fails to add', async () => {
        const duration = 1;
        const invalidWeight = 0;
        await expect(vault.addDuration(duration, invalidWeight))
            .to.be.revertedWith("Vault: zero weight")
    })

    it('vault: add duration as non-owner fails to add', async () => {
        const duration = 1;
        const weight = 100;
        await expect(vault1.addDuration(duration, weight))
            .to.be.revertedWith("CallerIsNotTimelockOwner")
    })

    it('vault: remove duration', async () => {
        // vault is initialized with 5 durations
        // remove the middle duration
        await vault.removeDuration(2)

        // and check that the remaining 4 durations exist and are correctly ordered
        let durations = await vault.getDurations()

        expect(durations[0].duration).to.eq(90 * SECONDS_PER_DAY)
        expect(durations[0].weight).to.eq(5)

        expect(durations[1].duration).to.eq(180 * SECONDS_PER_DAY)
        expect(durations[1].weight).to.eq(10)

        expect(durations[2].duration).to.eq(540 * SECONDS_PER_DAY)
        expect(durations[2].weight).to.eq(50)

        expect(durations[3].duration).to.eq(720 * SECONDS_PER_DAY)
        expect(durations[3].weight).to.eq(100)

        // remove the first duration
        await vault.removeDuration(0)

        // and check that the remaining 3 durations exist and are correctly ordered
        durations = await vault.getDurations()

        expect(durations[0].duration).to.eq(180 * SECONDS_PER_DAY)
        expect(durations[0].weight).to.eq(10)

        expect(durations[1].duration).to.eq(540 * SECONDS_PER_DAY)
        expect(durations[1].weight).to.eq(50)

        expect(durations[2].duration).to.eq(720 * SECONDS_PER_DAY)
        expect(durations[2].weight).to.eq(100)

        // remove the last duration
        await vault.removeDuration(2)

        // and check that the remaining 2 durations exist and are correctly ordered
        durations = await vault.getDurations()

        expect(durations[0].duration).to.eq(180 * SECONDS_PER_DAY)
        expect(durations[0].weight).to.eq(10)

        expect(durations[1].duration).to.eq(540 * SECONDS_PER_DAY)
        expect(durations[1].weight).to.eq(50)

        // remove the two remaining durations
        await vault.removeDuration(0)
        await vault.removeDuration(0)

        // and check that there are no remaining durations
        durations = await vault.getDurations()
        expect(durations.length).to.eq(0)

        // try to remove from empty array and expect error
        await expect(vault.removeDuration(0))
            .to.be.revertedWith("Vault: invalid index")
    })

    it('vault: remove duration with invalid duration index fails to remove', async () => {
        await expect(vault.removeDuration(5)).to.be.revertedWith("Vault: invalid index")
    })

    it('vault: remove duration as non-owner fails to remove', async () => {
        await expect(vault1.removeDuration(0))
            .to.be.revertedWith('CallerIsNotTimelockOwner')
    })

    it('vault: get blocks difference', async () => {
        const lastRewardBlock = await vault.lastRewardBlock()

        // Expect to enter the "if" condition
        let to = lastRewardBlock - 1
        let from = to - 1
        expect(await vault.getBlocksDifference(from, to)).to.eq(to - from)

        // Expect to enter the "else if" condition
        to = lastRewardBlock + 2
        from = lastRewardBlock
        expect(await vault.getBlocksDifference(from, to)).to.eq(0)

        // Expect to enter the "else" condition
        to = lastRewardBlock + 1
        from = lastRewardBlock - 1
        expect(await vault.getBlocksDifference(from, to)).to.eq(lastRewardBlock - from)
    })

    it('vault: get blocks difference fails if "to" preceeds "from" block', async () => {
        const to = 998
        const from = 999
        // require "to" to be less than "from" for following test to fail as expected
        expect(to).to.be.below(from)
        await expect(vault.getBlocksDifference(from, to))
            .to.be.revertedWith("Vault: invalid block values")
    })

    it('vault: update pool', async () => {
        // Skip testing block.number <= lastUpdateBlock condition

        // First test the case where the vault contract balance is 0
        // overwrite vault2 with a fresh deployment so that the contract's token balance == 0
        const vaultContractFactory = await ethers.getContractFactory("HelixVault")                                                      
        const vault2 = await vaultContractFactory.deploy()                                              
        await vault2.initialize(                                                                        
            helixToken.address,                                                                        
            feeHandler.address,                                                                        
            feeMinter.address,                                                                         
            0,                                                                           
            0,
            0
        )
        expect(await helixToken.balanceOf(vault2.address)).to.eq(0)

        // and now after update expect lastUpdateBlock to be increased
        // but expect accTokenPerShare to stay the same

        let prevAccTokenPerShare = await vault2.accTokenPerShare()
        expect(prevAccTokenPerShare).to.eq(0)

        // +1 since update pool occurs on block after reading the block number
        let prevLastRewardBlock = await vault2.lastUpdateBlock()
        let expectedBlockNumber = (await ethers.provider.getBlockNumber()) + 1

        await vault2.updatePool()

        expect(await vault2.accTokenPerShare()).to.eq(prevAccTokenPerShare)
        expect(await vault2.lastUpdateBlock()).to.eq(expectedBlockNumber)

        // Now test the case where the contract balance is not zero
        // Note that we're now using "vault" and not "vault2"
        prevAccTokenPerShare = await vault.accTokenPerShare()
        prevLastRewardBlock = await vault.lastUpdateBlock()

        expectedBlockNumber = (await ethers.provider.getBlockNumber()) + 1
        const expectedAccTokenPerShare = await getAccTokenPerShare(expectedBlockNumber)

        await vault.updatePool()

        expect(await vault.accTokenPerShare()).to.eq(expectedAccTokenPerShare)
        expect(await vault.lastUpdateBlock()).to.eq(expectedBlockNumber)
    })

    it('vault: new deposit fails if invalid amount is passed', async () => {
        const invalidAmount = 0
        const durationIndex = 0

        await expect(vault.newDeposit(invalidAmount, durationIndex))
            .to.be.revertedWith("Vault: zero amount")
    })

    it('vault: new deposit triggers update pool', async () => {
        // only testing that update is called during successful deposit
        const expectedBlockNumber = (await ethers.provider.getBlockNumber()) + 1
        const expectedAccTokenPerShare = await getAccTokenPerShare(expectedBlockNumber)

        const amount = expandTo18Decimals(100)
        const durationIndex = 0
        await vault.newDeposit(amount, durationIndex);

        expect(await vault.accTokenPerShare()).to.eq(expectedAccTokenPerShare)
        expect(await vault.lastUpdateBlock()).to.eq(expectedBlockNumber)
    })

    it('vault: new deposit fails if called with invalid index', async () => {
        const amount = expandTo18Decimals(100)
        const invalidDurationIndex = (await vault.getDurations()).length

        await expect(vault.newDeposit(amount, invalidDurationIndex))
            .to.be.revertedWith("Vault: invalid index")
    })

    it('vault: new deposit', async () => {
        const amount = expandTo18Decimals(100)
        const durationIndex = 0

        // track the change in vault balance after deposit
        const prevVaultBalance = await helixToken.balanceOf(vault.address)

        // create the new deposit
        await vault.newDeposit(amount, durationIndex);

        // check that it was created
        const depositIds = await vault.getDepositIds(wallet0.address)
        expect(depositIds[0]).to.eq(0)

        const expectedWeight = (await vault.durations(0)).weight

        // check that the deposit was made
        const deposit = await vault.deposits(depositIds[0])
        expect(deposit.depositor).to.eq(wallet0.address)
        expect(deposit.amount).to.eq(amount)
        expect(deposit.weight).to.eq(expectedWeight)
        // Don't check timestamps
        expect(deposit.rewardDebt).to.eq(await getReward(amount, expectedWeight))
        expect(deposit.withdrawn).to.be.false

        // check that funds were transfered to the vault
        // note: using above and not eq since the balance will be slightly
        // higher due to the minted reward
        expect(await helixToken.balanceOf(vault.address))
            .to.above(amount.add(prevVaultBalance))
    })

    it('vault: new deposit emits NewDeposit event', async () => {
        const amount = expandTo18Decimals(100)
        const durationIndex = 0

        const expectedId = await vault.depositId()
        const durations = await vault.getDurations()
        const expectedDurationShift = (durations[0].duration).toNumber()
        const expectedWeight = durations[0].weight

        await expect(vault.newDeposit(amount, durationIndex))
            .to.emit(vault, 'NewDeposit')
    })

    it('vault: update deposit fails if called with invalid id', async () => {
        let amount = expandTo18Decimals(100)
        // invalid because no deposit has been made
        let invalidId = 1

        await expect(vault.updateDeposit(amount, invalidId))
            .to.be.revertedWith("Vault: no deposit made")
    })

    it('vault: update deposit fails if caller is not depositor', async () => {
        // first deposit to vault as wallet0 resulting in depositId == 1
        let amount = expandTo18Decimals(100)
        let index = 0
        await vault.newDeposit(amount, index);

        // then make deposit to depositId == 1 as wallet1
        let id = 0
        await expect(vault1.updateDeposit(amount, id))
            .to.be.revertedWith("Vault: not depositor")
    })

    it('vault: update deposit', async () => {
        // First create a new deposit
        let amount = expandTo18Decimals(100)
        let durationIndex = 0

        // create the new deposit
        await vault.newDeposit(amount, durationIndex);

        // check that it was correctly created
        let depositIds = await vault.getDepositIds(wallet0.address)
        expect(depositIds[0]).to.eq(0)

        let expectedWeight = 5;  // 5%

        let deposit = await vault.deposits(depositIds[0])
        expect(deposit.depositor).to.eq(wallet0.address)
        expect(deposit.amount).to.eq(amount)
        expect(deposit.weight).to.eq(expectedWeight)
        // Don't check timestamps
        expect(deposit.rewardDebt).to.eq(await getReward(amount, expectedWeight))
        expect(deposit.withdrawn).to.be.false

        // Then update the deposit and test the change
        let id = 0
        await vault.updateDeposit(amount, id);

        // get the deposit ids for this users
        depositIds = await vault.getDepositIds(wallet0.address)

        // confirm that the correct id was assigned
        expect(depositIds[0]).to.eq(id)

        // the new, expected amount of deposit
        const newAmount = amount.mul(2)

        // check that the deposit has updated values
        deposit = await vault.deposits(depositIds[0])
        expect(deposit.depositor).to.eq(wallet0.address)
        expect(deposit.amount).to.eq(newAmount)
        expect(deposit.weight).to.eq(expectedWeight)
        // Don't check timestamps
        expect(deposit.rewardDebt).to.eq(await getReward(newAmount, expectedWeight))
        expect(deposit.withdrawn).to.be.false
    })

    it('vault: update deposit emits UpdateDeposit event', async () => {
        // Make initial deposit
        let amount = expandTo18Decimals(100)
        let durationIndex = 0
        await vault.newDeposit(amount, durationIndex);

        // Now update the deposit
        const expectedId = 0
        const expectedBalance = amount.mul(2)
        await expect(vault.updateDeposit(amount, expectedId))
            .to.emit(vault, 'UpdateDeposit')
            .withArgs(
                wallet0.address,
                expectedId,
                amount,
                expectedBalance
            )
    })

    it('vault: withdraw fails if caller is not depositor', async () => {
        // Deposit as wallet0 and attempt withdrawal as wallet1
        let amount = expandTo18Decimals(100)
        let durationIndex = 0
        await vault.newDeposit(amount, durationIndex)

        let id = 0
        await expect(vault1.withdraw(amount, id))
            .to.be.revertedWith("Vault: not depositor")
    })

    it('vault: withdraw fails if deposit is already withdrawn', async () => {
        // Add the smallest possible duration so that a withdrawl can be made by the test
        const duration = 1
        const weight = 100
        await vault.addDuration(duration, weight)

        // make a deposit
        let amount = expandTo18Decimals(100)
        let durationIndex = (await vault.getDurations()).length - 1     // use the most recently created duration
        await vault.newDeposit(amount, durationIndex)

        let id = (await vault.depositId()).sub(1)

        // and use that to get the withdraw timestamp
        const deposit = await vault.deposits(id)
        const expectedWithdrawTimestamp = deposit.withdrawTimestamp

        // wait until that timestamp has passed
        await waitUntil(expectedWithdrawTimestamp)

        // Perform a withdrawl
        await vault.withdraw(amount, id)

        // expect another withdrawal to fail
        await expect(vault.withdraw(amount, id))
            .to.be.revertedWith('Vault: withdrawn')
    })

    it('vault: withdraw fails if withdrawing amount larger than that deposited', async () => {
        // Add the smallest possible duration so that a withdrawl can be made by the test
        const duration = 1
        const weight = 100
        await vault.addDuration(duration, weight)

        // make a deposit
        let amount = expandTo18Decimals(100)
        let durationIndex = (await vault.getDurations()).length - 1     // use the most recently created duration
        await vault.newDeposit(amount, durationIndex)

        // get the most recent deposit id
        let id = await vault.depositId()

        // and use that to get the withdraw timestamp
        const deposit = await vault.deposits(id)
        const expectedWithdrawTimestamp = deposit.withdrawTimestamp

        // wait until that timestamp has passed
        await waitUntil(expectedWithdrawTimestamp)

        // expect withdrawl to fail
        const invalidAmount = amount.add(1)
        id = (await vault.depositId()).sub(1)
        await expect(vault.withdraw(invalidAmount, id))
            .to.be.reverted
    })

    it('vault: withdraw fails if tokens are locked', async () => {
        // make a deposit
        let amount = expandTo18Decimals(100)
        let durationIndex = 0
        await vault.newDeposit(amount, durationIndex)

        // we don't wait

        // expect withdrawal to fail because we haven't waited 90 days before withdrawing
        let id = (await vault.depositId()).sub(1)
        // get locked until timestamp
        const lockedUntilTimestamp = (await vault.getDeposit(id)).withdrawTimestamp
        await expect(vault.withdraw(amount, id))
            .to.be.revertedWith("Vault: locked")
    })

    it('vault: withdraw', async () => {
        // Add the smallest possible duration so that a withdrawl can be made by the test
        const duration = 1
        const weight = 100
        await vault.addDuration(duration, weight)

        // make a deposit
        let amount = expandTo18Decimals(100)
        let durationIndex = (await vault.getDurations()).length - 1     // use the most recently created duration
        await vault.newDeposit(amount, durationIndex)

        // get the most recent deposit id
        let id = (await vault.depositId()).sub(1)

        // and use that to get the withdraw timestamp
        let deposit = await vault.deposits(id)
        const expectedWithdrawTimestamp = deposit.withdrawTimestamp

        // wait until that timestamp has passed
        await waitUntil(expectedWithdrawTimestamp)

        // record balance before withdrawal to confirm withdrawal
        const prevBalance = await helixToken.balanceOf(wallet0.address)

        // record pending reward which should be transferred to user during withdrawal
        const pending = await getReward(deposit.amount, deposit.weight)

        // div by 1 * 10 ^ 18 to handle rounding errors
        let expectedBalance = amount.add(prevBalance).add(pending).div(expandTo18Decimals(1))

        // withdraw
        await vault.withdraw(amount, id)

        // check that funds were transferred
        let actualBalance = (await helixToken.balanceOf(wallet0.address)).div(expandTo18Decimals(1))
        // expect(actualBalance).to.eq(expectedBalance)

        // check that deposit is marked as withdrawn
        deposit = await vault.deposits(id)
        expect(deposit.withdrawn).to.be.true
    })

    it('vault: pending reward fails if called with invalid id', async () => {
        // invalid because no deposits have been made
        const invalidId = 1
        await expect(vault.pendingReward(invalidId))
            .to.be.revertedWith("Vault: no deposit made")
    })

    it('vault: pending reward fails if caller is not depositor', async () => {
        // first deposit to vault as wallet0 resulting in depositId == 1
        let amount = expandTo18Decimals(100)
        let durationIndex = 0
        await vault.newDeposit(amount, durationIndex);

        // get the most recent depositId
        let id = (await vault.depositId()).sub(1)
        await expect(vault1.pendingReward(id))
            .to.be.revertedWith("Vault: not depositor")
    })

    it('vault: pending reward fails if deposit is already withdrawn', async () => {
        // Add the smallest possible duration so that a withdrawl can be made by the test
        const duration = 1
        const weight = 100
        await vault.addDuration(duration, weight)

        // first deposit to vault as wallet0 resulting in depositId == 1
        let amount = expandTo18Decimals(100)
        let durationIndex = (await vault.getDurations()).length - 1     // use the most recently created duration
        await vault.newDeposit(amount, durationIndex);

        // get the most recent depositId
        let id = (await vault.depositId()).sub(1)

        // use that to get the withdraw timestamp
        let deposit = await vault.deposits(id)
        const withdrawTimestamp = deposit.withdrawTimestamp

        // and wait until withdrawal can be made
        await waitUntil(withdrawTimestamp)

        // make a withdrawal, marking the deposit as withdrawn
        await vault.withdraw(amount, id)

        // expect call to fail since deposit is withdrawn
        await expect(vault.pendingReward(id))
            .to.be.revertedWith("Vault: withdrawn")
    })

    it('vault: pending reward', async () => {
        // first, take the preliminary steps to make a vaild pendingRequest call

        // Add the smallest possible duration so that a withdrawl can be made by the test
        const duration = 1
        const weight = 100
        await vault.addDuration(duration, weight)

        // first deposit to vault as wallet0 resulting in depositId == 1
        let amount = expandTo18Decimals(100)
        let durationIndex = (await vault.getDurations()).length - 1     // use the most recently created duration
        await vault.newDeposit(amount, durationIndex);

        // get the most recent depositId
        let id = (await vault.depositId()).sub(1)

        // use that to get the withdraw timestamp
        let deposit = await vault.deposits(id)
        const withdrawTimestamp = deposit.withdrawTimestamp

        // and wait until withdrawal can be made
        await waitUntil(withdrawTimestamp)

        // now, calculate the expected reward
        /*
        const blockNumber = (await provider.getBlockNumber()) + 1
        let _accTokenPerShare = parseInt(await getAccTokenPerShare(blockNumber))
        const lastUpdateBlock = await vault.lastUpdateBlock()
        const lpSupply = await helixToken.balanceOf(vault.address)

        // make sure that "if" condition is entered
        expect(blockNumber).to.be.above(lastUpdateBlock)
        expect(lpSupply).to.not.eq(0)

        // inside the "if" condition
        const blocks = await vault.getBlocksDifference(lastUpdateBlock, blockNumber)
        print(`mult ${blocks}`)
        const reward = blocks * (await vault.getToMintPerBlock())
        print(`reward ${reward}`)
        const precisionFactor = await vault.PRECISION_FACTOR()
        print(`accTok before ${_accTokenPerShare}`)
        _accTokenPerShare += reward * precisionFactor / lpSupply
        print(`accTok after  ${_accTokenPerShare}`)

        // _getReward
        const weightPercent = await vault.WEIGHT_PERCENT()
        print(`weight % ${weightPercent}`)
        const getRewardResult = amount.div(expandTo18Decimals(1)).mul(weight).mul(_accTokenPerShare).div(precisionFactor).div(weightPercent)
        print(`res ${getRewardResult}`)

        const expectedReward = getRewardResult.sub(deposit.rewardDebt)

        expect(await vault.pendingReward(id)).to.eq(expectedReward)
        */

        expect(await vault.pendingReward(id)).to.be.above(0)
    })

    it('vault: claim reward fails if called with invalid id', async () => {
        // invalid because no deposits have been made
        const invalidId = 1
        await expect(vault.claimReward(invalidId))
            .to.be.revertedWith("Vault: no deposit made")
    })

    it('vault: claim reward fails if caller is not depositor', async () => {
        // first deposit to vault as wallet0 resulting in depositId == 1
        let amount = expandTo18Decimals(100)
        let durationIndex = 0
        await vault.newDeposit(amount, durationIndex);

        // get the most recent depositId
        let id = (await vault.depositId()).sub(1)
        await expect(vault1.claimReward(id))
            .to.be.revertedWith("Vault: not depositor")
    })

    it('vault: claim reward fails if deposit is already withdrawn', async () => {
        // Add the smallest possible duration so that a withdrawl can be made by the test
        const duration = 1
        const weight = 100
        await vault.addDuration(duration, weight)

        // first deposit to vault as wallet0 resulting in depositId == 1
        let amount = expandTo18Decimals(100)
        let durationIndex = (await vault.getDurations()).length - 1     // use the most recently created duration
        await vault.newDeposit(amount, durationIndex);

        // get the most recent depositId
        let id = (await vault.depositId()).sub(1)

        // use that to get the withdraw timestamp
        let deposit = await vault.deposits(id)
        const withdrawTimestamp = deposit.withdrawTimestamp

        // and wait until withdrawal can be made
        await waitUntil(withdrawTimestamp)

        // make a withdrawal, marking the deposit as withdrawn
        await vault.withdraw(amount, id)

        // expect call to fail since deposit is withdrawn
        await expect(vault.claimReward(id))
            .to.be.revertedWith('Vault: withdrawn')
    })

    it('vault: claim reward emits Reward Claimed event', async () => {
        // Add the smallest possible duration so that a withdrawl can be made by the test
        const duration = 1
        const weight = 100
        await vault.addDuration(duration, weight)

        // first deposit to vault as wallet0 resulting in depositId == 1
        let amount = expandTo18Decimals(100)
        let durationIndex = (await vault.getDurations()).length - 1     // use the most recently created duration
        await vault.newDeposit(amount, durationIndex);

        // get the most recent depositId
        let id = (await vault.depositId()).sub(1)

        // use that to get the withdraw timestamp
        let deposit = await vault.deposits(id)
        const withdrawTimestamp = deposit.withdrawTimestamp

        // and wait until withdrawal can be made
        await waitUntil(withdrawTimestamp)

        await expect(vault.claimReward(id))
            .to.emit(vault, "RewardClaimed")
    })

    it('vault: set last reward block as non-owner fails', async () => {
        await expect(vault1.setLastRewardBlock(1))
            .to.be.revertedWith("Ownable: caller is not the owner")
    })

    it('vault: set last reward block', async () => {
        const lastRewardBlock = 1
        await vault.setLastRewardBlock(lastRewardBlock)
        expect(await vault.lastRewardBlock()).to.eq(lastRewardBlock)
    })

    it('vault: set last reward block emits LastRewardBlockSet event', async () => {
        const lastRewardBlock = 1
        await expect(vault.setLastRewardBlock(lastRewardBlock))
            .to.emit(vault, "LastRewardBlockSet")
            .withArgs(lastRewardBlock)
    })

    it('vault: set treasury as non-owner fails', async () => {
        const treasury = wallet1.address
        await expect(vault1.setFeeHandler(treasury))
            .to.be.revertedWith("Ownable: caller is not the owner")
    })

    it('vault: set treasury with invalid address fails', async () => {
        const invalidTreasury = constants.AddressZero       // invalid because 0x000..00 can not receive funds
        await expect(vault.setFeeHandler(invalidTreasury))
            .to.be.revertedWith("FeeCollector: zero address")
    })

    it('vault: set treasury', async () => {
        const treasury = wallet1.address
        await feeHandler.setTreasury(treasury)
        expect(await feeHandler.treasury()).to.eq(treasury)
    });

    it('vault: set treasury emits SetTreasury event', async () => {
        const treasury = wallet1.address
        await expect(feeHandler.setTreasury(treasury))
            .to.emit(feeHandler, "SetTreasury")
            .withArgs(wallet0.address, treasury)
    })

    it('vault: set fee as non-owner fails', async () => {
        const fee = 0
        await expect(vault1.setCollectorPercentAndDecimals(fee, 0))
            .to.be.revertedWith("CallerIsNotTimelockOwner")
    })

    it('vault: set fee with invalid percent fails', async () => {
        const invalidFee = 101      // invalid because max percent == 100
        await expect(vault.setCollectorPercentAndDecimals(invalidFee, 0))
            .to.be.revertedWith("FeeCollector: percent exceeds max")
    })

    it('vault: set fee', async () => {
        const fee = 50
        await vault.setCollectorPercentAndDecimals(fee, 0)
        expect(await vault.collectorPercent()).to.eq(fee)
    });

    it('vault: set fee emits SetFee event', async () => {
        const fee = 50
        await expect(vault.setCollectorPercentAndDecimals(fee, 0))
            .to.emit(vault, "SetCollectorPercentAndDecimals")
            .withArgs(wallet0.address, fee, 0)
    })

    async function getAccTokenPerShare(blockNumber) {
        const blocks = await vault.getBlocksDifference(await vault.lastUpdateBlock(), blockNumber)
        const _rewardPerBlock = await vault.getToMintPerBlock() // preface with _ avoid name conflict with global rewardPerBlock
        const reward = blocks.mul(_rewardPerBlock)

        const accTokenPerShare = await vault.accTokenPerShare()
        const precisionFactor = await vault.PRECISION_FACTOR()
        const balance = await helixToken.balanceOf(vault.address)

        return accTokenPerShare.add(reward).mul(precisionFactor).div(balance)
    }

    function print(str) {
        if (verbose) console.log(str)
    }

    // return the current timestamp
    async function now() {
        const blockNumber = await ethers.provider.getBlockNumber()
        const block = await ethers.provider.getBlock(blockNumber)
        const timestamp = block.timestamp
        return timestamp
    }

    // used to wait until withdraw can be called
    // perform dummy writes to the contract until the desired timestamp is reached
    async function waitUntil(timestamp) {
        // add a new duration
        const duration = 1
        const weight = 1000
        await vault.addDuration(duration, weight)

        // get the index of the newly added duration
        let index = (await vault.getDurations()).length - 1

        // wait until timestamp is passed
        while (await now() <= timestamp) {
            await vault.setDuration(index, duration, weight)
        }

        // remove the added duration, resetting the state
        await vault.removeDuration(index)
    }

    async function getReward(amount, weight) {
        const accTokenPerShare = await vault.accTokenPerShare()
        const precisionFactor = await vault.PRECISION_FACTOR()
        const weightPercent = 100
        return amount.mul(weight).mul(accTokenPerShare).div(precisionFactor).div(weightPercent)
    }
})
