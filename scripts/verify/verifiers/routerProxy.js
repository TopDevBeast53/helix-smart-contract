const { run } = require(`hardhat`)
const { print, getChainId } = require("../../shared/utilities")

const initials = require("../../../constants/initials")
const contracts = require("../../../constants/contracts")

const verifyRouterProxy = async () => {
    const chainId = await getChainId()
    const routerProxyAddress = contracts.routerProxy[chainId]
    const routerAddress = contracts.router[chainId]
    const partnerAddress = initials.ROUTER_PROXY_PARTNER[chainId]

    print("verify routerProxy")
    print(`routerProxyAddress: ${routerProxyAddress}`)
    print(`routerAddress: ${routerAddress}`)
    print(`partnerAddress: ${partnerAddress}`)

    await run(
        "verify:verify", {
            address: routerProxyAddress,
            constructorArguments: [
                routerAddress,
                partnerAddress,
            ]
        }
    )
}

module.exports = { verifyRouterProxy }
