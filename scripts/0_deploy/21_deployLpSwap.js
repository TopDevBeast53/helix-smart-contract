/*
 * @dev Deployment script for LP Swap contract.
 *
 * Run from project root using:
 *     npx hardhat run scripts/0_deploy/21_deployLpSwap.js --network rinkeby
 *     npx hardhat run scripts/0_deploy/21_deployLpSwap.js --network ropsten
 */

const { ethers } = require(`hardhat`)
const { deployLpSwap } = require("../shared/deploy/deployers")

async function main() {
    const [deployer] = await ethers.getSigners()
    console.log(`Deployer address: ${deployer.address}`)
    await deployLpSwap(deployer)
    console.log('done')
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
