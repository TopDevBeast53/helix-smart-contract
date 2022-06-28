/**
 * deploy Helix Factory
 *
 * run from root:
 *      npx hardhat run scripts/0_deploy/12_deployFactory.js --network ropsten
 */

const { ethers } = require("hardhat")
const { deployFactory } = require("../shared/deploy/deployers")

async function main() {
    const [deployer] = await ethers.getSigners()
    console.log(`Deployer address: ${deployer.address}`)
    await deployFactory(deployer)
    console.log('done')
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
