/*
 * @dev Deployment script for Test Token contract.
 *
 * Run from project root using:
 *     npx hardhat run scripts/0_deploy/deployTestToken.js --network ropsten
 */

const { ethers } = require(`hardhat`)
const { deployTestToken } = require("../shared/deploy/deployers")

async function main() {
    const [deployer] = await ethers.getSigners()
    console.log(`Deployer address: ${deployer.address}`)
    await deployTestToken(deployer)
    console.log("done")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
