/**
 * deploy FeeHandler
 * 
 * run from root:
 *      npx hardhat run scripts/0_deploy/9_deployFeeHandler.js --network rinkeby
 *      npx hardhat run scripts/0_deploy/9_deployFeeHandler.js --network ropsten
 */

const { ethers } = require("hardhat")
const { deployFeeHandler } = require("../shared/deploy/deployers")

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
