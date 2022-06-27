/* 
 * @dev Used to transfer timelock ownership of all contracts with timelock owners
 * 
 * Run from project root using:
 *     npx hardhat run scripts/3_transfer/0_transferAllTimelockOwner.js --network ropsten
 */

const verbose = true

const { ethers } = require("hardhat");
const { print, loadContract, transferTimelockOwnership } = require("../shared/utilities")

const env = require("./../constants/env")
const contracts = require("./../constants/contracts")

/// Address of the timelock owner contract
const timelockAddress = contracts.timelock[env.network]

const feeMinterAddress = contracts.feeMinter[env.network]
const feeHandlerAddress = contracts.feeHandler[env.network]
const referralRegisterAddress = contracts.referralRegister[env.network]
const vaultAddress = contracts.helixVault[env.network]
const masterChefAddress = contracts.masterChef[env.network]
const autoHelixAddress = contracts.autoHelix[env.network]

const feeMinterName = "FeeMinter"
const feeHandlerName = "FeeHandler"
const referralRegisterName = "ReferralRegister"
const vaultName = "HelixVault"
const masterChefName = "MasterChef"
const autoHelixName = "AutoHelix"

/// Transfer ownership of the contract to multiSig/timelock 
async function main() {
    const [wallet] = await ethers.getSigners()

    const feeMinter = await loadContract(feeMinterName, feeMinterAddress, wallet) 
    await transferTimelockOwnership(feeMinter, feeMinterName, timelockAddress)

    const feeHandler = await loadContract(feeHandlerName, feeHandlerAddress, wallet) 
    await transferTimelockOwnership(feeHandler, feeHandlerName, timelockAddress)

    const referralRegister = await loadContract(referralRegisterName, referralRegisterAddress, wallet) 
    await transferTimelockOwnership(referralRegister, referralRegisterName, timelockAddress)

    const vault = await loadContract(vaultName, vaultAddress, wallet) 
    await transferTimelockOwnership(vault, vaultName, timelockAddress)

    const masterChef = await loadContract(masterChefName, masterChefAddress, wallet) 
    await transferTimelockOwnership(masterChef, masterChefName, timelockAddress)

    const autoHelix = await loadContract(autoHelixName, autoHelixAddress, wallet) 
    await transferTimelockOwnership(autoHelix, autoHelixName, timelockAddress)

    print("done")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
