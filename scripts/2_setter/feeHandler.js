/**
 * @dev Run to set collector fee
 * 
 *      npx hardhat run scripts/2_setter/feeHandler.js --network ropsten
 */

const { ethers } = require("hardhat")
const { print, loadContract, setNftChefPercent } = require("../shared/utilities")

const contracts = require("../constants/contracts")
const initials = require("../constants/initials")
const env = require("../constants/env")

const feeHandlerName = "FeeHandler"

const feeHandlerAddress = contracts.feeHandler[env.network]

const feeHandlerNftChefPercent = initials.FEEHANDLER_NFTCHEF_PERCENT[env.network]

const verbose = true

async function main() {
    const [wallet] = await ethers.getSigners()
    print(`load wallet: ${wallet.address}`)

    const feeHandler = await loadContract(feeHandlerName, feeHandlerAddress, wallet)
    await setNftChefPercent(feeHandler, feeHandlerName, feeHandlerNftChefPercent)
}    

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
 
