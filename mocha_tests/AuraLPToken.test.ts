import chai, { expect } from 'chai'
import { Contract } from 'legacy-ethers'
import { MaxUint256 } from 'legacy-ethers/constants'
import { bigNumberify, hexlify, keccak256, defaultAbiCoder, toUtf8Bytes } from 'legacy-ethers/utils'
import { solidity, loadFixture, createFixtureLoader, MockProvider } from 'legacy-ethereum-waffle'
import { ecsign } from 'ethereumjs-util'

import { expandTo18Decimals, getApprovalDigest } from './shared/utilities'
import { fullExchangeFixture } from './shared/fixtures'

chai.use(solidity)

const TOTAL_SUPPLY = expandTo18Decimals(10000)
const TEST_AMOUNT = expandTo18Decimals(10)

describe('AuraLPToken', () => {
    const provider = new MockProvider({
        hardfork: 'istanbul',
        mnemonic: 'horn horn horn horn horn horn horn horn horn horn horn horn',
        gasLimit: 9999999
    })
    const [wallet, other] = provider.getWallets()
    const loadFixture = createFixtureLoader(provider, [wallet])

    let auraLP: Contract

    beforeEach(async () => {
        const fullExchange = await loadFixture(fullExchangeFixture)
        auraLP = fullExchange.auraLP
    })

    it('auraLP: name, symbol, decimals, totalSupply, balanceOf, DOMAIN_SEPARATOR, PERMIT_TYPEHASH', async () => {
        const name = await auraLP.name()
        expect(name).to.eq('Aura LPs')
        expect(await auraLP.symbol()).to.eq('AURA-LP')
        expect(await auraLP.decimals()).to.eq(18)
        expect(await auraLP.totalSupply()).to.eq(TOTAL_SUPPLY)
        expect(await auraLP.balanceOf(wallet.address)).to.eq(TOTAL_SUPPLY)
        expect(await auraLP.DOMAIN_SEPARATOR()).to.eq(
            keccak256(
                defaultAbiCoder.encode(
                    ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
                    [
                        keccak256(
                            toUtf8Bytes('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)')
                        ),
                        keccak256(toUtf8Bytes(name)),
                        keccak256(toUtf8Bytes('1')),
                        1,
                        auraLP.address
                    ]
                )
            )
        )
        expect(await auraLP.PERMIT_TYPEHASH()).to.eq(
            keccak256(toUtf8Bytes('Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)'))
        )
    })

    it('auraLP: approve', async () => {
        await expect(auraLP.approve(other.address, TEST_AMOUNT))
            .to.emit(auraLP, 'Approval')
            .withArgs(wallet.address, other.address, TEST_AMOUNT)
        expect(await auraLP.allowance(wallet.address, other.address)).to.eq(TEST_AMOUNT)
    })

    it('auraLP: transfer', async () => {
        await expect(auraLP.transfer(other.address, TEST_AMOUNT))
            .to.emit(auraLP, 'Transfer')
            .withArgs(wallet.address, other.address, TEST_AMOUNT)
        expect(await auraLP.balanceOf(wallet.address)).to.eq(TOTAL_SUPPLY.sub(TEST_AMOUNT))
        expect(await auraLP.balanceOf(other.address)).to.eq(TEST_AMOUNT)
    })

    it('auraLP: transfer:fail', async () => {
        await expect(auraLP.transfer(other.address, TOTAL_SUPPLY.add(1))).to.be.reverted // ds-math-sub-underflow
        await expect(auraLP.connect(other).transfer(wallet.address, 1)).to.be.reverted // ds-math-sub-underflow
    })

    it('auraLP: transferFrom', async () => {
        await auraLP.approve(other.address, TEST_AMOUNT)
        await expect(auraLP.connect(other).transferFrom(wallet.address, other.address, TEST_AMOUNT))
            .to.emit(auraLP, 'Transfer')
            .withArgs(wallet.address, other.address, TEST_AMOUNT)
        expect(await auraLP.allowance(wallet.address, other.address)).to.eq(0)
        expect(await auraLP.balanceOf(wallet.address)).to.eq(TOTAL_SUPPLY.sub(TEST_AMOUNT))
        expect(await auraLP.balanceOf(other.address)).to.eq(TEST_AMOUNT)
    })

    it('auraLP: transferFrom:max', async () => {
        await auraLP.approve(other.address, MaxUint256)
        await expect(auraLP.connect(other).transferFrom(wallet.address, other.address, TEST_AMOUNT))
            .to.emit(auraLP, 'Transfer')
            .withArgs(wallet.address, other.address, TEST_AMOUNT)
        expect(await auraLP.allowance(wallet.address, other.address)).to.eq(MaxUint256)
        expect(await auraLP.balanceOf(wallet.address)).to.eq(TOTAL_SUPPLY.sub(TEST_AMOUNT))
        expect(await auraLP.balanceOf(other.address)).to.eq(TEST_AMOUNT)
    })

    it('auraLP: permit', async () => {
        const nonce = await auraLP.nonces(wallet.address)
        const deadline = MaxUint256
        const digest = await getApprovalDigest(
            auraLP,
            { owner: wallet.address, spender: other.address, value: TEST_AMOUNT },
            nonce,
            deadline
        )

        const { v, r, s } = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(wallet.privateKey.slice(2), 'hex'))

        await expect(auraLP.permit(wallet.address, other.address, TEST_AMOUNT, deadline, v, hexlify(r), hexlify(s)))
            .to.emit(auraLP, 'Approval')
            .withArgs(wallet.address, other.address, TEST_AMOUNT)
        expect(await auraLP.allowance(wallet.address, other.address)).to.eq(TEST_AMOUNT)
        expect(await auraLP.nonces(wallet.address)).to.eq(bigNumberify(1))
    })
})
