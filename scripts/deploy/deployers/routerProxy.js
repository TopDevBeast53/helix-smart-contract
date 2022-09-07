const { ethers } = require(`hardhat`)
const { print, getChainId } = require("../../shared/utilities")

const initials = require("../../../constants/initials")
const contracts = require("../../../constants/contracts")

const deployRouterProxy = async (deployer) => {
    const chainId = await getChainId()
    const routerAddress = contracts.router[chainId]
    const partnerAddress = initials.ROUTER_PROXY_PARTNER[chainId]

    print("deploy routerProxy")
    print(`routerAddress: ${routerAddress}`)
    print(`partnerAddress: ${partnerAddress}`)

    const ContractFactory = await ethers.getContractFactory('RouterProxy')
    const contract = await ContractFactory.deploy(
        routerAddress,
        partnerAddress
    )
    await contract.deployTransaction.wait()
    print(`routerProxy deployed to ${contract.address}`)
}

module.exports = { deployRouterProxy }
