const { ZERO_ADDRESS } = require('@openzeppelin/test-helpers/src/constants');
const { expectRevert, time, BN } = require('@openzeppelin/test-helpers');
var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised).should();

const BASE_URI_TEST = 'https://niftyroyale.mypinata.cloud/ipfs/QmQRi3cigw8rjVP5BWAQxxBWQyMjXKfy8W4LZieMKtHbzK'
const INITIAL_AURAPOINTS = 5;
const LEVELUPPERCENT = 10;
const REWARD_PER_BLOCK = 3;

const BEP20 = artifacts.require('BEP20');
const AuraNFT = artifacts.require('AuraNFT');
const AuraChefNFT = artifacts.require('AuraChefNFT');

contract('AuraChefNFT', ([AuraNFTMinter, alice, carol, dev, refFeeAddr, safuAddr, deployer]) => {

    beforeEach(async () => {
        //AuraNFT's constructor(string memory baseURI, uint initialAuraPoints, uint8 levelUpPercent)
        this.auraNFT = await AuraNFT.new(BASE_URI_TEST, INITIAL_AURAPOINTS, LEVELUPPERCENT, { from: deployer });

        //AuraChefNFT's constructor(IAuraNFT _auraNFT, uint _lastRewardBlock)
        this.auraChefNFT = await AuraChefNFT.new(this.auraNFT.address, 0, { from: deployer });

        //Set `AuraChefNFT` contract as staker of AuraNFT
        let stat = (await this.auraNFT.addStaker(this.auraChefNFT.address, {from: deployer})).receipt.status;
        assert.equal(stat, true);

        //Add `AuraNFTMinter` as minter of AuraNFT
        const { receipt: { status } } = await this.auraNFT.addMinter(AuraNFTMinter, {from: deployer});
        assert.equal(status, true);

        //mint AuraNFT to `alice` by `AuraNFTMinter`
        await this.auraNFT.mint(alice, { from: AuraNFTMinter });// created tokenId will be 1.
        assert.equal((await this.auraNFT.ownerOf(1)).toString(), alice.toString());
        await this.auraNFT.mint(alice, { from: AuraNFTMinter });// created tokenId will be 2.
        assert.equal((await this.auraNFT.ownerOf(2)).toString(), alice.toString());

        //mint AuraNFT to `alice` by `AuraNFTMinter`
        await this.auraNFT.mint(carol, { from: AuraNFTMinter });// created tokenId will be 3.
        assert.equal((await this.auraNFT.ownerOf(3)).toString(), carol.toString());
        await this.auraNFT.mint(carol, { from: AuraNFTMinter });// created tokenId will be 4.
        assert.equal((await this.auraNFT.ownerOf(4)).toString(), carol.toString());

        //Create RewardToken which named 'RWT' as symbol
        this.rwt1 = await BEP20.new('RewardToken', 'RWT1', { from: deployer });
        assert.equal((await this.rwt1.preMineSupply()).toString(), '10000000000000000000000000');
        await this.rwt1.transfer(this.auraChefNFT.address, 1000000, {from: deployer})

        //Add RewardToken
        //addNewRewardToken(address newToken, uint startBlock, uint rewardPerBlock)
        await this.auraChefNFT.addNewRewardToken(this.rwt1.address, 0, REWARD_PER_BLOCK, { from: deployer });
        let listRewardTokens = await this.auraChefNFT.getListRewardTokens();
        assert.equal(listRewardTokens[0].toString(), this.rwt1.address.toString());
    });

    describe("When token is deployed", async () => {
        it('Check owner, minter, staker', async () => {
            assert.equal((await this.auraNFT.owner()).toString(), deployer.toString());
            assert.equal(await this.auraNFT.isMinter(AuraNFTMinter), true);
            assert.equal(await this.auraNFT.isStaker(this.auraChefNFT.address), true);
        });
    });

    describe("Initialize of Staking", async () => {
        it('When an user stakes, should be added him/her to map of `users', async () => {
            await this.auraChefNFT.stake([1, 2], { from: alice });
            assert.equal((await this.auraChefNFT.getUserStakedTokens(alice)).length, 2);
        });
        it('When an user stakes, the auraPointAmount of user should have a default amount', async () => {
            await this.auraChefNFT.stake([1, 2], { from: alice });
            assert.equal((await this.auraChefNFT.getUserAuraPointAmount(alice)).toString(), (INITIAL_AURAPOINTS * 2).toString());
        });
        it('Check token Owner', async () => {
            await expectRevert.unspecified(this.auraChefNFT.stake([1, 2], { from: carol }));//Not token owner
        });
        it('Double staking of an AuraNFT is not acceptable', async () => {
            await this.auraChefNFT.stake([1], { from: alice });
            await expectRevert.unspecified(this.auraChefNFT.stake([1], { from: alice }));//Token has already been staked
        });
    });

    describe("Calculation reward of Staking", async () => {
        it('Calc pending reward when one person staked', async () => {
            let startBlockNumber = parseInt((await time.latestBlock()).toString());
            await this.auraChefNFT.stake([1], { from: alice });// block.number is increased
            
            let res;
            await time.advanceBlockTo(startBlockNumber + 21);
            res = await this.auraChefNFT.pendingReward(alice)// eventually, passed 20 from start
            assert.equal((res[0]).toString(), this.rwt1.address);// check reward token address
            assert.equal((res[1]).toString(), (REWARD_PER_BLOCK * 20).toString());

            await time.advanceBlockTo(startBlockNumber + 31);
            res = await this.auraChefNFT.pendingReward(alice)// eventually, passed 30 from start
            assert.equal((res[1]).toString(), (REWARD_PER_BLOCK * 30).toString());

            await this.auraChefNFT.withdrawRewardToken({ from: alice })// block.number is increased
            assert.equal((await this.rwt1.balanceOf(alice)).toString(), (REWARD_PER_BLOCK * (30 + 1)).toString());

            startBlockNumber = parseInt((await time.latestBlock()).toString());
            await this.auraChefNFT.stake([2], { from: alice });
            assert.equal((await this.rwt1.balanceOf(alice)).toString(), (REWARD_PER_BLOCK * (30 + 1 + 1)).toString());//because withdrawal before stake newly
            
            await time.advanceBlockTo(startBlockNumber + 11);
            assert.equal(((await this.auraChefNFT.pendingReward(alice))[1]).toString(), (REWARD_PER_BLOCK * 10).toString());
            assert.equal((await this.auraChefNFT.getUserAuraPointAmount(alice)).toString(), (INITIAL_AURAPOINTS * 2).toString());
        });
        
        it('Calc withdrawReward when 2 persons staked', async () => {
            let res, _blockNumber;
            await this.auraChefNFT.stake([1, 2], { from: alice });
            await this.auraChefNFT.stake([3], { from: carol });

            _blockNumber = parseInt((await time.latestBlock()).toString());
            await time.advanceBlockTo(_blockNumber + 10);
            
            await this.auraChefNFT.withdrawRewardToken({ from: alice })
            assert.equal((await this.rwt1.balanceOf(alice)).toString(), '25');

            await this.auraChefNFT.withdrawRewardToken({ from: carol })
            assert.equal((await this.rwt1.balanceOf(carol)).toString(), '12');
        });
        
    });
});
