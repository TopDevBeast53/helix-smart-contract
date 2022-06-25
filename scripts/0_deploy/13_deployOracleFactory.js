/*
 * deploy Oracle Factory
 *
 * run from root:
 *     npx hardhat run scripts/deploy/13_deployOracleFactory.js --network ropsten
 */

const { ethers, upgrades } = require(`hardhat`)
const contracts = require('../constants/contracts')
const env = require('../constants/env')

const factoryAddress = contracts.factory[env.network]

async function main() {
    const [deployer] = await ethers.getSigners()
    console.log(`Deployer address: ${deployer.address}`)

    // 1. Deploy the Oracle Factory
    console.log(`------ Start deploying Oracle Factory -------`)

    const OracleFactory = await ethers.getContractFactory('OracleFactory')
    const oracleFactory = await upgrades.deployProxy(OracleFactory, [factoryAddress])
    await oracleFactory.deployTransaction.wait()
    
    console.log(`Oracle Factory proxy deployed to ${oracleFactory.address}`)

    const implementationAddress = await upgrades.erc1967.getImplementationAddress(
        oracleFactory.address
    )
    console.log(`Implementation address: ${implementationAddress}`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
