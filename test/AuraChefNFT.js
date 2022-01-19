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
const REWARD_PER_BLOCK = 1;

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

        //Create RewardToken which named 'RWT' as symbol
        this.rwt1 = await BEP20.new('RewardToken', 'RWT1', { from: deployer });
        assert.equal((await this.rwt1.preMineSupply()).toString(), '10000000000000000000000000');

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
            assert.equal((await this.auraChefNFT.getUserAuraPointAmount(alice)).toString(), (new BN(INITIAL_AURAPOINTS * 2)).toString());
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
            await time.advanceBlockTo('49');
            await this.auraChefNFT.stake([1], { from: alice });//block.number is 50 at this tx
            
            let res;
            await time.advanceBlockTo('100');
            res = await this.auraChefNFT.pendingReward(alice)
            assert.equal((res[0]).toString(), this.rwt1.address);//check reward token address
            assert.equal((res[1]).toString(), '50');

            await time.advanceBlockTo('200');
            res = await this.auraChefNFT.pendingReward(alice)
            assert.equal((res[1]).toString(), '150');
        });
        
    });
});
