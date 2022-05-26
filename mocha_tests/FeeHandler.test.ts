import chai, { expect } from 'chai'
import { solidity, MockProvider, createFixtureLoader, deployContract } from 'legacy-ethereum-waffle'
import { Contract, constants } from 'legacy-ethers'
import { BigNumber, bigNumberify } from 'legacy-ethers/utils'
import { MaxUint256 } from 'legacy-ethers/constants'

import { fullExchangeFixture } from './shared/fixtures'
import { expandTo18Decimals } from './shared/utilities'

import FeeHandler from '../build/contracts/FeeHandler.json'

const initials = require('../scripts/constants/initials')
const env = require('../scripts/constants/env')

const treasuryAddress = initials.FEE_HANDLER_TREASURY_ADDRESS[env.network]

chai.use(solidity)

const overrides = {
    gasLimit: 99999999999
}

const verbose = true

const feeHandlerJson = JSON.stringify(FeeHandler.abi)

describe('Fee Handler', () => {
    const provider = new MockProvider({
        hardfork: 'istanbul',
        mnemonic: 'horn horn horn horn horn horn horn horn horn horn horn horn',
        gasLimit: 99999999999
    })

    const [wallet0, wallet1, wallet2] = provider.getWallets()
    const loadFixture = createFixtureLoader(provider, [wallet0])

    // contracts owned by wallet0
    let feeHandler: Contract
    let helixChefNFT: Contract
    let tokenA: Contract

    // contracts owned by wallet1
    let feeHandler1: Contract

    beforeEach(async () => {
        const fullExchange = await loadFixture(fullExchangeFixture)
        feeHandler = fullExchange.feeHandler
        helixChefNFT = fullExchange.helixChefNFT
        tokenA = fullExchange.tokenA

        feeHandler1 = new Contract(feeHandler.address, feeHandlerJson, provider).connect(wallet1)
    })

    it("feeHandler: initialized with expected values", async () => {
        expect(await feeHandler.owner()).to.eq(wallet0.address)
        expect(await feeHandler.treasury()).to.eq(treasuryAddress)
        expect(await feeHandler.nftChef()).to.eq(helixChefNFT.address)
    })

    it("feeHandler: set treasury as non-owner fails", async () => {
        const treasuryAddress = wallet0.address
        await expect(feeHandler1.setTreasury(treasuryAddress))
            .to.be.revertedWith("Ownable: caller is not the owner")
    })

    it("feeHandler: set treasury with invalid address fails", async () => {
        const treasuryAddress = constants.AddressZero 
        await expect(feeHandler.setTreasury(treasuryAddress))
            .to.be.revertedWith("FeeHandler: zero address")
    })

    it("feeHandler: set treasury emits SetTreasury event", async () => {
        const treasuryAddress = wallet0.address
        await expect(feeHandler.setTreasury(treasuryAddress))
            .to.emit(feeHandler, "SetTreasury")
            .withArgs(wallet0.address)
    })

    it("feeHandler: set treasury", async () => {
        const treasuryAddress = wallet0.address
        await feeHandler.setTreasury(treasuryAddress)
        expect(await feeHandler.treasury()).to.eq(treasuryAddress)
    })

    it("feeHandler: set nftChef as non-owner fails", async () => {
        const nftChefAddress = helixChefNFT.address
        await expect(feeHandler1.setNftChef(nftChefAddress))
            .to.be.revertedWith("Ownable: caller is not the owner")
    })

    it("feeHandler: set nftChef with invalid address fails", async () => {
        const nftChefAddress = constants.AddressZero 
        await expect(feeHandler.setNftChef(nftChefAddress))
            .to.be.revertedWith("FeeHandler: zero address")
    })

    it("feeHandler: set nft chef emits SetNftChef event", async () => {
        const nftChefAddress = helixChefNFT.address
        await expect(feeHandler.setNftChef(nftChefAddress))
            .to.emit(feeHandler, "SetNftChef")
            .withArgs(nftChefAddress)
    })

    it("feeHandler: set nft chef", async () => {
        const nftChefAddress = helixChefNFT.address
        await feeHandler.setNftChef(nftChefAddress)
        expect(await feeHandler.nftChef()).to.eq(nftChefAddress)
    })

    it("feeHandler: set nftChef percent as non-owner fails", async () => {
        const nftChefPercent = 0
        await expect(feeHandler1.setNftChefPercent(nftChefPercent))
            .to.be.revertedWith("Ownable: caller is not the owner")
    })

    it("feeHandler: set nftChef percent with invalid percent fails", async () => {
        const percent = 101     // Invalid since 100 is max
        await expect(feeHandler.setNftChefPercent(percent))
            .to.be.revertedWith("FeeHandler: percent exceeds max")
    })

    it("feeHandler: set nft chef percent emits SetNftChefPercent event", async () => {
        const percent = 50
        await expect(feeHandler.setNftChefPercent(percent))
            .to.emit(feeHandler, "SetNftChefPercent")
            .withArgs(percent)
    })

    it("feeHandler: set nft chef percent", async () => {
        const percent = 50
        await feeHandler.setNftChefPercent(percent)
        expect(await feeHandler.nftChefPercent()).to.eq(percent)
    })

    it("feeHandler: get nft chef fee", async () => {
        await feeHandler.setNftChefPercent(0)
        expect(await feeHandler.getNftChefFee(100)).to.eq(0)
        await feeHandler.setNftChefPercent(10)
        expect(await feeHandler.getNftChefFee(100)).to.eq(10)
        await feeHandler.setNftChefPercent(50)
        expect(await feeHandler.getNftChefFee(100)).to.eq(50)
        await feeHandler.setNftChefPercent(100)
        expect(await feeHandler.getNftChefFee(100)).to.eq(100)
    })

    it("feeHandler: get nft chef fee split", async () => {
        await feeHandler.setNftChefPercent(0)
        expect((await feeHandler.getNftChefFeeSplit(100))[0]).to.eq(0)
        expect((await feeHandler.getNftChefFeeSplit(100))[1]).to.eq(100)

        await feeHandler.setNftChefPercent(10)
        expect((await feeHandler.getNftChefFeeSplit(100))[0]).to.eq(10)
        expect((await feeHandler.getNftChefFeeSplit(100))[1]).to.eq(90)

        await feeHandler.setNftChefPercent(50)
        expect((await feeHandler.getNftChefFeeSplit(100))[0]).to.eq(50)
        expect((await feeHandler.getNftChefFeeSplit(100))[1]).to.eq(50)

        await feeHandler.setNftChefPercent(100)
        expect((await feeHandler.getNftChefFeeSplit(100))[0]).to.eq(100)
        expect((await feeHandler.getNftChefFeeSplit(100))[1]).to.eq(0)
    })

    it("feeHandler: transfer fee with invalid fee fails", async () => {
        await expect(feeHandler.transferFee(
            tokenA.address, 
            wallet0.address,
            wallet0.address,
            0   // Fee can't equal 0
        )).to.be.revertedWith("FeeHandler: zero fee")
    })

    it("feeHandler: transfer fee when nft chef amount equals 0", async () => {
        await feeHandler.setNftChefPercent(0)

        // Set the treasury to wallet1 so that the balance can be checked
        await feeHandler.setTreasury(wallet1.address) 
    
        // Get the treasury balance before the transfer
        const prevTreasuryBalance = await tokenA.balanceOf(wallet1.address)

        const fee = expandTo18Decimals(100)
    
        // Must approve the handler to transfer the fee
        await tokenA.approve(feeHandler.address, fee)

        // Transfer the fee
        await feeHandler.transferFee(tokenA.address, wallet0.address, wallet0.address, fee)
    
        // Expect the treasury balance to have increased by the fee amount
        const newTreasuryBalance = await tokenA.balanceOf(wallet1.address)
        expect(newTreasuryBalance).to.eq(prevTreasuryBalance.add(fee))
    })

    it("feeHandler: transfer fee when nft chef amount equals 50", async () => {
        await feeHandler.setNftChefPercent(50)

        // Set the treasury to wallet1 so that the balance can be checked
        await feeHandler.setTreasury(wallet1.address) 
    
        // Get the treasury balance before the transfer
        const prevTreasuryBalance = await tokenA.balanceOf(wallet1.address)

        // Get the nftChef balance before the transfer
        const prevNftChefBalance = await tokenA.balanceOf(helixChefNFT.address)

        const fee = expandTo18Decimals(100)
    
        // Must approve the handler to transfer the fee
        await tokenA.approve(feeHandler.address, fee)

        // Transfer the fee
        await feeHandler.transferFee(tokenA.address, wallet0.address, wallet0.address, fee)
    
        // Expect the treasury balance to have increased by half the fee amount
        const newTreasuryBalance = await tokenA.balanceOf(wallet1.address)
        expect(newTreasuryBalance).to.eq(prevTreasuryBalance.add(fee.div(2)))

        // Expect the nftChef balance to have increased by half the fee amount
        const newNftChefBalance = await tokenA.balanceOf(helixChefNFT.address)
        expect(newNftChefBalance).to.eq(prevNftChefBalance.add(fee.div(2)))
    })

    it("feeHandler: transfer fee when nft chef amount equals 100", async () => {
        await feeHandler.setNftChefPercent(100)

        // Get the nftChef balance before the transfer
        const prevNftChefBalance = await tokenA.balanceOf(helixChefNFT.address)

        const fee = expandTo18Decimals(100)
    
        // Must approve the handler to transfer the fee
        await tokenA.approve(feeHandler.address, fee)

        // Transfer the fee
        await feeHandler.transferFee(tokenA.address, wallet0.address, wallet0.address, fee)
    
        // Expect the nftChef balance to have increased by the fee amount
        const newNftChefBalance = await tokenA.balanceOf(helixChefNFT.address)
        expect(newNftChefBalance).to.eq(prevNftChefBalance.add(fee))
    })

    function print(str: string) {
        if (verbose) console.log(str)
    }
})
