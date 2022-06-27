/* 
 * @dev Used to (re)build all required references for Helix Token
 * 
 * Run from project root using:
 *     npx hardhat run scripts/1_connect/helixToken.js --network ropsten
 */

const { ethers } = require(`hardhat`);
const { print, connectHelixToken } = require("../shared/utilities")

const env = require("../constants/env")
const contracts = require("../constants/contracts")
const names = require("../constants/names")

const helixTokenAddress = contracts.helixToken[env.network]
const referralRegisterAddress = contracts.referralRegister[env.network]
const vaultAddress = contracts.helixVault[env.network]
const masterChefAddress = contracts.masterChef[env.network]

const helixTokenName = names.helixTokenAddress

/// (Re)build any connections by calling this script"s contract"s setters
async function main() {
    const [wallet] = await ethers.getSigners()

    await connectHelixToken(
        helixTokenName, 
        helixTokenAddress,
        wallet,
        referralRegisterAddress,
        vaultAddress,
        masterChefAddress
    )

    print("done")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
