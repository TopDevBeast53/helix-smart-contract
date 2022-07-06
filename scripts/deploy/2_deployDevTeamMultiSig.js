/*
 * @dev Deployment script devTeam multisig contract
 *
 * Run from project root using:
 *     npx hardhat run scripts/deploy/2_deployDevTeamMultiSig.js --network
 */

const { ethers } = require(`hardhat`)
const { deployDevTeamMultiSig } = require("./deployers/deployers")

async function main() {
    const [deployer] = await ethers.getSigners()
    console.log(`Deployer address: ${deployer.address}`)
    await deployDevTeamMultiSig(deployer)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
