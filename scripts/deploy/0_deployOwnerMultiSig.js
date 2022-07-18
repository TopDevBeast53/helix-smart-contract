/*
 * @dev Deployment script owner multisig contract
 *
 * Run from project root using:
 *     npx hardhat run scripts/deploy/0_deployOwnerMultiSig.js --network
 */

const { ethers } = require(`hardhat`)
const { deployOwnerMultiSig } = require("./deployers/deployers")

async function main() {
    const [deployer] = await ethers.getSigners()
    console.log(`Deployer address: ${deployer.address}`)
    await deployOwnerMultiSig(deployer)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
