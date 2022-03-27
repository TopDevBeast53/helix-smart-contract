// const { ZERO_ADDRESS } = require('@openzeppelin/test-helpers/src/constants');
// const { expectRevert, time, BN } = require('@openzeppelin/test-helpers');
// var chai = require('chai');
// var assert = chai.assert;
// var expect = chai.expect;
// var chaiAsPromised = require('chai-as-promised');
// chai.use(chaiAsPromised).should();

// const BASE_URI_TEST = 'https://niftyroyale.mypinata.cloud/ipfs/QmQRi3cigw8rjVP5BWAQxxBWQyMjXKfy8W4LZieMKtHbzK'
// const INITIAL_HELIXPOINTS = 5;
// const LEVELUPPERCENT = 10;
// const REWARD_PER_BLOCK = 3;

// const BEP20 = artifacts.require('BEP20');
// const HelixNFT = artifacts.require('HelixNFT');
// const HelixChefNFT = artifacts.require('HelixChefNFT');

// contract('HelixChefNFT', ([HelixNFTMinter, alice, carol, dev, refFeeAddr, safuAddr, deployer]) => {

//     beforeEach(async () => {
//         //HelixNFT's constructor(string memory baseURI, uint initialHelixPoints, uint8 levelUpPercent)
//         this.helixNFT = await HelixNFT.new(BASE_URI_TEST, INITIAL_HELIXPOINTS, LEVELUPPERCENT, { from: deployer });

//         //HelixChefNFT's constructor(IHelixNFT _helixNFT, uint _lastRewardBlock)
//         this.helixChefNFT = await HelixChefNFT.new(this.helixNFT.address, 0, { from: deployer });

//         //Set `HelixChefNFT` contract as staker of HelixNFT
//         let stat = (await this.helixNFT.addStaker(this.helixChefNFT.address, {from: deployer})).receipt.status;
//         assert.equal(stat, true);

//         //Add `HelixNFTMinter` as minter of HelixNFT
//         const { receipt: { status } } = await this.helixNFT.addMinter(HelixNFTMinter, {from: deployer});
//         assert.equal(status, true);

//         //mint HelixNFT to `alice` by `HelixNFTMinter`
//         await this.helixNFT.mint(alice, { from: HelixNFTMinter });// created tokenId will be 1.
//         assert.equal((await this.helixNFT.ownerOf(1)).toString(), alice.toString());
//         await this.helixNFT.mint(alice, { from: HelixNFTMinter });// created tokenId will be 2.
//         assert.equal((await this.helixNFT.ownerOf(2)).toString(), alice.toString());

//         //mint HelixNFT to `alice` by `HelixNFTMinter`
//         await this.helixNFT.mint(carol, { from: HelixNFTMinter });// created tokenId will be 3.
//         assert.equal((await this.helixNFT.ownerOf(3)).toString(), carol.toString());
//         await this.helixNFT.mint(carol, { from: HelixNFTMinter });// created tokenId will be 4.
//         assert.equal((await this.helixNFT.ownerOf(4)).toString(), carol.toString());

//         //Create RewardToken which named 'RWT' as symbol
//         this.rwt1 = await BEP20.new('RewardToken', 'RWT1', { from: deployer });
//         assert.equal((await this.rwt1.preMineSupply()).toString(), '10000000000000000000000000');
//         await this.rwt1.transfer(this.helixChefNFT.address, 1000000, {from: deployer})

//         //Add RewardToken
//         //addNewRewardToken(address newToken, uint startBlock, uint rewardPerBlock)
//         await this.helixChefNFT.addNewRewardToken(this.rwt1.address, 0, REWARD_PER_BLOCK, { from: deployer });
//         let listRewardTokens = await this.helixChefNFT.getListRewardTokens();
//         assert.equal(listRewardTokens[0].toString(), this.rwt1.address.toString());
//     });

//     describe("When token is deployed", async () => {
//         it('Check owner, minter, staker', async () => {
//             assert.equal((await this.helixNFT.owner()).toString(), deployer.toString());
//             assert.equal(await this.helixNFT.isMinter(HelixNFTMinter), true);
//             assert.equal(await this.helixNFT.isStaker(this.helixChefNFT.address), true);
//         });
//     });

//     describe("Initialize of Staking", async () => {
//         it('When an user stakes, should be added him/her to map of `users', async () => {
//             await this.helixChefNFT.stake([1, 2], { from: alice });
//             assert.equal((await this.helixChefNFT.getUserStakedTokens(alice)).length, 2);
//         });
//         it('When an user stakes, the helixPointAmount of user should have a default amount', async () => {
//             await this.helixChefNFT.stake([1, 2], { from: alice });
//             assert.equal((await this.helixChefNFT.getUserHelixPointAmount(alice)).toString(), (INITIAL_HELIXPOINTS * 2).toString());
//         });
//         it('Check token Owner', async () => {
//             await expectRevert.unspecified(this.helixChefNFT.stake([1, 2], { from: carol }));//Not token owner
//         });
//         it('Double staking of an HelixNFT is not acceptable', async () => {
//             await this.helixChefNFT.stake([1], { from: alice });
//             await expectRevert.unspecified(this.helixChefNFT.stake([1], { from: alice }));//Token has already been staked
//         });
//     });

//     describe("Calculation reward of Staking", async () => {
//         it('Calc pending reward when one person staked', async () => {
//             let startBlockNumber = parseInt((await time.latestBlock()).toString());
//             await this.helixChefNFT.stake([1], { from: alice });// block.number is increased
            
//             let res;
//             await time.advanceBlockTo(startBlockNumber + 21);
//             res = await this.helixChefNFT.pendingReward(alice)// eventually, passed 20 from start
//             assert.equal((res[0]).toString(), this.rwt1.address);// check reward token address
//             assert.equal((res[1]).toString(), (REWARD_PER_BLOCK * 20).toString());

//             await time.advanceBlockTo(startBlockNumber + 31);
//             res = await this.helixChefNFT.pendingReward(alice)// eventually, passed 30 from start
//             assert.equal((res[1]).toString(), (REWARD_PER_BLOCK * 30).toString());

//             await this.helixChefNFT.withdrawRewardToken({ from: alice })// block.number is increased
//             assert.equal((await this.rwt1.balanceOf(alice)).toString(), (REWARD_PER_BLOCK * (30 + 1)).toString());

//             startBlockNumber = parseInt((await time.latestBlock()).toString());
//             await this.helixChefNFT.stake([2], { from: alice });
//             assert.equal((await this.rwt1.balanceOf(alice)).toString(), (REWARD_PER_BLOCK * (30 + 1 + 1)).toString());//because withdrawal before stake newly
            
//             await time.advanceBlockTo(startBlockNumber + 11);
//             assert.equal(((await this.helixChefNFT.pendingReward(alice))[1]).toString(), (REWARD_PER_BLOCK * 10).toString());
//             assert.equal((await this.helixChefNFT.getUserHelixPointAmount(alice)).toString(), (INITIAL_HELIXPOINTS * 2).toString());
//         });
        
//         it('Calc withdrawReward when 2 persons staked', async () => {
//             let res, _blockNumber;
//             await this.helixChefNFT.stake([1, 2], { from: alice });
//             await this.helixChefNFT.stake([3], { from: carol });

//             _blockNumber = parseInt((await time.latestBlock()).toString());
//             await time.advanceBlockTo(_blockNumber + 10);
            
//             await this.helixChefNFT.withdrawRewardToken({ from: alice })
//             assert.equal((await this.rwt1.balanceOf(alice)).toString(), '25');

//             await this.helixChefNFT.withdrawRewardToken({ from: carol })
//             assert.equal((await this.rwt1.balanceOf(carol)).toString(), '12');
//         });
        
//     });
// });
