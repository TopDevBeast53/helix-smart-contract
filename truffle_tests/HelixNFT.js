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

// contract('HelixNFT', ([HelixNFTMinter, HelixNFTAccruer, alice, carol, deployer]) => {

//     beforeEach(async () => {
//         //HelixNFT's constructor(string memory baseURI, uint initialHelixPoints, uint8 levelUpPercent)
//         this.helixNFT = await HelixNFT.new(BASE_URI_TEST, INITIAL_HELIXPOINTS, LEVELUPPERCENT, { from: deployer });

//         //HelixChefNFT's constructor(IHelixNFT _helixNFT, uint _lastRewardBlock)
//         this.helixChefNFT = await HelixChefNFT.new(this.helixNFT.address, 0, { from: deployer });

//         //Set `HelixChefNFT` contract as staker of HelixNFT
//         let stat = (await this.helixNFT.addStaker(this.helixChefNFT.address, {from: deployer})).receipt.status;
//         assert.equal(stat, true);
//         //Add `HelixNFTMinter` as minter of HelixNFT
//         stat = (await this.helixNFT.addMinter(HelixNFTMinter, {from: deployer})).receipt.status;
//         assert.equal(stat, true);
//         //Add `HelixNFTAccruer` as accruer of HelixNFT
//         stat = (await this.helixNFT.addAccruer(HelixNFTAccruer, {from: deployer})).receipt.status;
//         assert.equal(stat, true);

//         //mint HelixNFT to `alice` by `HelixNFTMinter`
//         await this.helixNFT.mint(alice, { from: HelixNFTMinter });// created tokenId will be 1.
//         assert.equal((await this.helixNFT.ownerOf(1)).toString(), alice.toString());
//         await this.helixNFT.mint(alice, { from: HelixNFTMinter });// created tokenId will be 2.
//         assert.equal((await this.helixNFT.ownerOf(2)).toString(), alice.toString());

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
//         it('Check owner, minter, staker, accruer', async () => {
//             assert.equal((await this.helixNFT.owner()).toString(), deployer.toString());
//             assert.equal(await this.helixNFT.isMinter(HelixNFTMinter), true);
//             assert.equal(await this.helixNFT.isStaker(this.helixChefNFT.address), true);
//             assert.equal(await this.helixNFT.isAccruer(HelixNFTAccruer), true);
//         });
//     });

//     describe("Accrue HelixPoints", async () => {
//         it('accumulated amount when call accruePoints by accruer', async () => {
//             await this.helixNFT.accruePoints(alice, 100, { from: HelixNFTAccruer });
//             assert.equal((await this.helixNFT.getAccumulatedHP(alice)).toString(), '100');
//         });
//     });

//     describe("Boost NFT with HelixPoints", async () => {
//         it('remove helixPoints from accumulated balance once boost NFT', async () => {
//             await this.helixNFT.accruePoints(alice, 1000, { from: HelixNFTAccruer });
//             await this.helixChefNFT.boostHelixNFT(1, 500, { from: alice });
//             assert.equal((await this.helixNFT.getAccumulatedHP(alice)).toString(), '500');
//         });
//         it('Once boost NFT which staked, check reward received for previous pending', async () => {
//             await this.helixNFT.accruePoints(alice, 100, { from: HelixNFTAccruer });
//             await this.helixChefNFT.stake([1], { from: alice });// block.number is increased
//             let startBlockNumber = parseInt((await time.latestBlock()).toString());
            
//             let res;
//             await time.advanceBlockTo(startBlockNumber + 20);
//             res = await this.helixChefNFT.pendingReward(alice)
//             assert.equal((res[0]).toString(), this.rwt1.address);
//             assert.equal((res[1]).toString(), (REWARD_PER_BLOCK * 20).toString());

//             let tokenId = 1;
//             await this.helixChefNFT.boostHelixNFT(tokenId, 70, { from: alice });

//             assert.equal((await this.rwt1.balanceOf(alice)).toString(), (REWARD_PER_BLOCK * (20 + 1)).toString());
//             assert.equal((await this.helixNFT.getAccumulatedHP(alice)).toString(), '30');
//             assert.equal((await this.helixNFT.getHelixPoints(tokenId)).toString(), '75');
//         });
        
//     });
// });
