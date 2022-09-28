/**
 * deploy Master Chef
 *
 * run from root:
 *      npx hardhat run scripts/deploy/17_deployMasterChef.js --network
 */

const { ethers } = require(`hardhat`)
const { deployMasterChef } = require("./deployers/deployers")

async function main() {
    const [deployer] = await ethers.getSigners()
    console.log(`Deployer address: ${ deployer.address}`)
    await deployMasterChef(deployer)
    console.log(`done`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
