/**
 * @dev Run to set collector fee
 * 
 *      npx hardhat run scripts/2_setter/feeHandler.js --network ropsten
 */

const { ethers } = require("hardhat")
const { print, loadContract } = require("../shared/utilities")
const { setNftChefPercent } = require("../shared/setters")

const env = require("../constants/env")
const contracts = require("../constants/contracts")
const initials = require("../constants/initials")
const names = require("../constants/names")

const feeHandlerAddress = contracts.feeHandler[env.network]
const feeHandlerName = names.feeHandlerAddress

const vaultAddress = contracts.helixVault[env.network]
const vaultNftChefPercent = initials.FEE_HANDLER_HELIX_VAULT_NFT_CHEF_PERCENT[env.network]

const referralRegisterAddress = contracts.referralRegister[env.network]
const referralRegisterNftChefPercent = initials.FEE_HANDLER_REFERRAL_REGISTER_NFT_CHEF_PERCENT[env.network]

const lpSwapAddress = contracts.lpSwap[env.network]
const lpSwapNftChefPercent = initials.FEE_HANDLER_LP_SWAP_NFT_CHEF_PERCENT[env.network]

// const yieldSwapAddress = contracts.yieldSwap[env.network]
// const yieldSwapNftChefPercent = initials.FEE_HANDLER_YIELD_SWAP_NFT_CHEF_PERCENT[env.network]

async function main() {
    const [wallet] = await ethers.getSigners()
    print(`load wallet: ${wallet.address}`)

    const feeHandler = await loadContract(feeHandlerName, feeHandlerAddress, wallet)

    await setNftChefPercent(feeHandler, feeHandlerName, vaultAddress, vaultNftChefPercent)
    await setNftChefPercent(feeHandler, feeHandlerName, referralRegisterAddress, referralRegisterNftChefPercent)
    await setNftChefPercent(feeHandler, feeHandlerName, lpSwapAddress, lpSwapNftChefPercent)
    // await setNftChefPercent(feeHandler, feeHandlerName, yieldSwapAddress, yielSwapNftChefPercent)

    print("done")
}    

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
 
