/**
 * deploy FeeHandler
 * 
 * run from root:
 *      npx hardhat run scripts/deploy/9_deployFeeHandler.js --network
 */

const { ethers } = require("hardhat")
const { deployFeeHandler } = require("./deployers/deployers")

async function main() {
    const [deployer] = await ethers.getSigners()
    console.log(`Deployer address: ${deployer.address}`)
    await deployFeeHandler(deployer)
    console.log('done')
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
