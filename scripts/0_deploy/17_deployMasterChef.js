/**
 * deploy Master Chef
 *
 * run from root:
 *      npx hardhat run scripts/0_deploy/17_deployMasterChef.js --network ropsten
 */

const { ethers } = require(`hardhat`)
const { deployMasterChef } = require("../shared/deploy/deployers")

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
