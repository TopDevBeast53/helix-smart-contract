const { run } = require("hardhat")
const { print, getChainId } = require("../../shared/utilities")

const contracts = require("../../../constants/contracts")
const addresses = require("../../../constants/addresses")

const verifyRouter = async () => {
    const chainId = await getChainId()
    const routerAddress = contracts.router[chainId]
    const factoryAddress = contracts.factory[chainId]
    const wethAddress = addresses.WETH[chainId]

    print("verify router")
    print(`routerAddress: ${routerAddress}`)
    print(`factory address: ${factoryAddress}`)
    print(`weth address: ${wethAddress}`)

    await run(
        "verify:verify", {
            address: routerAddress,
            constructorArguments: [
                factoryAddress,
                wethAddress
            ]
        }
    )
}

module.exports = { verifyRouter }
