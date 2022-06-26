/* 
 * Set the Fee Collector percents for the contracts that are Fee Collectors
 * 
 * Run from project root using:
 *     npx hardhat run scripts/2_setter/setFeeCollectorPercents.js --network ropsten
 */

const { ethers } = require(`hardhat`);
const { print, loadContract, setCollectorPercent } = require("../shared/utilities")

const env = require('./../constants/env')
const contracts = require('./../constants/contracts')
const initials = require('./../constants/initials')

const referralRegisterName = "ReferralRegister"
const yieldSwapName = "YieldSwap"
const lpSwapName = "LpSwap"
const vaultName = "HelixVault"

const referralRegisterAddress = contracts.referralRegister[env.network]
const yieldSwapAddress = contracts.yieldSwap[env.network]
const lpSwapAddress = contracts.lpSwap[env.network]
const vaultAddress = contracts.helixVault[env.network]

const referralRegisterCollectorPercent = initials.REFERRAL_COLLECTOR_PERCENT[env.network]
const yieldSwapCollectorPercent = initials.YIELD_SWAP_COLLECTOR_PERCENT[env.network]
const lpSwapCollectorPercent = initials.LP_SWAP_COLLECTOR_PERCENT[env.network]
const vaultCollectorPercent = initials.HELIX_VAULT_COLLECTOR_PERCENT[env.network]

const verbose = true

/// Set the collector percents on the fee handler contracts
async function main() {
    // Load the wallet
    const [wallet] = await ethers.getSigners()
    print(`load wallet: ${wallet.address}`)

    const referralRegister = await loadContract(referralRegisterName, referralRegisterAddress, wallet)
    await setCollectorPercent(referralRegister, referralRegisterName, referralRegisterCollectorPercent)

    const yieldSwap = await loadContract(yieldSwapName, yieldSwapAddress, wallet)
    await setCollectorPercent(yieldSwap, yieldSwapName, yieldSwapCollectorPercent)

    const lpSwap = await loadContract(lpSwapName, lpSwapAddress, wallet)
    await setCollectorPercent(lpSwap, lpSwapName, lpSwapCollectorPercent)

    const vault = await loadContract(vaultName, vaultAddress, wallet)
    await setCollectorPercent(vault, vaultName, vaultCollectorPercent)

    print('done')
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
