const { run } = require('hardhat')
const { print, getChainId } = require("../../shared/utilities")

const contracts = require("../../../constants/contracts")

const verifySwapRewards = async () => {
    const chainId = await getChainId()
    const swapRewardsAddress = contracts.swapRewards[chainId]
    const helixTokenAddress = contracts.helixToken[chainId]
    const oracleFactoryAddress = contracts.oracleFactory[chainId]
    const referralRegisterAddress = contracts.referralRegister[chainId]
    const routerAddress = contracts.router[chainId]

    print('verify SwapRewards')
    print(`swapRewardsAddress: ${swapRewardsAddress}`)
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
