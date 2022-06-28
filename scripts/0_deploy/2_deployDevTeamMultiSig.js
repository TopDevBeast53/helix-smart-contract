/*
 * @dev Deployment script devTeam multisig contract
 *
 * Run from project root using:
 *     npx hardhat run scripts/0_deploy/2_deployDevTeamMultiSig.js --network ropsten
 */

const { ethers } = require(`hardhat`)
const { deployDevTeamMultiSig } = require("../shared/deploy/deployers")

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
