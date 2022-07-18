const { ethers } = require(`hardhat`)
const { print, loadContract } = require("../../shared/utilities")
const { setNftChefPercent } = require("../../shared/setters/setters")

const env = require('../../../constants/env')
const contracts = require('../../../constants/contracts')
const initials = require("../../../constants/initials")

const feeHandlerAddress = contracts.feeHandler[env.network]

const vaultAddress = contracts.helixVault[env.network]
const vaultNftChefPercent = initials.FEE_HANDLER_HELIX_VAULT_NFT_CHEF_PERCENT[env.network]

const referralRegisterAddress = contracts.referralRegister[env.network]
const referralRegisterNftChefPercent = initials.FEE_HANDLER_REFERRAL_REGISTER_NFT_CHEF_PERCENT[env.network]

const lpSwapAddress = contracts.lpSwap[env.network]
const lpSwapNftChefPercent = initials.FEE_HANDLER_LP_SWAP_NFT_CHEF_PERCENT[env.network]

// const yieldSwapAddress = contracts.yieldSwap[env.network]
// const yieldSwapNftChefPercent = initials.FEE_HANDLER_YIELD_SWAP_NFT_CHEF_PERCENT[env.network]

const initializeFeeHandler = async (wallet) => {
    print("initialize the feeHandler contract")
    const feeHandler = await loadContract(feeHandlerAddress, wallet)
    await setNftChefPercent(feeHandler, vaultAddress, vaultNftChefPercent)
    await setNftChefPercent(feeHandler, referralRegisterAddress, referralRegisterNftChefPercent)
    await setNftChefPercent(feeHandler, lpSwapAddress, lpSwapNftChefPercent)
    // await setNftChefPercent(feeHandler, yieldSwapAddress, yielSwapNftChefPercent)
}

module.exports = { initializeFeeHandler }
