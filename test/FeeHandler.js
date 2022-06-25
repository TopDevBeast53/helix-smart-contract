const { expect } = require("chai")

const { waffle } = require("hardhat")
const { loadFixture } = waffle

const { constants } = require( "legacy-ethers")
const { MaxUint256 } = require("legacy-ethers/constants")

const { expandTo18Decimals } = require("./shared/utilities")
const { fullExchangeFixture } = require("./shared/fixtures")

const env = require('../scripts/constants/env')
const addresses = require('../scripts/constants/addresses')
const treasuryAddress = addresses.TREASURY[env.network]

const verbose = true

describe('Fee Handler', () => {
    let wallet0, wallet1, wallet2

    // contracts owned by wallet0
    let feeHandler
    let helixChefNft
    let tokenA
    let helixToken

    // contracts owned by wallet1
    let feeHandler1

    beforeEach(async () => {
        [wallet0, wallet1, wallet2] = await ethers.getSigners()

        const fullExchange = await loadFixture(fullExchangeFixture)
        feeHandler = fullExchange.feeHandler
        helixChefNft = fullExchange.helixChefNft
        tokenA = fullExchange.tokenA
        helixToken = fullExchange.helixToken

        feeHandler1 = await feeHandler.connect(wallet1)
    })

    it("feeHandler: initialized with expected values", async () => {
        expect(await feeHandler.owner()).to.eq(wallet0.address)
        expect(await feeHandler.treasury()).to.eq(treasuryAddress)
        expect(await feeHandler.nftChef()).to.eq(helixChefNft.address)
        expect(await feeHandler.helixToken()).to.eq(helixToken.address)
    })

    it("feeHandler: set treasury as non-owner fails", async () => {
        const treasuryAddress = wallet0.address
        await expect(feeHandler1.setTreasury(treasuryAddress))
            .to.be.revertedWith("CallerIsNotTimelockOwner")
    })

    it("feeHandler: set treasury with invalid address fails", async () => {
        const treasuryAddress = constants.AddressZero
        await expect(feeHandler.setTreasury(treasuryAddress))
            .to.be.revertedWith("ZeroAddress()")
    })

    it("feeHandler: set treasury emits SetTreasury event", async () => {
        const treasuryAddress = wallet0.address
        await expect(feeHandler.setTreasury(treasuryAddress))
            .to.emit(feeHandler, "SetTreasury")
            .withArgs(wallet0.address, wallet0.address)
    })

    it("feeHandler: set treasury", async () => {
        const treasuryAddress = wallet0.address
        await feeHandler.setTreasury(treasuryAddress)
        expect(await feeHandler.treasury()).to.eq(treasuryAddress)
    })

    it("feeHandler: set nftChef as non-owner fails", async () => {
        const nftChefAddress = helixChefNft.address
        await expect(feeHandler1.setNftChef(nftChefAddress))
            .to.be.revertedWith("Ownable: caller is not the owner")
    })

    it("feeHandler: set nftChef with invalid address fails", async () => {
        const nftChefAddress = constants.AddressZero
        await expect(feeHandler.setNftChef(nftChefAddress))
            .to.be.revertedWith("ZeroAddress()")
    })

    it("feeHandler: set nft chef emits SetNftChef event", async () => {
        const nftChefAddress = helixChefNft.address
        await expect(feeHandler.setNftChef(nftChefAddress))
            .to.emit(feeHandler, "SetNftChef")
            .withArgs(wallet0.address, nftChefAddress)
    })

    it("feeHandler: set nft chef", async () => {
        const nftChefAddress = helixChefNft.address
        await feeHandler.setNftChef(nftChefAddress)
        expect(await feeHandler.nftChef()).to.eq(nftChefAddress)
    })

    it("feeHandler: set nftChef percent as non-owner fails", async () => {
        const defaultNftChefPercent = 0
        await expect(feeHandler1.setDefaultNftChefPercent(defaultNftChefPercent))
            .to.be.revertedWith("Ownable: caller is not the owner")
    })

    it("feeHandler: set nftChef percent with invalid percent fails", async () => {
        const percent = 101     // Invalid since 100 is max
        await expect(feeHandler.setDefaultNftChefPercent(percent))
            .to.be.revertedWith("InvalidPercent(101, 0)")
    })

    it("feeHandler: set nft chef percent emits SetDefaultNftChefPercent event", async () => {
        const percent = 50
        await expect(feeHandler.setDefaultNftChefPercent(percent))
            .to.emit(feeHandler, "SetDefaultNftChefPercent")
            .withArgs(wallet0.address, percent)
    })

    it("feeHandler: set nft chef percent", async () => {
        const percent = 50
        await feeHandler.setDefaultNftChefPercent(percent)
        expect(await feeHandler.defaultNftChefPercent()).to.eq(percent)
    })

    it("feeHandler: get nft chef fee", async () => {
        await feeHandler.setDefaultNftChefPercent(0)
        expect(await feeHandler.getNftChefFee(wallet1.address, 100)).to.eq(0)
        await feeHandler.setDefaultNftChefPercent(10)
        expect(await feeHandler.getNftChefFee(wallet1.address, 100)).to.eq(10)
        await feeHandler.setDefaultNftChefPercent(50)
        expect(await feeHandler.getNftChefFee(wallet1.address, 100)).to.eq(50)
        await feeHandler.setDefaultNftChefPercent(100)
        expect(await feeHandler.getNftChefFee(wallet1.address, 100)).to.eq(100)
    })

    it("feeHandler: get nft chef fee split", async () => {
        await feeHandler.setDefaultNftChefPercent(0)
        expect((await feeHandler.getNftChefFeeSplit(wallet1.address, 100))[0]).to.eq(0)
        expect((await feeHandler.getNftChefFeeSplit(wallet1.address, 100))[1]).to.eq(100)

        await feeHandler.setDefaultNftChefPercent(10)
        expect((await feeHandler.getNftChefFeeSplit(wallet1.address, 100))[0]).to.eq(10)
        expect((await feeHandler.getNftChefFeeSplit(wallet1.address, 100))[1]).to.eq(90)

        await feeHandler.setDefaultNftChefPercent(50)
        expect((await feeHandler.getNftChefFeeSplit(wallet1.address, 100))[0]).to.eq(50)
        expect((await feeHandler.getNftChefFeeSplit(wallet1.address, 100))[1]).to.eq(50)

        await feeHandler.setDefaultNftChefPercent(100)
        expect((await feeHandler.getNftChefFeeSplit(wallet1.address, 100))[0]).to.eq(100)
        expect((await feeHandler.getNftChefFeeSplit(wallet1.address, 100))[1]).to.eq(0)
    })

    it("feeHandler: transfer fee with invalid fee fails", async () => {
        await expect(feeHandler.transferFee(
            helixToken.address,
            wallet0.address,
            wallet0.address,
            0   // Fee can't equal 0
        )).to.be.revertedWith("ZeroFee()")
    })

    it("feeHandler: transfer fee when nft chef amount equals 0", async () => {
        await feeHandler.setDefaultNftChefPercent(0)

        // Set the treasury to wallet1 so that the balance can be checked
        await feeHandler.setTreasury(wallet1.address)

        // Get the treasury balance before the transfer
        const prevTreasuryBalance = await helixToken.balanceOf(wallet1.address)

        const fee = expandTo18Decimals(100)

        // Must approve the handler to transfer the fee
        await helixToken.approve(feeHandler.address, fee)

        // Transfer the fee
        await feeHandler.transferFee(helixToken.address, wallet0.address, wallet0.address, fee)

        // Expect the treasury balance to have increased by the fee amount
        const newTreasuryBalance = await helixToken.balanceOf(wallet1.address)
        expect(newTreasuryBalance).to.eq(prevTreasuryBalance.add(fee))
    })

    it("feeHandler: transfer fee when nft chef amount equals 50", async () => {
        await feeHandler.setDefaultNftChefPercent(50)

        // Set the treasury to wallet1 so that the balance can be checked
        await feeHandler.setTreasury(wallet1.address)

        // Get the treasury balance before the transfer
        const prevTreasuryBalance = await helixToken.balanceOf(wallet1.address)

        // Get the nftChef balance before the transfer
        const prevNftChefBalance = await helixToken.balanceOf(helixChefNft.address)

        const fee = expandTo18Decimals(100)

        // Must approve the handler to transfer the fee
        await helixToken.approve(feeHandler.address, fee)

        // Transfer the fee
        await feeHandler.transferFee(helixToken.address, wallet0.address, wallet0.address, fee)

        // Expect the treasury balance to have increased by half the fee amount
        const newTreasuryBalance = await helixToken.balanceOf(wallet1.address)
        expect(newTreasuryBalance).to.eq(prevTreasuryBalance.add(fee.div(2)))

        // Expect the nftChef balance to have increased by half the fee amount
        const newNftChefBalance = await helixToken.balanceOf(helixChefNft.address)
        expect(newNftChefBalance).to.eq(prevNftChefBalance.add(fee.div(2)))
    })

    it("feeHandler: transfer fee when nft chef amount equals 100", async () => {
        await feeHandler.setDefaultNftChefPercent(100)

        // Get the nftChef balance before the transfer
        const prevNftChefBalance = await helixToken.balanceOf(helixChefNft.address)

        const fee = expandTo18Decimals(100)

        // Must approve the handler to transfer the fee
        await helixToken.approve(feeHandler.address, fee)

        // Transfer the fee
        await feeHandler.transferFee(helixToken.address, wallet0.address, wallet0.address, fee)

        // Expect the nftChef balance to have increased by the fee amount
        const newNftChefBalance = await helixToken.balanceOf(helixChefNft.address)
        expect(newNftChefBalance).to.eq(prevNftChefBalance.add(fee))
    })

    it("feeHandler: transfer fee when token is helix transfers all to treasury", async () => {
        const treasuryAddress = await feeHandler.treasury()

        // Set chef percent to 50
        // if token is helix expect 50% to treasury and 50% to nftChef
        // else if token is not helix expect 100% to treasury
        await feeHandler.setDefaultNftChefPercent(50)

        // Get the nftChef balance before the transfer
        const prevNftChefBalance = await tokenA.balanceOf(helixChefNft.address)
        const prevTreasuryBalance = await tokenA.balanceOf(treasuryAddress)

        const fee = expandTo18Decimals(100)

        // Must approve the handler to transfer the fee
        await tokenA.approve(feeHandler.address, fee)

        // Transfer the fee
        await feeHandler.transferFee(tokenA.address, wallet0.address, wallet0.address, fee)

        // Expect the nftChef balance to have remained the same since token was not helix
        const newNftChefBalance = await tokenA.balanceOf(helixChefNft.address)
        expect(newNftChefBalance).to.eq(0)

        // And expect treasury to have received entire fee
        const newTreasuryBalance = await tokenA.balanceOf(treasuryAddress)
        expect(newTreasuryBalance).to.eq(prevTreasuryBalance.add(fee))
    })

    function print(str) {
        if (verbose) console.log(str)
    }
})
