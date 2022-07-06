/*
 * deploy Swap Rewards
 * 
 * run from root: 
 *      npx hardhat run scripts/deploy/16_deploySwapRewards.js --network ropsten
 */

const { ethers } = require('hardhat')
const { print } = require("../utilities")

const env = require("../../constants/env")
const contracts = require("../../constants/contracts")

const helixTokenAddress = contracts.helixToken[env.network]
const oracleFactoryAddress = contracts.oracleFactory[env.network]
const referralRegisterAddress = contracts.referralRegister[env.network]
const routerAddress = contracts.router[env.network]

const deploySwapRewards = async (deployer) => {
    print('Deploy SwapRewards')
    print(`helixTokenAddress: ${helixTokenAddress}`)
    print(`oracleFactoryAddress: ${oracleFactoryAddress}`)
    print(`referralRegisterAddress: ${referralRegisterAddress}`)
    print(`routerAddress: ${routerAddress}`)

    const contractFactory = await ethers.getContractFactory('SwapRewards')
    const contract = await contractFactory.deploy(
        helixTokenAddress,
        oracleFactoryAddress,
        referralRegisterAddress,
        routerAddress
    )
    await contract.deployTransaction.wait()

    print(`swapRewards deployed to ${contract.address}`)
}

module.exports = { deploySwapRewards }
