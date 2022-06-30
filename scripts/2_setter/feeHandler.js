/**
 * @dev Run to set collector fee
 * 
 *      npx hardhat run scripts/2_setter/feeHandler.js --network ropsten
 */

const { ethers } = require("hardhat")
const { print, loadContract, setNftChefPercent } = require("../shared/utilities")

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

async function main() {
    const [wallet] = await ethers.getSigners()
    print(`load wallet: ${wallet.address}`)

    const feeHandler = await loadContract(feeHandlerName, feeHandlerAddress, wallet)

    await setNftChefPercent(feeHandlerAddress, feeHandlerName, vaultAddress, vaultNftChefPercent)
    await setNftChefPercent(feeHandlerAddress, feeHandlerName, referralRegisterAddress, referralRegisterNftChefPercent)

    print("done")
}    

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
 
