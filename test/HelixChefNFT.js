const { expect } = require("chai")                                                                   
                                                                                                   
const { waffle } = require("hardhat")                                                              
const { loadFixture } = waffle                                                                     
                                                                                                   
const { bigNumberify, MaxUint256 } = require("legacy-ethers/utils")                                  
const { expandTo18Decimals } = require("./shared/utilities")                                       
const { fullExchangeFixture } = require("./shared/fixtures")                                       
const { constants } = require("@openzeppelin/test-helpers")                                        
                                                                                                   
const verbose = true     

const BASE_URI_TEST = 'https://niftyroyale.mypinata.cloud/ipfs/QmQRi3cigw8rjVP5BWAQxxBWQyMjXKfy8W4LZieMKtHbzK'
const INITIAL_HELIXPOINTS = 5
const LEVELUPPERCENT = 10
const REWARD_PER_BLOCK = 3

describe("HelixChefNft", () => {
    let deployer, minter, alice, bobby, carol, dev, refFeeAddr, safuAddr
    let helixNft
    let helixChefNft
    let tx, receipt
    let helixToken
    let feeMinter

    const totalToMintPerBlock = expandTo18Decimals(100)
    
    beforeEach(async () => {
        [deployer, minter, alice, bobby, carol, dev, refFeeAddr, safuAddr] = await ethers.getSigners()

        const fixture = await loadFixture(fullExchangeFixture)
        helixNft = fixture.helixNft
        helixChefNft = fixture.helixChefNft
        helixToken = fixture.helixToken 
        feeMinter = fixture.feeMinter

        //Add `minter` as minter of helixNft
        const tx = await helixNft.addMinter(minter.address)
        receipt = await tx.wait()
        expect(receipt.status).to.eq(1)

        //mint helixNft to `alice` by `minter`
        const helixNftMinter = helixNft.connect(minter)

        await helixNftMinter.mint(alice.address)        // created tokenId will be 1.
        expect(await helixNft.ownerOf(1)).to.eq(alice.address)
        await helixNftMinter.mint(alice.address)        // created tokenId will be 2.
        expect(await helixNft.ownerOf(2)).to.eq(alice.address)

        //mint helixNft to `carol` by `minter`
        await helixNftMinter.mint(carol.address)             // created tokenId will be 3.
        expect(await helixNft.ownerOf(3)).to.eq(carol.address)
        await helixNftMinter.mint(carol.address)             // created tokenId will be 4.
        expect(await helixNft.ownerOf(4)).to.eq(carol.address)

        // config the feeMinter
        await feeMinter.setTotalToMintPerBlock(totalToMintPerBlock)
        const minters = [helixChefNft.address]
        const toMintPercents = [10000]
        await feeMinter.setToMintPercents(minters, toMintPercents)

        // make helixChefNft a helixToken minter
        await helixToken.addMinter(helixChefNft.address)
    })

    it("initialized correctly", async () => {
        expect(await helixChefNft.helixNFT()).to.eq(helixNft.address)
        expect(await helixChefNft.rewardToken()).to.eq(helixToken.address)
        expect(await helixChefNft.feeMinter()).to.eq(feeMinter.address)
       
        expect(await feeMinter.totalToMintPerBlock()).to.eq(totalToMintPerBlock)
        expect(await feeMinter.getMinters()).to.deep.eq([helixChefNft.address])
        expect(await feeMinter.getToMintPercent(helixChefNft.address)).to.eq(10000)
    })

    describe("updatePool", async () => {
        it("increments the lastUpdateBlock", async () => {
            await helixChefNft.updatePool()
            const prevUpdateBlock = await helixChefNft.lastUpdateBlock()

            // mine 256 blocks and update again
            await hre.network.provider.send("hardhat_mine", ["0x100"])
            await helixChefNft.updatePool()
        
            expect(await helixChefNft.lastUpdateBlock()).to.be.eq(prevUpdateBlock.add(256).add(1)) 
        })

        it("mints helix", async () => {
            await helixChefNft.updatePool()
            const prevHelixTokenBalance = await helixToken.balanceOf(helixChefNft.address)

            // mine 256 blocks and update again
            await hre.network.provider.send("hardhat_mine", ["0x100"])
            await helixChefNft.updatePool()
      
            const totalToMintPerBlock = await feeMinter.totalToMintPerBlock()
            const toMintPercent = await feeMinter.getToMintPercent(helixChefNft.address)
            const expectedIncrement = totalToMintPerBlock.mul(toMintPercent).mul(256+1).div(10000) 
                
            expect(await helixToken.balanceOf(helixChefNft.address)).to.eq(prevHelixTokenBalance.add(expectedIncrement))
        })

        it("emits UpdatePool event", async () => {
            await expect(helixChefNft.updatePool()).to.emit(helixChefNft, "UpdatePool")
        })
    })

    describe("stake", async () => {
        it("updates the pool", async () => {
            await expect(helixChefNft.connect(alice).stake([1])).to.emit(helixChefNft, "UpdatePool")
        })

        it("increments the user's staked nfts", async () => {
            const prevUsersStakedWrappedNfts = await helixChefNft.usersStakedWrappedNfts(alice.address)
            await helixChefNft.connect(alice).stake([1])
            expect(await helixChefNft.usersStakedWrappedNfts(alice.address)).to.eq(prevUsersStakedWrappedNfts.add(1))
        })

        it("increments the total staked nfts", async () => {
            const prevTotalStakedWrappedNfts = await helixChefNft.totalStakedWrappedNfts()
            await helixChefNft.connect(alice).stake([1])
            expect(await helixChefNft.totalStakedWrappedNfts()).to.eq(prevTotalStakedWrappedNfts.add(1))
        })

        /*
        it("accrues reward", async () => {
            let aliceUserInfo = await helixChefNft.users(alice.address)
            const prevAccruedReward = aliceUserInfo.accruedReward
            expect(prevAccruedReward).to.eq(0)

            await helixChefNft.connect(alice).stake([1])
            await helixChefNft.updatePool()

            await hre.network.provider.send("evm_increaseTime", [1000])
            await hre.network.provider.send("evm_mine")

            console.log(await helixChefNft.getPendingReward(alice.address))
        })
        */
    })

    describe("getPendingReward", async () => {
        it("produces a reward", async () => {
            // alice stakes tokens
            await helixChefNft.connect(alice).stake([1])

            // wait 256 blocks
            await hre.network.provider.send("hardhat_mine", ["0x100"])

            const bal = await helixToken.balanceOf(helixChefNft.address)
            console.log(`bal: ${bal}`)
            const toMint = await helixChefNft._getToMint()
            console.log(`toMint: ${toMint}`)
            const accTokenPerShare = await helixChefNft._getAccTokenPerShare(toMint, bal)
            console.log(`accTokenPerShare: ${accTokenPerShare}`)

            const pendingReward = await helixChefNft.getPendingReward(alice.address)
            console.log(pendingReward)

        })
   })

    /*
    describe("When token is deployed", async () => {
        it('helixChefNft: Check owner, minter, staker', async () => {
            assert.equal((await this.helixNft.owner()).toString(), deployer.toString())
            assert.equal(await this.helixNft.isMinter(minter), true)
            assert.equal(await this.helixNft.isStaker(this.helixChefNft.address), true)
        })
    })

    describe("Initialize of Staking", async () => {
        it('helixChefNft: When an user stakes, the helixPointAmount of user should have a default amount', async () => {
            await this.helixChefNft.stake([1, 2], { from: alice })
            assert.equal((await this.helixChefNft.getUserHelixPointAmount(alice)).toString(), (INITIAL_HELIXPOINTS * 2).toString())
        })
        it('helixChefNft: Check token Owner', async () => {
            await expectRevert.unspecified(this.helixChefNft.stake([1, 2], { from: carol }))//Not token owner
        })
        it('helixChefNft: Double staking of an helixNft is not acceptable', async () => {
            await this.helixChefNft.stake([1], { from: alice })
            await expectRevert.unspecified(this.helixChefNft.stake([1], { from: alice }))//Token has already been staked
        })
    })

    describe("Calculation reward of Staking", async () => {
        it('helixChefNft: Calc pending reward when one person staked', async () => {
            let startBlockNumber = parseInt((await time.latestBlock()).toString())
            await this.helixChefNft.stake([1], { from: alice })// block.number is increased
         
            let res
            await time.advanceBlockTo(startBlockNumber + 21)
            res = await this.helixChefNft.pendingReward(alice)// eventually, passed 20 from start
            assert.equal((res[0]).toString(), this.rwt1.address)// check reward token address
            assert.equal((res[1]).toString(), (REWARD_PER_BLOCK * 20).toString())

            await time.advanceBlockTo(startBlockNumber + 31)
            res = await this.helixChefNft.pendingReward(alice)// eventually, passed 30 from start
            assert.equal((res[1]).toString(), (REWARD_PER_BLOCK * 30).toString())

            await this.helixChefNft.withdrawRewardToken({ from: alice })// block.number is increased
            assert.equal((await this.rwt1.balanceOf(alice)).toString(), (REWARD_PER_BLOCK * (30 + 1)).toString())

            startBlockNumber = parseInt((await time.latestBlock()).toString())
            await this.helixChefNft.stake([2], { from: alice })
            assert.equal((await this.rwt1.balanceOf(alice)).toString(), (REWARD_PER_BLOCK * (30 + 1 + 1)).toString())//because withdrawal before stake newly
         
            await time.advanceBlockTo(startBlockNumber + 11)
            assert.equal(((await this.helixChefNft.pendingReward(alice))[1]).toString(), (REWARD_PER_BLOCK * 10).toString())
            assert.equal((await this.helixChefNft.getUserHelixPointAmount(alice)).toString(), (INITIAL_HELIXPOINTS * 2).toString())
        })
     
        it('helixChefNft: Calc withdrawReward when 2 persons staked', async () => {
            let res, _blockNumber
            await this.helixChefNft.stake([1, 2], { from: alice })
            await this.helixChefNft.stake([3], { from: carol })

            _blockNumber = parseInt((await time.latestBlock()).toString())
            await time.advanceBlockTo(_blockNumber + 10)
         
            await this.helixChefNft.withdrawRewardToken({ from: alice })
            assert.equal((await this.rwt1.balanceOf(alice)).toString(), '25')

            await this.helixChefNft.withdrawRewardToken({ from: carol })
            assert.equal((await this.rwt1.balanceOf(carol)).toString(), '12')
        })
    })
    */
})
