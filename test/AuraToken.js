const { ZERO_ADDRESS } = require('@openzeppelin/test-helpers/src/constants');
var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised).should();


const AuraToken = artifacts.require('AuraToken');

contract('AuraToken', ([alice, bob, carol, dev, refFeeAddr, safuAddr, minter]) => {

    beforeEach(async () => {
        //deploy token contract
        this.gxo = await AuraToken.new({ from: minter });
        assert.equal((await this.gxo.maxSupply()).toString(), "700000000000000000000000000");
        assert.equal((await this.gxo.preMineSupply()).toString(), "10000000000000000000000000");
        assert.equal((await this.gxo.decimals()).toString(), "18");
    });

    describe("When token is deployed", async () => {
        it('Owner should be minter', async () => {
            assert.equal((await this.gxo.getOwner()).toString(), minter.toString());
        });

        it('Minter should have all premined supply', async () => {
            assert.equal((await this.gxo.balanceOf(minter)).toString(), "10000000000000000000000000");
        });

        it('Token should have a name and symbol', async () => {
            // When deployed
            // Token should have symbol
            assert.equal(await this.gxo.name(), "Aura");
            // Token should have symbol
            assert.equal(await this.gxo.symbol(), 'AURA');
        });
    });

    describe("When addMinter is called", async () => {

        it('Owner should be able to add minter', async () => {
            const { receipt: { status } } = await this.gxo.addMinter(alice, { from: minter });
            assert.equal(status, true);
        });

        it('Minter should not be able to add minter', async () => {
            await this.gxo.addMinter(alice, { from: minter });
            return this.gxo.addMinter(bob, { from: alice }).should.eventually.be.rejected;
        });
    });

    describe("When delMinter is called", async () => {
        beforeEach("add two minters", async () => {
            await this.gxo.addMinter(minter, { from: minter });
            await this.gxo.addMinter(alice, { from: minter });
        });
        it('Owner should be able to delete minter', async () => {
            const { receipt: { status } } = await this.gxo.delMinter(minter, { from: minter });
            assert.equal(status, true);
        });
        it('Minter should not be able to delete minter', () => {
            return this.gxo.delMinter(alice, { from: alice }).should.eventually.be.rejected;
        });
    });
    describe("When getMinterLength is called", async () => {
        beforeEach("add two minters", async () => {
            await this.gxo.addMinter(minter, { from: minter });
            await this.gxo.addMinter(alice, { from: minter });
        });

        it('should return 2', async () => {
            assert.equal((await this.gxo.getMinterLength()).toString(), "2");
        });
    });

    describe("When isMinter is called", async () => {
        beforeEach("adding minter address as minter", async () => {
            await this.gxo.addMinter(minter, { from: minter });
        });

        it('should return true for minter address', async () => {
            assert.equal((await this.gxo.isMinter(minter)), true);
        });

        it('should return false for non-minter (alice) address', async () => {
            assert.equal((await this.gxo.isMinter(alice)), false);
        });
    });

    describe("When getMinter is called", async () => {
        beforeEach("adding minter address as minter", async () => {
            await this.gxo.addMinter(minter, { from: minter });
        });

        it('should return minters address if msg.sender is owner', async () => {
            // When getMinter is call by a address that is not owner
            expect((await this.gxo.getMinter("0", { from: minter }))).to.be.equal(minter.toString());
        });

        it('should revert if msg.sender not owner', async () => {
            // When getMinter is call by a address that is not owner
            await this.gxo.addMinter(alice, { from: minter });
            expect((await this.gxo.getMinter("1", { from: minter }))).to.be.equal(alice.toString());

            // Should revert
            return this.gxo.getMinter("0", { from: alice }).should.eventually.be.rejected;
        });
    });

    describe("When mint is called", async () => {
        beforeEach("adding minter address as minter", async () => {
            await this.gxo.addMinter(minter, { from: minter });
        });

        it('should have a minter address as permissioned minter', async () => {
            assert.equal((await this.gxo.getMinter(0, { from: minter })).toString(), minter.toString());
        });

        it('should mint when msg.sender is permissioned', async () => {
            await this.gxo.mint(alice, "10", { from: minter });
            assert.equal((await this.gxo.balanceOf(alice)).toString(), "10");
        });

        it('Should revert if msg.sender is not permissioned', async () => {
            return this.gxo.mint(bob, "5", { from: alice }).should.eventually.be.rejected;
        });

        it('cannot mint if max supply is reached', async () => {
            // when max supply is reached
            const maxSup = (await this.gxo.maxSupply()).toString();
            await this.gxo.mint(alice, "690000000000000000000000000", { from: minter });
            assert.equal((await this.gxo.totalSupply()).toString(), maxSup);

            // should not be able to mint.
            return this.gxo.mint(bob, "1", { from: minter }).should.eventually.be.rejected;
        });
    });

    describe("When transfer is called", async () => {
        beforeEach("add minter and mint tokens to alice", async () => {
            await this.gxo.addMinter(minter, { from: minter });
            await this.gxo.mint(alice, "10", { from: minter });
        });

        it('token holders should be able to transfer balance', async () => {
            await this.gxo.transfer(bob, "5", { from: alice });
            assert.equal((await this.gxo.balanceOf(bob)).toString(), "5");
            assert.equal((await this.gxo.balanceOf(alice)).toString(), "5");
        });

        it('bob should not be able to transfer tokens to alice', () => {
            // When non-holder tries to transfer token
            // Should revert 
            return this.gxo.transfer(alice, "5", { from: bob }).should.eventually.be.rejected;
        });
    });

    describe("When delegate is called", async () => {
        beforeEach("add minter and mint tokens to alice", async () => {
            await this.gxo.addMinter(minter, { from: minter });
            await this.gxo.mint(alice, "10", { from: minter });
        });

        it('alice should not have any delegatee', async () => {
            delegatee = await this.gxo.delegates(alice);
            // should not have delegatee ( address(0))             
            assert.equal(delegatee, ZERO_ADDRESS);
        });

        it('alice should only have votes after delegating to self', async () => {
            assert.equal((await this.gxo.getCurrentVotes(alice)).toString(), "0");
            await this.gxo.delegate(alice, { from: alice });
            delegatee = await this.gxo.delegates(alice);

            //alice should be delegatee & have 10 votes
            assert.equal(delegatee, alice);
            assert.equal((await this.gxo.getCurrentVotes(alice)).toString(), "10");
        });

        it('alice should have bob as delegatee', async () => {
            // When alice delegates to bob
            await this.gxo.delegate(bob, { from: alice });
            delegatee = await this.gxo.delegates(alice);

            // Bob should be delegatee
            assert.equal(delegatee, bob);
        });

        it('bob should have votes after being delagated by alice', async () => {
            // When alice delegate votes to bob
            await this.gxo.delegate(bob, { from: alice });
            const delegatee = await this.gxo.delegates(alice);
            assert.equal(delegatee, bob);

            // Should have votesequlto alice balance
            assert.equal((await this.gxo.getCurrentVotes(bob)).toString(), "10");
        });

        it('alice should not have votes after delagating to bob', async () => {
            // When alice delegates votes to bob
            await this.gxo.delegate(bob, { from: alice });
            delegatee = await this.gxo.delegates(alice);
            assert.equal(delegatee, bob);

            // alice should not have votes
            assert.equal((await this.gxo.getCurrentVotes(alice)).toString(), "0");
        });
    });
});
