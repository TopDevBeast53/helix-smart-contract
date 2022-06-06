import chai, { expect } from "chai"
import { solidity, MockProvider, createFixtureLoader, deployContract } from "legacy-ethereum-waffle"
import { Contract, constants } from "legacy-ethers"
import { BigNumber, bigNumberify } from "legacy-ethers/utils"
import { MaxUint256 } from "legacy-ethers/constants"

import { fullExchangeFixture } from "./shared/fixtures"
import { expandTo18Decimals } from "./shared/utilities"

import FeeMinter from "../build/contracts/FeeMinter.json"

const initials = require("../scripts/constants/initials")
const env = require("../scripts/constants/env")

const totalToMintPerBlock = initials.FEE_MINTER_TOTAL_TO_MINT_PER_BLOCK[env.network]

chai.use(solidity)

const overrides = {
    gasLimit: 99999999999
}

const verbose = true

describe("Fee Minter", () => {
    const provider = new MockProvider({
        hardfork: "istanbul",
        mnemonic: "horn horn horn horn horn horn horn horn horn horn horn horn",
        gasLimit: 99999999999
    })

    const [wallet0, wallet1, wallet2, wallet3] = provider.getWallets()
    const loadFixture = createFixtureLoader(provider, [wallet0])

    // Contracts owned by wallet0
    let feeMinter: Contract

    // Contracts owned by wallet1
    let feeMinter1: Contract

    beforeEach(async () => {
        const fullExchange = await loadFixture(fullExchangeFixture)
        feeMinter = fullExchange.feeMinter

        feeMinter1 = new Contract(feeMinter.address, JSON.stringify(FeeMinter.abi), provider)
            .connect(wallet1)
    })

    it("feeMinter: initialized with expected values", async () => {
        expect(await feeMinter.totalToMintPerBlock()).to.eq(totalToMintPerBlock)
    })

    it("feeMinter: set total to mint per block as non-owner fails", async () => {
        await expect(feeMinter1.setTotalToMintPerBlock(0))
            .to.be.revertedWith("Ownable: caller is not the owner")
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
            .to.be.revertedWith("Ownable: caller is not the owner")
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
        const toMintPercents = [101]
        await expect(feeMinter.setToMintPercents(minters, toMintPercents))
            .to.be.revertedWith("FeeMinter: percent sum exceeds 100") 
    })

    it("feeMinter: set to mint percents with percents not totaling 100 fails", async () => {
        let minters = [wallet0.address]
        let toMintPercents = [99]
        await expect(feeMinter.setToMintPercents(minters, toMintPercents))
            .to.be.revertedWith("FeeMinter: percents do not total 100") 

        minters = [wallet0.address, wallet1.address]
        toMintPercents = [97, 2]
        await expect(feeMinter.setToMintPercents(minters, toMintPercents))
            .to.be.revertedWith("FeeMinter: percents do not total 100") 
    })

    it("feeMinter: set to mint percents", async () => {
        const minters = [wallet0.address, wallet1.address, wallet2.address, wallet3.address]
        const toMintPercents = [60, 5, 23, 12]
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
        let toMintPercents = [60, 5, 23, 12]
        await feeMinter.setToMintPercents(minters, toMintPercents)

        // expect the minters array to have been set
        expect(await feeMinter.getMinters()).to.deep.eq(minters)

        // expect the percents to have been set for each minter
        expect(await feeMinter.getToMintPercent(minters[0])).to.eq(toMintPercents[0])
        expect(await feeMinter.getToMintPercent(minters[1])).to.eq(toMintPercents[1])
        expect(await feeMinter.getToMintPercent(minters[2])).to.eq(toMintPercents[2])
        expect(await feeMinter.getToMintPercent(minters[3])).to.eq(toMintPercents[3])

        minters = [wallet0.address, wallet1.address, wallet2.address]
        toMintPercents = [5, 23, 72]
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
        const toMintPercents = [60, 5, 23, 12]
        const version = 1;
        await expect(feeMinter.setToMintPercents(minters, toMintPercents))
            .to.emit(feeMinter, "SetToMintPercents")
    })

    it("feeMinter: get to mint per block", async () => {
        const minters = [wallet0.address, wallet1.address, wallet2.address, wallet3.address]
        const toMintPercents = [60, 5, 23, 12]
        await feeMinter.setToMintPercents(minters, toMintPercents)

        const expectedToMintPerBlock0 = totalToMintPerBlock * toMintPercents[0] / 100
        const expectedToMintPerBlock1 = totalToMintPerBlock * toMintPercents[1] / 100
        const expectedToMintPerBlock2 = totalToMintPerBlock * toMintPercents[2] / 100
        const expectedToMintPerBlock3 = totalToMintPerBlock * toMintPercents[3] / 100

        expect((await feeMinter.getToMintPerBlock(minters[0])).toString())
            .to.eq(expectedToMintPerBlock0.toString())

        expect((await feeMinter.getToMintPerBlock(minters[1])).toString())
            .to.eq(expectedToMintPerBlock1.toString())

        expect((await feeMinter.getToMintPerBlock(minters[2])).toString())
            .to.eq(expectedToMintPerBlock2.toString())

        expect((await feeMinter.getToMintPerBlock(minters[3])).toString())
            .to.eq(expectedToMintPerBlock3.toString())
    })

    function print(str: string) {
        if (verbose) console.log(str)
    }
})
