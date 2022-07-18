const { run } = require("hardhat")
const { print } = require("../utilities")

const env = require("../../constants/env")
const contracts = require("../../constants/contracts")
const addresses = require("../../constants/addresses")

const routerAddress = contracts.router[env.network]

const factoryAddress = contracts.factory[env.network]
const wethAddress = addresses.WETH[env.network]

const verifyRouter = async () => {
    print("verify router")
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
