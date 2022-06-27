/* 
 * @dev Used to (re)build all required references for Helix Factory
 * 
 * Run from project root using:
 *     npx hardhat run scripts/1_connect/factory.js --network ropsten
 */

const verbose = true

const { ethers } = require(`hardhat`)
const { print, loadContract, setOracleFactory } = require("../shared/utilities")

const env = require('./../constants/env')
const contracts = require('./../constants/contracts')

/// Wallet making the transactions in this script
let wallet

/// The contract whose setters are being called by this script
let contract

const factoryAddress = contracts.factory[env.network]
const oracleFactoryAddress = contracts.oracleFactory[env.network]

const factoryName = 'HelixFactory'

/// (Re)build any connections by calling this script's contract's setters
async function main() {
    const [wallet] = await ethers.getSigners()

    await connectFactory()

    print('done')
}

async function connectFactory(wallet) {
    const factory = await loadContract(factoryName, factoryAddress, wallet)

    await setOracleFactory(factory, factoryName, oracleFactoryAddress)
}

module.exports.connectFactory = async (wallet) => {
    await connectFactory(wallet)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
