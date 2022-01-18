const { ZERO_ADDRESS } = require('@openzeppelin/test-helpers/src/constants');
var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised).should();


const BASE_URI_TEST = 'https://niftyroyale.mypinata.cloud/ipfs/QmQRi3cigw8rjVP5BWAQxxBWQyMjXKfy8W4LZieMKtHbzK'

const AuraNFT = artifacts.require('AuraNFT');
const AuraChefNFT = artifacts.require('AuraChefNFT');

contract('AuraChefNFT', ([AuraNFTMinter, alice, carol, dev, refFeeAddr, safuAddr, deployer]) => {

    beforeEach(async () => {
        //AuraNFT's constructor(string memory baseURI, uint initialAuraPoints, uint8 levelUpPercent)
        this.auraNFT = await AuraNFT.new(BASE_URI_TEST, 5, 10, { from: deployer });

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
    });

    describe("When token is deployed", async () => {
        it('Check owner, minter, staker', async () => {
            assert.equal((await this.auraNFT.owner()).toString(), deployer.toString());
            assert.equal(await this.auraNFT.isMinter(AuraNFTMinter), true);
            assert.equal(await this.auraNFT.isStaker(this.auraChefNFT.address), true);
        });
    });
});
