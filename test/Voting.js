const { time } = require('@openzeppelin/test-helpers');
const {BigNumber, utils} = require("ethers");

var chai = require('chai');
var assert = chai.assert;
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised).should();


const AuraToken = artifacts.require('AuraToken');
const Voting = artifacts.require('Voting');

function expandTo18Decimals(n) {
    return (new BigNumber.from(n)).mul((new BigNumber.from(10)).pow(18))
}

contract('Voting', ([alice, bob, carol, deployer]) => {

    beforeEach(async () => {

        this.auraToken = await AuraToken.new({ from: deployer });
        this.voting = await Voting.new(this.auraToken.address, { from: deployer });
        assert.equal((await this.auraToken.preMineSupply()).toString(), expandTo18Decimals(10000000).toString());

        //transfer AuraToken to users
        await this.auraToken.transfer(alice, expandTo18Decimals(1000), {from: deployer})
        await this.auraToken.transfer(bob, expandTo18Decimals(1000), {from: deployer})
        await this.auraToken.transfer(carol, expandTo18Decimals(1000), {from: deployer})
        assert.equal((await this.auraToken.balanceOf(alice)).toString(), expandTo18Decimals(1000).toString());
    });

    describe("Create proposals", async () => {
        it('create a proposal by `alice`', async () => {
            let nowTimestamp = parseInt((await time.latest()).toString());
            await this.voting.createProposal(utils.formatBytes32String("proposal_0"), nowTimestamp+100, {from: alice});
            let p = await this.voting.proposals(0);
            assert.equal(p.endTimestamp.toString(), (nowTimestamp+100).toString());
            assert.equal(p.creator.toString(), alice.toString());
            assert.equal(utils.parseBytes32String(p.name), "proposal_0");
        });
        it('`alice` and `bob` each create one proposal', async () => {
            let nowTimestamp = parseInt((await time.latest()).toString());
            
            await this.voting.createProposal(utils.formatBytes32String("proposal_0"), nowTimestamp+100, {from: alice});
            await this.voting.createProposal(utils.formatBytes32String("proposal_1"), nowTimestamp+200, {from: bob});
            assert.equal((await this.voting.proposals(0)).creator.toString(), alice.toString());
            assert.equal((await this.voting.proposals(1)).creator.toString(), bob.toString());
        });
    });

});
