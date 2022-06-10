const { expect } = require("chai")

const { waffle } = require("hardhat")
const { loadFixture } = waffle

const { getCreate2Address } = require("./shared/utilities")
const { fullExchangeFixture } = require("./shared/fixtures")

const { constants } = require("@openzeppelin/test-helpers")

const TEST_ADDRESSES = [
    '0x1000000000000000000000000000000000000000',
    '0x2000000000000000000000000000000000000000'
]

describe('HelixFactory', () => {
    let wallet, other
    let factory

    beforeEach(async () => {
        [wallet, other] = await ethers.getSigners()

        const fullExchange = await loadFixture(fullExchangeFixture)
        factory = fullExchange.factory
    })

    it('factory: initialized with expected values', async () => {
        console.log(`INIT CODE HASH ${await factory.INIT_CODE_HASH()}`);
        expect(await factory.feeToSetter()).to.eq(wallet.address)
        expect(await factory.allPairsLength()).to.eq(0)
        expect(await factory.defaultSwapFee()).to.eq(1)
    })

    it('factory: create pair with identical tokens fails', async () => {
        const token = '0x1000000000000000000000000000000000000000'
        await factory.createPair(token, token)
    })

    async function createPair(tokens) {
        const bytecode = `${HelixPair.bytecode}`
        const create2Address = getCreate2Address(factory.address, tokens, bytecode)
        await expect(factory.createPair(...tokens))
            .to.emit(factory, 'CreatePair')
            .withArgs(TEST_ADDRESSES[0], TEST_ADDRESSES[1], create2Address, bigNumberify(1))

        await expect(factory.createPair(...tokens)).to.be.reverted // Helix: PAIR_EXISTS
        await expect(factory.createPair(...tokens.slice().reverse())).to.be.reverted // Helix: PAIR_EXISTS
        expect(await factory.getPair(...tokens)).to.eq(create2Address)
        expect(await factory.getPair(...tokens.slice().reverse())).to.eq(create2Address)
        expect(await factory.allPairs(0)).to.eq(create2Address)
        expect(await factory.allPairsLength()).to.eq(1)

        const pair = new Contract(create2Address, JSON.stringify(HelixPair.abi), provider)
        expect(await pair.factory()).to.eq(factory.address)
        expect(await pair.token0()).to.eq(TEST_ADDRESSES[0])
        expect(await pair.token1()).to.eq(TEST_ADDRESSES[1])
    }

    it('factory: createPair', async () => {
        await createPair(TEST_ADDRESSES)
    })

    it('factory: createPair:reverse', async () => {
        await createPair(TEST_ADDRESSES.slice().reverse())
    })

    it('factory: createPair:gas', async () => {
        const tx = await factory.createPair(...TEST_ADDRESSES)
        const receipt = await tx.wait()
        expect(receipt.gasUsed).to.eq(2419240)
    })

    it('factory: setFeeTo', async () => {
        await expect(factory.connect(other).setFeeTo(other.address)).to.be.revertedWith('Factory: not feeToSetter')
        await factory.setFeeTo(wallet.address)
        expect(await factory.feeTo()).to.eq(wallet.address)
    })

    it('factory: setFeeToSetter', async () => {
        await expect(factory.connect(other).setFeeToSetter(other.address)).to.be.revertedWith('Factory: not feeToSetter')
        await factory.setFeeToSetter(other.address)
        expect(await factory.feeToSetter()).to.eq(other.address)
        await expect(factory.setFeeToSetter(wallet.address)).to.be.revertedWith('Factory: not feeToSetter')
    })
})
