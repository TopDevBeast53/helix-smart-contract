const { expectRevert, time } = require('@openzeppelin/test-helpers');
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
            let p = await this.voting.proposalsByIndex(0);
            assert.equal(p.endTimestamp.toString(), (nowTimestamp+100).toString());
            assert.equal(p.creator.toString(), alice.toString());
            assert.equal(utils.parseBytes32String(p.name), "proposal_0");
        });
        it('`alice` and `bob` each create one proposal', async () => {
            let nowTimestamp = parseInt((await time.latest()).toString());
            
            await this.voting.createProposal(utils.formatBytes32String("proposal_0"), nowTimestamp+100, {from: alice});
            await this.voting.createProposal(utils.formatBytes32String("proposal_1"), nowTimestamp+200, {from: bob});
            assert.equal((await this.voting.proposalsByIndex(0)).creator.toString(), alice.toString());
            assert.equal((await this.voting.proposalsByIndex(1)).creator.toString(), bob.toString());
        });
    });
    describe("Voting", async () => {
        it('vote on a proposal by `alice`', async () => {
            let nowTimestamp = parseInt((await time.latest()).toString());
            await this.voting.createProposal(utils.formatBytes32String("proposal_0"), nowTimestamp+100, {from: alice});
            
            //Wrong decision value
            await expectRevert.unspecified(this.voting.vote(0, expandTo18Decimals(500), 0, {from: alice}));
            
            await this.auraToken.approve(this.voting.address, expandTo18Decimals(500), { from: alice });
            //vote with `YES`
            await this.voting.vote(0, expandTo18Decimals(500), 1, {from: alice});
            //check the left balance of alice once voted with deposit AuraToken
            assert.equal((await this.auraToken.balanceOf(alice)).toString(), expandTo18Decimals(500).toString());
            assert.equal((await this.voting.getDecision(0, alice)).toString(), "1");

            //Avoid voting twice for one proposal
            await expectRevert.unspecified(this.voting.vote(0, expandTo18Decimals(200), 1, {from: alice}));
        });
        it('result proposal', async () => {
            let nowTimestamp = parseInt((await time.latest()).toString());
            await this.voting.createProposal(utils.formatBytes32String("proposal_0"), nowTimestamp+100, {from: alice});
            
            //alice votes 'YES' with 800 tokens
            await this.auraToken.approve(this.voting.address, expandTo18Decimals(800), { from: alice });
            await this.voting.vote(0, expandTo18Decimals(800), 1, {from: alice});
            //bob votes 'YES' with 500 tokens
            await this.auraToken.approve(this.voting.address, expandTo18Decimals(500), { from: bob });
            await this.voting.vote(0, expandTo18Decimals(500), 1, {from: bob});
            //carol votes 'NO' with 900 tokens
            await this.auraToken.approve(this.voting.address, expandTo18Decimals(900), { from: carol });
            await this.voting.vote(0, expandTo18Decimals(900), 2, {from: carol});
            
            let ret = await this.voting.resultProposal(0);
            assert.equal(ret[0].toString(), expandTo18Decimals(1300).toString());//YES votes
            assert.equal(ret[1].toString(), expandTo18Decimals(900).toString());//NO votes
        });
    });
    describe("Withdrawal by holder", async () => {
        it('if an user withdraw before end of voting, number of votes will be changed', async () => {
            let nowTimestamp = parseInt((await time.latest()).toString());
            await this.voting.createProposal(utils.formatBytes32String("proposal_0"), nowTimestamp+100, {from: alice});
            
            await this.auraToken.approve(this.voting.address, expandTo18Decimals(500), { from: alice });
            await this.voting.vote(0, expandTo18Decimals(500), 1, {from: alice});//vote with YES
            assert.equal((await this.auraToken.balanceOf(this.voting.address)).toString(), expandTo18Decimals(500).toString());

            let ret = await this.voting.resultProposal(0);
            assert.equal(ret[0].toString(), expandTo18Decimals(500).toString());//YES votes

            await this.voting.withdraw(0, expandTo18Decimals(400), {from: alice})
            ret = await this.voting.resultProposal(0);
            assert.equal(ret[0].toString(), expandTo18Decimals(100).toString());//YES votes changed

            //Avoid withdraw extra amount
            await expectRevert.unspecified(this.voting.withdraw(0, expandTo18Decimals(400), {from: alice}));
        });
        it('if an user withdraw after end of voting, number of votes will be not changed', async () => {
            let nowTimestamp = parseInt((await time.latest()).toString());
            await this.voting.createProposal(utils.formatBytes32String("proposal_0"), nowTimestamp+3, {from: alice});
            
            await this.auraToken.approve(this.voting.address, expandTo18Decimals(500), { from: alice });
            await this.voting.vote(0, expandTo18Decimals(500), 1, {from: alice});//vote with YES
            assert.equal((await this.auraToken.balanceOf(this.voting.address)).toString(), expandTo18Decimals(500).toString());

            let ret = await this.voting.resultProposal(0);
            assert.equal(ret[0].toString(), expandTo18Decimals(500).toString());//YES votes
            //Time is overed to endTimestamp
            await time.increaseTo(nowTimestamp+4);
            await this.voting.withdraw(0, expandTo18Decimals(400), {from: alice})
            ret = await this.voting.resultProposal(0);
            assert.equal(ret[0].toString(), expandTo18Decimals(500).toString());//YES votes not changed
        });
    });
    describe("Delegate from AuraToken", async () => {
        it('check number of votes added prior votes after delegate', async () => {
            // delegate to self, current votes will be 1000
            await this.auraToken.delegate(alice, { from: alice });
            assert.equal(await this.auraToken.delegates(alice), alice);

            // move 20 blocks from current block
            let blockNumAfterDelegate = parseInt((await time.latestBlock()).toString());
            await time.advanceBlockTo(blockNumAfterDelegate + 20);

            // create proposal, its blocknum will be `blockNumAfterDelegate + 20`
            let nowTimestamp = parseInt((await time.latest()).toString());
            await this.voting.createProposal(utils.formatBytes32String("proposal_0"), nowTimestamp+100, {from: alice});

            // vote with `YES`
            const depositAmount = 500;
            await this.auraToken.approve(this.voting.address, expandTo18Decimals(depositAmount), { from: alice });
            await this.voting.vote(0, expandTo18Decimals(depositAmount), 1, {from: alice});

            // check result
            let ret = await this.voting.resultProposal(0);
            assert.equal(ret[0].toString(), expandTo18Decimals(1000+depositAmount).toString());
        });
    });
});
