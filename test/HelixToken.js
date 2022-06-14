const { expect } = require("chai")                                                                   
                                                                                                   
const { waffle } = require("hardhat")                                                              
const { loadFixture } = waffle                                                                     
                                                                                                   
const { bigNumberify } = require("legacy-ethers/utils")                                            
const { expandTo18Decimals } = require("./shared/utilities")                                       
const { fullExchangeFixture } = require("./shared/fixtures")                                       
const { constants } = require("@openzeppelin/test-helpers")                                        
                                                                                                   
const verbose = true                                                                               
                                    
describe("HelixToken", () => {
    let minter, alice, bob, carol, dev, refFeeAddr, safuAddr

    let helixToken

    beforeEach(async () => {
        [minter, alice, bob, carol, dev, refFeeAddr, safuAddr] = await ethers.getSigners()

        const fullExchange = await loadFixture(fullExchangeFixture)
        helixToken = fullExchange.helixToken
   })

    describe("When token is deployed", async () => {
        it('initialized with correct values', async () => {
            expect((await helixToken.maxSupply()).toString())
                .to.eq("1000000000000000000000000000")
            expect((await helixToken.preMineSupply()).toString())
                .to.eq("160000000000000000000000000")
            expect((await helixToken.decimals()).toString()).to.eq("18")
        })
    
        it('Owner should be minter', async () => {
            expect(await helixToken.getOwner()).to.eq(minter.address)
        })

        it('Minter should have all premined supply', async () => {
            expect((await helixToken.balanceOf(minter.address)).toString())
                .to.eq("160000000000000000000000000")
        })
      
        it('Token should have a name and symbol', async () => {
            // When deployed
            // Token should have symbol
            expect(await helixToken.name()).to.eq("Helix")
            // Token should have symbol
            expect(await helixToken.symbol()).to.eq("HELIX")
        })
    })

    describe("When addMinter is called", async () => {
        it('Owner should be able to add minter', async () => {
            const tx = await helixToken.addMinter(alice.address)
            const receipt = await tx.wait()
            expect(receipt.status).to.eq(1)
        })

        it('Minter should not be able to add minter', async () => {
            await helixToken.addMinter(alice.address)
            const helixTokenAlice = helixToken.connect(alice)
            await expect(helixTokenAlice.addMinter(bob.address))
                .to.be.revertedWith("Ownable: caller is not the owner")
        })
    })

    describe("When delMinter is called", async () => {
        beforeEach("add two minters", async () => {
            await helixToken.addMinter(minter.address)
            await helixToken.addMinter(alice.address)
        })

        it('Owner should be able to delete minter', async () => {
            const tx = await helixToken.delMinter(minter.address)
            const receipt = await tx.wait()
            expect(receipt.status).to.eq(1)
        })

        it('Minter should not be able to delete minter', async () => {
            const helixTokenAlice = helixToken.connect(alice)
            await expect(helixTokenAlice.delMinter(alice.address))
                .to.be.revertedWith("Ownable: caller is not the owner")
        })
    })

    describe("When getMinterLength is called", async () => {
        beforeEach("add two minters", async () => {
            await helixToken.addMinter(minter.address)
            await helixToken.addMinter(alice.address)
        })
    
        it('should return 7', async () => {
            // Return 7 because 5 are added in fixtures and 2 added above
            expect(await helixToken.getMinterLength()).to.eq(7)
        })
    })

    describe("When isMinter is called", async () => {
        beforeEach("adding minter address as minter", async () => {
            await helixToken.addMinter(minter.address)
        })

        it('should return true for minter address', async () => {
            expect(await helixToken.isMinter(minter.address)).to.be.true
        })

        it('should return false for non-minter (alice) address', async () => {
            expect(await helixToken.isMinter(alice.address)).to.be.false
        })
    })

    describe("When getMinter is called", async () => {
        beforeEach("adding minter address as minter", async () => {
            await helixToken.addMinter(minter.address)
            await helixToken.addMinter(alice.address)
        })

        it('should return minters address if msg.sender is owner', async () => {
            // When getMinter is call by a address that is not owner
            expect(await helixToken.getMinter(5)).to.be.equal(minter.address)
        })

        it('should revert if msg.sender not owner', async () => {
            // When getMinter is call by a address that is not owner
            expect(await helixToken.getMinter(6)).to.be.equal(alice.address)

            // Should revert
            const helixTokenAlice = helixToken.connect(alice)
            await expect(helixTokenAlice.getMinter(6))
                .to.be.revertedWith("Ownable: caller is not the owner")
        })
    })

    describe("When mint is called", async () => {
        beforeEach("adding minter address as minter", async () => {
            await helixToken.addMinter(minter.address)
        })

        it('should have a minter address as permissioned minter', async () => {
            expect(await helixToken.getMinter(5)).to.eq(minter.address)
        })

        it('should mint when msg.sender is permissioned', async () => {
            await helixToken.mint(alice.address, 10)
            expect(await helixToken.balanceOf(alice.address)).to.eq(10)
        })

        it('Should revert if msg.sender is not permissioned', async () => {
            const helixTokenAlice = helixToken.connect(alice)
            await expect(helixTokenAlice.mint(bob.address, 5))
                .to.be.revertedWith("Helix: not minter")
        })

        it('cannot mint if max supply is reached', async () => {
            // when max supply is reached
            const maxSup = await helixToken.maxSupply()
            // mint the remaining max supply i.e.
            // 1 billion - 16% == 840 million
            await helixToken.mint(alice.address, expandTo18Decimals(840000000))
            expect(await helixToken.totalSupply()).to.eq(maxSup)

            // should not be able to mint.
            await expect(helixToken.mint(bob.address, 1)).to.be.reverted
        })
    })

    describe("When transfer is called", async () => {
        beforeEach("add minter and mint tokens to alice", async () => {
            await helixToken.addMinter(minter.address)
            await helixToken.mint(alice.address, 10)
        })

        it('token holders should be able to transfer balance', async () => {
            const helixTokenAlice = helixToken.connect(alice)
            await helixTokenAlice.transfer(bob.address, "5")
            expect(await helixToken.balanceOf(bob.address)).to.eq(5)
            expect(await helixToken.balanceOf(alice.address)).to.eq(5)
        })

        it('bob should not be able to transfer tokens to alice', async () => {
            // When non-holder tries to transfer token
            // Should revert 
            const helixTokenBob = helixToken.connect(bob)
            await expect(helixTokenBob.transfer(alice.address, 5)).to.be.reverted
        })
    })

    describe("When delegate is called", async () => {
        beforeEach("add minter and mint tokens to alice", async () => {
            await helixToken.addMinter(minter.address)
            await helixToken.mint(alice.address, 10)
        })

        it('alice should not have any delegatee', async () => {
            delegatee = await helixToken.delegates(alice.address)
            // should not have delegatee ( address(0))             
            expect(delegatee).to.eq(constants.ZERO_ADDRESS)
        })

        it('alice should only have votes after delegating to self', async () => {
            expect(await helixToken.getCurrentVotes(alice.address)).to.eq(0)
            const helixTokenAlice = helixToken.connect(alice)
            await helixTokenAlice.delegate(alice.address)
            delegatee = await helixToken.delegates(alice.address)

            //alice should be delegatee & have 10 votes
            expect(delegatee).to.eq(alice.address)
            expect(await helixToken.getCurrentVotes(alice.address)).to.eq(10)
        })

        it('alice should have bob as delegatee', async () => {
            // When alice delegates to bob
            const helixTokenAlice = helixToken.connect(alice)
            await helixTokenAlice.delegate(bob.address)
            delegatee = await helixToken.delegates(alice.address)

            // Bob should be delegatee
            expect(delegatee).to.eq(bob.address)
        })

        it('bob should have votes after being delagated by alice', async () => {
            // When alice delegate votes to bob
            const helixTokenAlice = helixToken.connect(alice)
            await helixTokenAlice.delegate(bob.address)
            const delegatee = await helixToken.delegates(alice.address)

            expect(delegatee).to.eq(bob.address)

            // Should have votesequlto alice balance
            expect(await helixToken.getCurrentVotes(bob.address)).to.eq(10)
        })

        it('alice should not have votes after delagating to bob', async () => {
            // When alice delegates votes to bob
            const helixTokenAlice = helixToken.connect(alice)
            await helixTokenAlice.delegate(bob.address)
            delegatee = await helixToken.delegates(alice.address)
            expect(delegatee).to.eq(bob.address)

            // alice should not have votes
            expect(await helixToken.getCurrentVotes(alice.address)).to.eq(0)
        })
    })
})
