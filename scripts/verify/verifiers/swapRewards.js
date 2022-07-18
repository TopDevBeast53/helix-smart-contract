const { run } = require('hardhat')
const { print } = require("../../shared/utilities")

const env = require("../../../constants/env")
const contracts = require("../../../constants/contracts")

const swapRewardsAddress = contracts.swapRewards[env.network]

const helixTokenAddress = contracts.helixToken[env.network]
const oracleFactoryAddress = contracts.oracleFactory[env.network]
const referralRegisterAddress = contracts.referralRegister[env.network]
const routerAddress = contracts.router[env.network]

const verifySwapRewards = async () => {
    print('verify SwapRewards')
    print(`helixTokenAddress: ${helixTokenAddress}`)
    print(`oracleFactoryAddress: ${oracleFactoryAddress}`)
    print(`referralRegisterAddress: ${referralRegisterAddress}`)
    print(`routerAddress: ${routerAddress}`)

    await run(
        "verify:verify", {
            address: swapRewardsAddress,
            constructorArguments: [
                helixTokenAddress,
                oracleFactoryAddress,
                referralRegisterAddress,
                routerAddress
            ]
        }
    )
}

module.exports = { verifySwapRewards }
