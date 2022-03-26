/*
 * @dev Deployment script for Oracle Factory contract.
 *
 * Run from project root using:
 *     npx hardhat run scripts/3_deployOracleFactory.js --network testnetBSC
 */

const { ethers } = require(`hardhat`)

const contracts = require('./constants/contracts')
const env = require('./constants/env')

const overrides = {
    gasLimit: 9999999
}

const factoryAddress = contracts.factory[env.network]

async function main() {
    const [deployer] = await ethers.getSigners()
    console.log(`Deployer address: ${deployer.address}`)

    // 1. Deploy the Oracle Factory
    console.log(`------ Start deploying Oracle -------`)

    const OracleFactory = await ethers.getContractFactory('OracleFactory')
    const oracleFactory = await OracleFactory.deploy(factoryAddress, overrides)
    await oracleFactory.deployTransaction.wait()
    
    console.log(`Oracle deployed to ${oracleFactory.address}`)

    // 2. Register the Oracle Factory with Factory
    //    Calls to createPair fail if Oracle Factory not registered
    console.log(`------ Register Oracle Factory with Factory ---------`)

    const Factory = await ethers.getContractFactory(`HelixFactory`)
    const factory = Factory.attach(factoryAddress)
    await factory.setOracleFactory(oracleFactory.address, overrides)

    console.log('Oracle Factory is registered with Factory')
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
