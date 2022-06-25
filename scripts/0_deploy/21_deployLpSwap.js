/*
 * @dev Deployment script for LP Swap contract.
 *
 * Run from project root using:
 *     npx hardhat run scripts/deploy/21_deployLpSwap.js --network ropsten
 */

// Define script parameters
const { ethers } = require(`hardhat`)

async function main() {
    const [deployer] = await ethers.getSigners()
    console.log(`Deployer address: ${deployer.address}\n`)
    
    console.log(`Deploy LP Swap`)
    const ContractFactory = await ethers.getContractFactory('LpSwap')
    const contract = await upgrades.deployProxy(ContractFactory, [])     
    await contract.deployTransaction.wait()
    console.log(`LP Swap deployed to ${contract.address}`)

    const implementationAddress = await upgrades.erc1967.getImplementationAddress(
        contract.address
    )
    console.log(`Implementation address: ${implementationAddress}`)

    console.log(`Remember to save this address to ./scripts/constants/contracts.js\n`)

    console.log('Done')
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
