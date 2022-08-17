const { ethers } = require(`hardhat`)
const { print, loadContract, getChainId } = require("../../shared/utilities")
const { setNftChefPercent } = require("../../shared/setters/setters")

const contracts = require('../../../constants/contracts')
const initials = require("../../../constants/initials")


const initializeFeeHandler = async (wallet) => {
    const chainId = await getChainId()

    const feeHandlerAddress = contracts.feeHandler[chainId]

    const vaultAddress = contracts.helixVault[chainId]
    const vaultNftChefPercent = initials.FEE_HANDLER_HELIX_VAULT_NFT_CHEF_PERCENT[chainId]

    const referralRegisterAddress = contracts.referralRegister[chainId]
    const referralRegisterNftChefPercent = initials.FEE_HANDLER_REFERRAL_REGISTER_NFT_CHEF_PERCENT[chainId]

    const lpSwapAddress = contracts.lpSwap[chainId]
    const lpSwapNftChefPercent = initials.FEE_HANDLER_LP_SWAP_NFT_CHEF_PERCENT[chainId]

    // const yieldSwapAddress = contracts.yieldSwap[chainId]
    // const yieldSwapNftChefPercent = initials.FEE_HANDLER_YIELD_SWAP_NFT_CHEF_PERCENT[chainId]

    print("initialize the feeHandler contract")
    const feeHandler = await loadContract(feeHandlerAddress, wallet)
    await setNftChefPercent(feeHandler, vaultAddress, vaultNftChefPercent)
    await setNftChefPercent(feeHandler, referralRegisterAddress, referralRegisterNftChefPercent)
    await setNftChefPercent(feeHandler, lpSwapAddress, lpSwapNftChefPercent)
    // await setNftChefPercent(feeHandler, yieldSwapAddress, yielSwapNftChefPercent)
}

module.exports = { initializeFeeHandler }
