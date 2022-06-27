/* 
 * @dev Used to (re)build all required references for Helix Factory
 * 
 * Run from project root using:
 *     npx hardhat run scripts/1_connect/factory.js --network ropsten
 */

const { ethers } = require(`hardhat`)
const { print, connectFactory } = require("../shared/utilities")

const env = require('./../constants/env')
const contracts = require('./../constants/contracts')

const factoryAddress = contracts.factory[env.network]
const oracleFactoryAddress = contracts.oracleFactory[env.network]

const factoryName = 'HelixFactory'

/// (Re)build any connections by calling this script's contract's setters
async function main() {
    const [wallet] = await ethers.getSigners()

    await connectFactory(factoryName, factoryAddress, wallet, oracleFactoryAddress)

    print('done')
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
