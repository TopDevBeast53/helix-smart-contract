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
    let alice, bobby, carol

    // contracts owned by alice
    let feeHandler
    let helixChefNft
    let tokenA
    let helixToken

    // contracts owned by bobby
    let feeHandler1

    beforeEach(async () => {
        [alice, bobby, carol] = await ethers.getSigners()

        const fullExchange = await loadFixture(fullExchangeFixture)
        feeHandler = fullExchange.feeHandler
        helixChefNft = fullExchange.helixChefNft
        tokenA = fullExchange.tokenA
        helixToken = fullExchange.helixToken

        feeHandler1 = await feeHandler.connect(bobby)
    })

    it("feeHandler: initialized with expected values", async () => {
        expect(await feeHandler.owner()).to.eq(alice.address)
        expect(await feeHandler.treasury()).to.eq(treasuryAddress)
        expect(await feeHandler.nftChef()).to.eq(helixChefNft.address)
        expect(await feeHandler.helixToken()).to.eq(helixToken.address)
    })

    it("feeHandler: set treasury as non-owner fails", async () => {
        const treasuryAddress = alice.address
        await expect(feeHandler1.setTreasury(treasuryAddress))
            .to.be.revertedWith("CallerIsNotTimelockOwner")
    })

    it("feeHandler: set treasury with invalid address fails", async () => {
        const treasuryAddress = constants.AddressZero
        await expect(feeHandler.setTreasury(treasuryAddress))
            .to.be.revertedWith("FeeHandler: zero address")
    })

    it("feeHandler: set treasury emits SetTreasury event", async () => {
        const treasuryAddress = alice.address
        await expect(feeHandler.setTreasury(treasuryAddress))
            .to.emit(feeHandler, "SetTreasury")
            .withArgs(alice.address, alice.address)
    })

    it("feeHandler: set treasury", async () => {
        const treasuryAddress = alice.address
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
            .to.be.revertedWith("FeeHandler: zero address")
    })

    it("feeHandler: set nft chef emits SetNftChef event", async () => {
        const nftChefAddress = helixChefNft.address
        await expect(feeHandler.setNftChef(nftChefAddress))
            .to.emit(feeHandler, "SetNftChef")
            .withArgs(alice.address, nftChefAddress)
    })

    it("feeHandler: set nft chef", async () => {
        const nftChefAddress = helixChefNft.address
        await feeHandler.setNftChef(nftChefAddress)
        expect(await feeHandler.nftChef()).to.eq(nftChefAddress)
    })

    it("feeHandler: set default nft chef percent as non-owner fails", async () => {
        const defaultNftChefPercent = 0
        await expect(feeHandler1.setDefaultNftChefPercent(defaultNftChefPercent))
            .to.be.revertedWith("Ownable: caller is not the owner")
    })

    it("feeHandler: set default nft chef percent with invalid percent fails", async () => {
        const percent = 101     // Invalid since 100 is max
        await expect(feeHandler.setDefaultNftChefPercent(percent))
            .to.be.revertedWith("FeeHandler: percent exceeds max")
    })

    it("feeHandler: set default nft chef percent emits SetDefaultNftChefPercent event", async () => {
        const percent = 50
        await expect(feeHandler.setDefaultNftChefPercent(percent))
            .to.emit(feeHandler, "SetDefaultNftChefPercent")
            .withArgs(alice.address, percent)
    })

    it("feeHandler: set default nft chef percent", async () => {
        const percent = 50
        await feeHandler.setDefaultNftChefPercent(percent)
        expect(await feeHandler.defaultNftChefPercent()).to.eq(percent)
    })

    it("feeHandler: set nft chef percent as non-owner fails", async () => {
        const feeHandlerBobby = feeHandler.connect(bobby)
        await expect(feeHandlerBobby.setNftChefPercent(alice.address, 100))
            .to.be.revertedWith("Ownable: caller is not the owner")
    })

    it("feeHandler: set nft chef percent with invalid percent fails", async () => {
        const percent = 101     // Invalid since 100 is max
        await expect(feeHandler.setNftChefPercent(alice.address, percent))
            .to.be.revertedWith("FeeHandler: percent exceeds max")
    })

    it("feeHandler: set nft chef percent overrides default", async () => {
        // Set the default nftChef percent
        await feeHandler.setDefaultNftChefPercent(50)

        // Since bobby doesn't have a percent set, expect the default 50:50
        let result = await feeHandler.getNftChefFeeSplit(bobby.address, 100)
        expect(result[0]).to.eq(50)
        expect(result[1]).to.eq(50)

        // Set bobby's nftchef percent
        await feeHandler.setNftChefPercent(bobby.address, 25)

        // Since bobby has a percent set, expect it to override the default 
        result = await feeHandler.getNftChefFeeSplit(bobby.address, 100)
        expect(result[0]).to.eq(25)
        expect(result[1]).to.eq(75)
    })

    it("feeHandler: get nft chef and treasury amounts changes based on token", async () => {
        // Set the default nftChef percent
        await feeHandler.setDefaultNftChefPercent(50)

        // Since token is helix, expect the reward to be split 50:50
        let result = await feeHandler.getNftChefAndTreasuryAmounts(helixToken.address, 100)
        expect(result[0]).to.eq(50)
        expect(result[1]).to.eq(50)

        // Since token is not helix, expect the full amount to go to treasury
        result = await feeHandler.getNftChefAndTreasuryAmounts(tokenA.address, 100)
        expect(result[0]).to.eq(0)
        expect(result[1]).to.eq(100)
    })

    it("feeHandler: get nft chef fee", async () => {
        await feeHandler.setDefaultNftChefPercent(0)
        expect(await feeHandler.getNftChefFee(bobby.address, 100)).to.eq(0)
        await feeHandler.setDefaultNftChefPercent(10)
        expect(await feeHandler.getNftChefFee(bobby.address, 100)).to.eq(10)
        await feeHandler.setDefaultNftChefPercent(50)
        expect(await feeHandler.getNftChefFee(bobby.address, 100)).to.eq(50)
        await feeHandler.setDefaultNftChefPercent(100)
        expect(await feeHandler.getNftChefFee(bobby.address, 100)).to.eq(100)
    })

    it("feeHandler: get nft chef fee split", async () => {
        await feeHandler.setDefaultNftChefPercent(0)
        expect((await feeHandler.getNftChefFeeSplit(bobby.address, 100))[0]).to.eq(0)
        expect((await feeHandler.getNftChefFeeSplit(bobby.address, 100))[1]).to.eq(100)

        await feeHandler.setDefaultNftChefPercent(10)
        expect((await feeHandler.getNftChefFeeSplit(bobby.address, 100))[0]).to.eq(10)
        expect((await feeHandler.getNftChefFeeSplit(bobby.address, 100))[1]).to.eq(90)

        await feeHandler.setDefaultNftChefPercent(50)
        expect((await feeHandler.getNftChefFeeSplit(bobby.address, 100))[0]).to.eq(50)
        expect((await feeHandler.getNftChefFeeSplit(bobby.address, 100))[1]).to.eq(50)

        await feeHandler.setDefaultNftChefPercent(100)
        expect((await feeHandler.getNftChefFeeSplit(bobby.address, 100))[0]).to.eq(100)
        expect((await feeHandler.getNftChefFeeSplit(bobby.address, 100))[1]).to.eq(0)
    })

    it("feeHandler: transfer fee with invalid fee fails", async () => {
        await expect(feeHandler.transferFee(
            helixToken.address,
            alice.address,
            alice.address,
            0   // Fee can't equal 0
        )).to.be.revertedWith("FeeHandler: zero fee")
    })

    it("feeHandler: transfer fee when nft chef amount equals 0", async () => {
        await feeHandler.setDefaultNftChefPercent(0)

        // Set the treasury to bobby so that the balance can be checked
        await feeHandler.setTreasury(bobby.address)

        // Get the treasury balance before the transfer
        const prevTreasuryBalance = await helixToken.balanceOf(bobby.address)

        const fee = expandTo18Decimals(100)

        // Must approve the handler to transfer the fee
        await helixToken.approve(feeHandler.address, fee)

        // Transfer the fee
        await feeHandler.transferFee(helixToken.address, alice.address, alice.address, fee)

        // Expect the treasury balance to have increased by the fee amount
        const newTreasuryBalance = await helixToken.balanceOf(bobby.address)
        expect(newTreasuryBalance).to.eq(prevTreasuryBalance.add(fee))
    })

    it("feeHandler: transfer fee when nft chef amount equals 50", async () => {
        await feeHandler.setDefaultNftChefPercent(50)

        // Set the treasury to bobby so that the balance can be checked
        await feeHandler.setTreasury(bobby.address)

        // Get the treasury balance before the transfer
        const prevTreasuryBalance = await helixToken.balanceOf(bobby.address)

        // Get the nftChef balance before the transfer
        const prevNftChefBalance = await helixToken.balanceOf(helixChefNft.address)

        const fee = expandTo18Decimals(100)

        // Must approve the handler to transfer the fee
        await helixToken.approve(feeHandler.address, fee)

        // Transfer the fee
        await feeHandler.transferFee(helixToken.address, alice.address, alice.address, fee)

        // Expect the treasury balance to have increased by half the fee amount
        const newTreasuryBalance = await helixToken.balanceOf(bobby.address)
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
        await feeHandler.transferFee(helixToken.address, alice.address, alice.address, fee)

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
        await feeHandler.transferFee(tokenA.address, alice.address, alice.address, fee)

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
