// const { ZERO_ADDRESS } = require('@openzeppelin/test-helpers/src/constants');
// const { expectRevert, time, BN } = require('@openzeppelin/test-helpers');
// var chai = require('chai');
// var assert = chai.assert;
// var expect = chai.expect;
// var chaiAsPromised = require('chai-as-promised');
// chai.use(chaiAsPromised).should();

// const BASE_URI_TEST = 'https://niftyroyale.mypinata.cloud/ipfs/QmQRi3cigw8rjVP5BWAQxxBWQyMjXKfy8W4LZieMKtHbzK'
// const INITIAL_AURAPOINTS = 5;
// const LEVELUPPERCENT = 10;
// const REWARD_PER_BLOCK = 3;

// const BEP20 = artifacts.require('BEP20');
// const AuraNFT = artifacts.require('AuraNFT');
// const AuraChefNFT = artifacts.require('AuraChefNFT');

// contract('AuraNFT', ([AuraNFTMinter, AuraNFTAccruer, alice, carol, deployer]) => {

//     beforeEach(async () => {
//         //AuraNFT's constructor(string memory baseURI, uint initialAuraPoints, uint8 levelUpPercent)
//         this.auraNFT = await AuraNFT.new(BASE_URI_TEST, INITIAL_AURAPOINTS, LEVELUPPERCENT, { from: deployer });

//         //AuraChefNFT's constructor(IAuraNFT _auraNFT, uint _lastRewardBlock)
//         this.auraChefNFT = await AuraChefNFT.new(this.auraNFT.address, 0, { from: deployer });

//         //Set `AuraChefNFT` contract as staker of AuraNFT
//         let stat = (await this.auraNFT.addStaker(this.auraChefNFT.address, {from: deployer})).receipt.status;
//         assert.equal(stat, true);
//         //Add `AuraNFTMinter` as minter of AuraNFT
//         stat = (await this.auraNFT.addMinter(AuraNFTMinter, {from: deployer})).receipt.status;
//         assert.equal(stat, true);
//         //Add `AuraNFTAccruer` as accruer of AuraNFT
//         stat = (await this.auraNFT.addAccruer(AuraNFTAccruer, {from: deployer})).receipt.status;
//         assert.equal(stat, true);

//         //mint AuraNFT to `alice` by `AuraNFTMinter`
//         await this.auraNFT.mint(alice, { from: AuraNFTMinter });// created tokenId will be 1.
//         assert.equal((await this.auraNFT.ownerOf(1)).toString(), alice.toString());
//         await this.auraNFT.mint(alice, { from: AuraNFTMinter });// created tokenId will be 2.
//         assert.equal((await this.auraNFT.ownerOf(2)).toString(), alice.toString());

//         //Create RewardToken which named 'RWT' as symbol
//         this.rwt1 = await BEP20.new('RewardToken', 'RWT1', { from: deployer });
//         assert.equal((await this.rwt1.preMineSupply()).toString(), '10000000000000000000000000');
//         await this.rwt1.transfer(this.auraChefNFT.address, 1000000, {from: deployer})

//         //Add RewardToken
//         //addNewRewardToken(address newToken, uint startBlock, uint rewardPerBlock)
//         await this.auraChefNFT.addNewRewardToken(this.rwt1.address, 0, REWARD_PER_BLOCK, { from: deployer });
//         let listRewardTokens = await this.auraChefNFT.getListRewardTokens();
//         assert.equal(listRewardTokens[0].toString(), this.rwt1.address.toString());
//     });

//     describe("When token is deployed", async () => {
//         it('Check owner, minter, staker, accruer', async () => {
//             assert.equal((await this.auraNFT.owner()).toString(), deployer.toString());
//             assert.equal(await this.auraNFT.isMinter(AuraNFTMinter), true);
//             assert.equal(await this.auraNFT.isStaker(this.auraChefNFT.address), true);
//             assert.equal(await this.auraNFT.isAccruer(AuraNFTAccruer), true);
//         });
//     });

//     describe("Accrue AuraPoints", async () => {
//         it('accumulated amount when call accruePoints by accruer', async () => {
//             await this.auraNFT.accruePoints(alice, 100, { from: AuraNFTAccruer });
//             assert.equal((await this.auraNFT.getAccumulatedAP(alice)).toString(), '100');
//         });
//     });

//     describe("Boost NFT with AuraPoints", async () => {
//         it('remove auraPoints from accumulated balance once boost NFT', async () => {
//             await this.auraNFT.accruePoints(alice, 1000, { from: AuraNFTAccruer });
//             await this.auraChefNFT.boostAuraNFT(1, 500, { from: alice });
//             assert.equal((await this.auraNFT.getAccumulatedAP(alice)).toString(), '500');
//         });
//         it('Once boost NFT which staked, check reward received for previous pending', async () => {
//             await this.auraNFT.accruePoints(alice, 100, { from: AuraNFTAccruer });
//             await this.auraChefNFT.stake([1], { from: alice });// block.number is increased
//             let startBlockNumber = parseInt((await time.latestBlock()).toString());
            
//             let res;
//             await time.advanceBlockTo(startBlockNumber + 20);
//             res = await this.auraChefNFT.pendingReward(alice)
//             assert.equal((res[0]).toString(), this.rwt1.address);
//             assert.equal((res[1]).toString(), (REWARD_PER_BLOCK * 20).toString());

//             let tokenId = 1;
//             await this.auraChefNFT.boostAuraNFT(tokenId, 70, { from: alice });

//             assert.equal((await this.rwt1.balanceOf(alice)).toString(), (REWARD_PER_BLOCK * (20 + 1)).toString());
//             assert.equal((await this.auraNFT.getAccumulatedAP(alice)).toString(), '30');
//             assert.equal((await this.auraNFT.getAuraPoints(tokenId)).toString(), '75');
//         });
        
//     });
// });
