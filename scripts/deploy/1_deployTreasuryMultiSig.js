/*
 * @dev Deployment script treasury multisig contract
 *
 * Run from project root using:
 *     npx hardhat run scripts/deploy/1_deployTreasuryMultiSig.js --network
 */

const { ethers } = require(`hardhat`)
const { deployTreasuryMultiSig } = require("./deployers/deployers")

async function main() {
    const [deployer] = await ethers.getSigners()
    console.log(`Deployer address: ${deployer.address}`)
    await deployTreasuryMultiSig(deployer)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
