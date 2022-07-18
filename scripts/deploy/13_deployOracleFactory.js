/*
 * deploy Oracle Factory
 *
 * run from root:
 *     npx hardhat run scripts/deploy/13_deployOracleFactory.js --network
 */

const { ethers } = require(`hardhat`)
const { deployOracleFactory } = require("./deployers/deployers")

async function main() {
    const [deployer] = await ethers.getSigners()
    console.log(`Deployer address: ${deployer.address}`)
    await deployOracleFactory(deployer)
    console.log("done")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
