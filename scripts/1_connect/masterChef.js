/* 
 * @dev Used to (re)build all required references for Master Chef
 * 
 * Run from project root using:
 *     npx hardhat run scripts/1_connect/masterChef.js --network ropsten
 */

const { ethers } = require(`hardhat`);
const { print, connectMasterChef } = require("../shared/utilities")

const env = require("../constants/env")
const contracts = require("../constants/contracts")
const names = require("../constants/names")

const masterChefAddress = contracts.masterChef[env.network]
const referralRegisterAddress = contracts.referralRegister[env.network]

const masterChefName = names.masterChefAddress

/// (Re)build any connections by calling this script"s contract"s setters
async function main() {
    const [wallet] = await ethers.getSigners()

    await connectMasterChef(masterChefName, masterChefAddress, wallet, referralRegisterAddress)
    
    print("done")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
