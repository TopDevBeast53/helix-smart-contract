const { expect } = require("chai")

const { waffle } = require("hardhat")
const { loadFixture } = waffle

const { bigNumberify } = require("legacy-ethers/utils")
const { expandTo18Decimals } = require("./shared/utilities")
const { fullExchangeFixture } = require("./shared/fixtures")

const { constants } = require("@openzeppelin/test-helpers")

describe("HelixFactory", () => {
    let wallet, other
    let factory
    let tokenA, tokenB, tokenC

    beforeEach(async () => {
        [wallet, other] = await ethers.getSigners()

        const fullExchange = await loadFixture(fullExchangeFixture)
        factory = fullExchange.factory
        tokenA = fullExchange.tokenA
        tokenB = fullExchange.tokenB
        tokenC = fullExchange.tokenC
    })

    it("factory: initialized with expected values", async () => {
        console.log(`INIT CODE HASH ${await factory.INIT_CODE_HASH()}`);
        expect(await factory.feeToSetter()).to.eq(wallet.address)
        expect(await factory.allPairsLength()).to.eq(0)
        expect(await factory.defaultSwapFee()).to.eq(1)
    })

    it("factory: create pair with identical tokens fails", async () => {
        await expect(factory.createPair(tokenA.address, tokenA.address))
            .to.be.revertedWith("Factory: identical addresses")
    })

    it("factory: create pair with zero address token fails", async () => {
        await expect(factory.createPair(constants.ZERO_ADDRESS, tokenB.address))
            .to.be.revertedWith("Factory: zero address")
        await expect(factory.createPair(tokenC.address, constants.ZERO_ADDRESS))
            .to.be.revertedWith("Factory: zero address")
    })

    it("factory: create pair when pair exists fails", async () => {
        await factory.createPair(tokenA.address, tokenB.address)
        const loTokenAddress = tokenA.address <= tokenB.address ? tokenA.address : tokenB.address
        const hiTokenAddress = loTokenAddress == tokenA.address ? tokenB.address : tokenA.address
        await expect(factory.createPair(tokenA.address, tokenB.address))
            .to.be.revertedWith("Factory: pair exists")
    })

    it("factory: create pair", async () => {
        await factory.createPair(tokenA.address, tokenB.address)
        const pairAddress = await factory.getPair(tokenB.address, tokenA.address)

        const loTokenAddress = tokenA.address <= tokenB.address ? tokenA.address : tokenB.address
        const hiTokenAddress = loTokenAddress == tokenA.address ? tokenB.address : tokenA.address
        
        const pair = await getContract("HelixPair", pairAddress)
        expect(await pair.factory()).to.eq(factory.address)
        expect(await pair.token0()).to.eq(loTokenAddress)
        expect(await pair.token1()).to.eq(hiTokenAddress)
    })

    it("factory: create pair emits CreatePair event", async () => {
        await expect(factory.createPair(tokenA.address, tokenB.address))
            .to.emit(factory, "CreatePair")
    })

    it("factory: setFeeTo", async () => {
        await expect(factory.connect(other)
            .setFeeTo(other.address))
            .to.be.revertedWith("Factory: not feeToSetter")
        await factory.setFeeTo(wallet.address)
        expect(await factory.feeTo()).to.eq(wallet.address)
    })

    it("factory: setFeeToSetter", async () => {
        await expect(factory.connect(other)
            .setFeeToSetter(other.address))
            .to.be.revertedWith("Factory: not feeToSetter")
        await factory.setFeeToSetter(other.address)
        expect(await factory.feeToSetter()).to.eq(other.address)
        await expect(factory.setFeeToSetter(wallet.address))
            .to.be.revertedWith("Factory: not feeToSetter")
    })

    async function getContract(name, address) {
        const contractFactory = await ethers.getContractFactory(name)
        return contract = contractFactory.attach(address)
    }
})
