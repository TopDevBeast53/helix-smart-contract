import chai, { expect } from 'chai'
import { solidity, MockProvider, createFixtureLoader, deployContract } from 'ethereum-waffle'
import { Contract } from 'ethers'
import { BigNumber, bigNumberify } from 'ethers/utils'
import { MaxUint256 } from 'ethers/constants'
import AuraPair from '../build/contracts/AuraPair.json'

import { fullExchangeFixture } from './shared/fixtures'
import { mineBlocks } from './shared/utilities'
import { expandTo18Decimals, getApprovalDigest, MINIMUM_LIQUIDITY } from './shared/utilities'

import DeflatingERC20 from '../build/contracts/DeflatingERC20.json'
import { ecsign } from 'ethereumjs-util'

chai.use(solidity)

const overrides = {
    gasLimit: 99999999999
}

describe('MasterChef', () => {
    const provider = new MockProvider({
      hardfork: 'istanbul',
      mnemonic: 'horn horn horn horn horn horn horn horn horn horn horn horn',
      gasLimit: 99999999999
    })
    const [wallet] = provider.getWallets()
    const loadFixture = createFixtureLoader(provider, [wallet])
  
    let auraToken: Contract
    let chef: Contract
    let token0: Contract
    let token1: Contract
    let router: Contract
    let factory: Contract
  
    beforeEach(async function() {
      const fixture = await loadFixture(fullExchangeFixture)
      auraToken = fixture.auraToken
      chef = fixture.chef
      token0 = fixture.token0
      token1 = fixture.token1
      router = fixture.router
      factory = fixture.factory

      await auraToken.addMinter(chef.address)
    })

    it('chef is minter', async () => {
      const isChefMinter = await auraToken.isMinter(chef.address);
      expect(isChefMinter).to.eq(true);
    })

    it('add liquidity and farm', async () => {
      // Prepare
      await token0.approve(router.address, MaxUint256)
      await token1.approve(router.address, MaxUint256)
      await router.addLiquidity(
        token0.address,
        token1.address,
        bigNumberify(100000),
        bigNumberify(100000),
        0,
        0,
        wallet.address,
        MaxUint256,
        overrides
      )

      const pairAddress = await factory.getPair(token0.address, token1.address)
      const lpToken = new Contract(pairAddress, JSON.stringify(AuraPair.abi), provider).connect(wallet)

      const balanceOfPair = await lpToken.balanceOf(wallet.address);
      expect(balanceOfPair).to.eq(99000);

      // Setup chef by adding a pool for newly added pair
      await chef.add(2000, lpToken.address, true);
      const poolsCount = await chef.poolLength();
      expect(poolsCount).to.eq(2);

      // Deposit LP token to chef
      await lpToken.approve(chef.address, MaxUint256);
      await chef.deposit(1, 99000);

      // Mine 100 blocks
      await mineBlocks(100, provider);

      // Withdraw LP token from chef & ensure rewards have been given
      const auraBalanceBefore = await auraToken.balanceOf(wallet.address);
      const previousBalanceOfLp = await lpToken.balanceOf(wallet.address);
      expect(previousBalanceOfLp).to.eq(0);
      expect(auraBalanceBefore).to.eq("10000000000000000000000000");

      await chef.withdraw(1, 99000);

      const newAuraBalance = await auraToken.balanceOf(wallet.address);
      const newBalanceOfLp = await lpToken.balanceOf(wallet.address);
      expect(newBalanceOfLp).to.eq(99000);
      expect(newAuraBalance).to.eq("10002019997980000000000000");
    });

    it('stake aura', async () => {
      // Chef must already have a pool with id = 0 which is responsible
      // for staking aura
      
      // Prepare
      await auraToken.approve(chef.address, "10000000000000000000000000");

      // Stake
      await chef.enterStaking("1000000000000000000000000");
      const userBalanceAfterStaking = await auraToken.balanceOf(wallet.address);
      expect(userBalanceAfterStaking).to.eq("9000000000000000000000000");

      // Unstake
      await chef.leaveStaking("1000000000000000000000000");
      const userBalanceAfterUnStaking = await auraToken.balanceOf(wallet.address);
      expect(userBalanceAfterUnStaking).to.eq("10000029999970000000000000");
    });
})