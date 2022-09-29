/*
 * @dev Deployment script for Air Drop contract.
 *
 * Run from project root using:
 *     npx hardhat run scripts/0_deploy/deployAirDrop.js --network ropsten
 */


// Define script parameters
const { ethers } = require(`hardhat`)
const { deployAirDrop } = require("./deployers/deployers")

async function main() {
    const [deployer] = await ethers.getSigners()
    console.log(`Deployer address: ${deployer.address}`)
    await deployAirDrop(deployer)
    console.log('Done')
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
