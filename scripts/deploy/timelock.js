/*
 * @dev Deployment script timelock contract
 *
 * Run from project root using:
 *     npx hardhat run scripts/deploy/3_deployTimelock.js --network ropsten
 */

const { ethers } = require(`hardhat`)
const { deployTimelock } = require("./deployers/deployers")

async function main() {
    const [deployer] = await ethers.getSigners()
    console.log(`Deployer address: ${deployer.address}`)
    await deployTimelock(deployer)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
