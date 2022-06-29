const { expect } = require("chai")

const { waffle } = require("hardhat")
const { loadFixture } = waffle

const { constants } = require( "legacy-ethers")
const { MaxUint256 } = require("legacy-ethers/constants")

const { expandTo18Decimals } = require("./shared/utilities")
const { fullExchangeFixture } = require("./shared/fixtures")

const env = require("../scripts/constants/env")
const initials = require("../scripts/constants/initials")
const totalToMintPerBlock = initials.FEE_MINTER_TOTAL_TO_MINT_PER_BLOCK[env.network]

const verbose = true

describe("Fee Minter", () => {
    let wallet0, wallet1, wallet2, wallet3

    // Contracts owned by wallet0
    let feeMinter

    // Contracts owned by wallet1
    let feeMinter1

    beforeEach(async () => {
        [wallet0, wallet1, wallet2, wallet3] = await ethers.getSigners()

        const fullExchange = await loadFixture(fullExchangeFixture)
        feeMinter = fullExchange.feeMinter
        feeMinter1 = await feeMinter.connect(wallet1)
    })

    it("feeMinter: initialized with expected values", async () => {
        expect(await feeMinter.totalToMintPerBlock()).to.eq(totalToMintPerBlock)
    })

    it("feeMinter: set total to mint per block as non-owner fails", async () => {
        await expect(feeMinter1.setTotalToMintPerBlock(0))
            .to.be.revertedWith("CallerIsNotTimelockOwner")
    })

    it("feeMinter: set total to mint per block", async () => {
        const totalToMintPerBlock = expandTo18Decimals(100)
        await feeMinter.setTotalToMintPerBlock(totalToMintPerBlock)
        expect(await feeMinter.totalToMintPerBlock()).to.eq(totalToMintPerBlock)
    })

    it("feeMinter: set total to mint per block emits SetTotalToMintPerBlock event", async () => {
        const totalToMintPerBlock = expandTo18Decimals(100)
        await expect(feeMinter.setTotalToMintPerBlock(totalToMintPerBlock))
            .to.emit(feeMinter, "SetTotalToMintPerBlock")
            .withArgs(wallet0.address, totalToMintPerBlock)
    })

    it("feeMinter: set to mint percents as non-owner fails", async () => {
        await expect(feeMinter1.setToMintPercents([], []))
            .to.be.revertedWith("CallerIsNotTimelockOwner")
    })

    it("feeMinter: set to mint percents with array length mismatch fails", async () => {
        await expect(feeMinter.setToMintPercents([], [1]))
            .to.be.revertedWith("FeeMinter: array length mismatch")
    })

    it("feeMinter: set to mint percents with zero address fails", async () => {
        const minters = [constants.AddressZero]
        const toMintPercents = [100]
        await expect(feeMinter.setToMintPercents(minters, toMintPercents))
            .to.be.revertedWith("FeeMinter: zero address")
    })

    it("feeMinter: set to mint percents with invalid to mint percent fails", async () => {
        const minters = [wallet0.address]
        const toMintPercents = [10100]  // 101.00%
        await expect(feeMinter.setToMintPercents(minters, toMintPercents))
            .to.be.revertedWith("FeeMinter: percent sum exceeds 100")
    })

    it("feeMinter: set to mint percents with percents not totaling 100 fails", async () => {
        let minters = [wallet0.address]
        let toMintPercents = [99]   // 99.00%
        await expect(feeMinter.setToMintPercents(minters, toMintPercents))
            .to.be.revertedWith("FeeMinter: percents do not total 100")

        minters = [wallet0.address, wallet1.address]
        toMintPercents = [97, 2]
        await expect(feeMinter.setToMintPercents(minters, toMintPercents))
            .to.be.revertedWith("FeeMinter: percents do not total 100")
    })

    it("feeMinter: set to mint percents", async () => {
        const minters = [wallet0.address, wallet1.address, wallet2.address, wallet3.address]
        const toMintPercents = [6000, 500, 2300, 1200]
        await feeMinter.setToMintPercents(minters, toMintPercents)

        // expect the minters array to have been set
        expect(await feeMinter.getMinters()).to.deep.eq(minters)

        // expect the percents to have been set for each minter
        expect(await feeMinter.getToMintPercent(minters[0])).to.eq(toMintPercents[0])
        expect(await feeMinter.getToMintPercent(minters[1])).to.eq(toMintPercents[1])
        expect(await feeMinter.getToMintPercent(minters[2])).to.eq(toMintPercents[2])
        expect(await feeMinter.getToMintPercent(minters[3])).to.eq(toMintPercents[3])
    })

    it("feeMinter: set to mint percents deletes previous percents", async () => {
        let minters = [wallet0.address, wallet1.address, wallet2.address, wallet3.address]
        let toMintPercents = [6000, 500, 2300, 1200]
        await feeMinter.setToMintPercents(minters, toMintPercents)

        // expect the minters array to have been set
        expect(await feeMinter.getMinters()).to.deep.eq(minters)

        // expect the percents to have been set for each minter
        expect(await feeMinter.getToMintPercent(minters[0])).to.eq(toMintPercents[0])
        expect(await feeMinter.getToMintPercent(minters[1])).to.eq(toMintPercents[1])
        expect(await feeMinter.getToMintPercent(minters[2])).to.eq(toMintPercents[2])
        expect(await feeMinter.getToMintPercent(minters[3])).to.eq(toMintPercents[3])

        minters = [wallet0.address, wallet1.address, wallet2.address]
        toMintPercents = [500, 2300, 7200]
        await feeMinter.setToMintPercents(minters, toMintPercents)

        // expect the minters array to have been set
        expect(await feeMinter.getMinters()).to.deep.eq(minters)

        // expect the percents to have been reassigned for each minter
        expect(await feeMinter.getToMintPercent(minters[0])).to.eq(toMintPercents[0])
        expect(await feeMinter.getToMintPercent(minters[1])).to.eq(toMintPercents[1])
        expect(await feeMinter.getToMintPercent(minters[2])).to.eq(toMintPercents[2])

        // expect wallet3's percent to have been reset to 0
        expect(await feeMinter.getToMintPercent(wallet3.address)).to.eq(0)
    })

    it("feeMinter: set to mint percents emits SetToMintPercents event", async () => {
        const minters = [wallet0.address, wallet1.address, wallet2.address, wallet3.address]
        const toMintPercents = [6000, 500, 2300, 1200]
        const version = 1;
        await expect(feeMinter.setToMintPercents(minters, toMintPercents))
            .to.emit(feeMinter, "SetToMintPercents")
    })

    it("feeMinter: get to mint per block", async () => {
        const minters = [wallet0.address, wallet1.address, wallet2.address, wallet3.address]
        const toMintPercents = [6000, 500, 2300, 1200]
        await feeMinter.setToMintPercents(minters, toMintPercents)
    
        // Using 2 decimals of precision, hence div by 10000 == 100.00%
        const expectedToMintPerBlock0 = totalToMintPerBlock * toMintPercents[0] / 10000
        const expectedToMintPerBlock1 = totalToMintPerBlock * toMintPercents[1] / 10000
        const expectedToMintPerBlock2 = totalToMintPerBlock * toMintPercents[2] / 10000
        const expectedToMintPerBlock3 = totalToMintPerBlock * toMintPercents[3] / 10000

        expect((await feeMinter.getToMintPerBlock(minters[0])).toString())
            .to.eq(expectedToMintPerBlock0.toString())

        expect((await feeMinter.getToMintPerBlock(minters[1])).toString())
            .to.eq(expectedToMintPerBlock1.toString())

        expect((await feeMinter.getToMintPerBlock(minters[2])).toString())
            .to.eq(expectedToMintPerBlock2.toString())

        expect((await feeMinter.getToMintPerBlock(minters[3])).toString())
            .to.eq(expectedToMintPerBlock3.toString())
    })

    function print(str) {
        if (verbose) console.log(str)
    }
})
