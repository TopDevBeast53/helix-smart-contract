/*
 * deploy Router
 * 
 * run from root:
 *      npx hardhat run scripts/deploy/14_deployRouter.js --network
 */

const { ethers } = require("hardhat")
const { deployRouter } = require("./deployers/deployers")

async function main() {
    const [deployer] = await ethers.getSigners()
    console.log(`Deployer address: ${deployer.address}`)
    await deployRouter(deployer)
    console.log(`done`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
