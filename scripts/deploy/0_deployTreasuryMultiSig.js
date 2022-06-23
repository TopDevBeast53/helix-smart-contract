/*
 * @dev Deployment script treasury multisig contract
 *
 * Run from project root using:
 *     npx hardhat run scripts/0_deployTreasuryMultiSig.js --network rinkeby
 */

const { ethers } = require(`hardhat`)
const env = require("../constnat
const initials = require("../constants/contracts")

async function main() {
    const [deployer] = await ethers.getSigners()
    console.log(`Deployer address: ${deployer.address}`)

    console.log(`------ Start deploying treasury multisig ---------`)
    const ContractFactory = await ethers.getContractFactory('ConfigurableMultiSigWallet')
    const contract = await ContractFactory.deploy(
        owners,
        numConfirmationsRequired
    )
    await contract.deployTransaction.wait()
    console.log(`treasury multisig deployed to ${contract.address}`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
