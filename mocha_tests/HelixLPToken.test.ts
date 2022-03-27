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

describe('HelixLPToken', () => {
    const provider = new MockProvider({
        hardfork: 'istanbul',
        mnemonic: 'horn horn horn horn horn horn horn horn horn horn horn horn',
        gasLimit: 9999999
    })
    const [wallet, other] = provider.getWallets()
    const loadFixture = createFixtureLoader(provider, [wallet])

    let helixLP: Contract

    beforeEach(async () => {
        const fullExchange = await loadFixture(fullExchangeFixture)
        helixLP = fullExchange.helixLP
    })

    it('helixLP: name, symbol, decimals, totalSupply, balanceOf, DOMAIN_SEPARATOR, PERMIT_TYPEHASH', async () => {
        const name = await helixLP.name()
        expect(name).to.eq('Helix LPs')
        expect(await helixLP.symbol()).to.eq('HELIX-LP')
        expect(await helixLP.decimals()).to.eq(18)
        expect(await helixLP.totalSupply()).to.eq(TOTAL_SUPPLY)
        expect(await helixLP.balanceOf(wallet.address)).to.eq(TOTAL_SUPPLY)
        expect(await helixLP.DOMAIN_SEPARATOR()).to.eq(
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
                        helixLP.address
                    ]
                )
            )
        )
        expect(await helixLP.PERMIT_TYPEHASH()).to.eq(
            keccak256(toUtf8Bytes('Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)'))
        )
    })

    it('helixLP: approve', async () => {
        await expect(helixLP.approve(other.address, TEST_AMOUNT))
            .to.emit(helixLP, 'Approval')
            .withArgs(wallet.address, other.address, TEST_AMOUNT)
        expect(await helixLP.allowance(wallet.address, other.address)).to.eq(TEST_AMOUNT)
    })

    it('helixLP: transfer', async () => {
        await expect(helixLP.transfer(other.address, TEST_AMOUNT))
            .to.emit(helixLP, 'Transfer')
            .withArgs(wallet.address, other.address, TEST_AMOUNT)
        expect(await helixLP.balanceOf(wallet.address)).to.eq(TOTAL_SUPPLY.sub(TEST_AMOUNT))
        expect(await helixLP.balanceOf(other.address)).to.eq(TEST_AMOUNT)
    })

    it('helixLP: transfer:fail', async () => {
        await expect(helixLP.transfer(other.address, TOTAL_SUPPLY.add(1))).to.be.reverted // ds-math-sub-underflow
        await expect(helixLP.connect(other).transfer(wallet.address, 1)).to.be.reverted // ds-math-sub-underflow
    })

    it('helixLP: transferFrom', async () => {
        await helixLP.approve(other.address, TEST_AMOUNT)
        await expect(helixLP.connect(other).transferFrom(wallet.address, other.address, TEST_AMOUNT))
            .to.emit(helixLP, 'Transfer')
            .withArgs(wallet.address, other.address, TEST_AMOUNT)
        expect(await helixLP.allowance(wallet.address, other.address)).to.eq(0)
        expect(await helixLP.balanceOf(wallet.address)).to.eq(TOTAL_SUPPLY.sub(TEST_AMOUNT))
        expect(await helixLP.balanceOf(other.address)).to.eq(TEST_AMOUNT)
    })

    it('helixLP: transferFrom:max', async () => {
        await helixLP.approve(other.address, MaxUint256)
        await expect(helixLP.connect(other).transferFrom(wallet.address, other.address, TEST_AMOUNT))
            .to.emit(helixLP, 'Transfer')
            .withArgs(wallet.address, other.address, TEST_AMOUNT)
        expect(await helixLP.allowance(wallet.address, other.address)).to.eq(MaxUint256)
        expect(await helixLP.balanceOf(wallet.address)).to.eq(TOTAL_SUPPLY.sub(TEST_AMOUNT))
        expect(await helixLP.balanceOf(other.address)).to.eq(TEST_AMOUNT)
    })

    it('helixLP: permit', async () => {
        const nonce = await helixLP.nonces(wallet.address)
        const deadline = MaxUint256
        const digest = await getApprovalDigest(
            helixLP,
            { owner: wallet.address, spender: other.address, value: TEST_AMOUNT },
            nonce,
            deadline
        )

        const { v, r, s } = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(wallet.privateKey.slice(2), 'hex'))

        await expect(helixLP.permit(wallet.address, other.address, TEST_AMOUNT, deadline, v, hexlify(r), hexlify(s)))
            .to.emit(helixLP, 'Approval')
            .withArgs(wallet.address, other.address, TEST_AMOUNT)
        expect(await helixLP.allowance(wallet.address, other.address)).to.eq(TEST_AMOUNT)
        expect(await helixLP.nonces(wallet.address)).to.eq(bigNumberify(1))
    })
})
