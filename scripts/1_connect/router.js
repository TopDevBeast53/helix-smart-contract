/* 
 * @dev Used to (re)build all required references for Router
 * 
 * Run from project root using:
 *     npx hardhat run scripts/1_connect/router.js --network ropsten
 */

const { ethers } = require(`hardhat`);
const { print, connectRouter } = require("../shared/utilities")

const env = require("./../constants/env")
const contracts = require("./../constants/contracts")
const names = require("./../constants/names")

const routerAddress = contracts.router[env.network]
const swapRewardsAddress = contracts.swapRewards[env.network]

const routerName = names.routerAddress

/// (Re)build any connections by calling this script"s contract"s setters
async function main() {
    const [wallet] = await ethers.getSigners()

    await connectRouter(routerName, routerAddress, wallet, swapRewardsAddress)

    print("done")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
