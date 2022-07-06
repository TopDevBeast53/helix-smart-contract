/*
 * @dev Deployment script owner multisig contract
 *
 * Run from project root using:
 *     npx hardhat run scripts/0_deploy/0_deployOwnerMultiSig.js --network rinkeby
 *     npx hardhat run scripts/0_deploy/0_deployOwnerMultiSig.js --network ropsten
 */

const { ethers } = require(`hardhat`)
const { deployOwnerMultiSig } = require("../shared/deploy/deployers")

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
