const { ethers } = require(`hardhat`)
const { print, getChainId } = require("../../shared/utilities")

const initials = require("../../../constants/initials")

const deployTimelock = async (deployer) => {
    const chainId = await getChainId()
    const minDelay = initials.TIMELOCK_MIN_DELAY[chainId]
    const proposers = initials.TIMELOCK_PROPOSERS[chainId]
    const executors = initials.TIMELOCK_EXECUTORS[chainId]

    print("deploy timelock")
    print(`minDelay: ${minDelay}`)
    print(`proposers: ${proposers}`)
    print(`executors: ${executors}`)

    const ContractFactory = await ethers.getContractFactory('TimelockController')
    const contract = await ContractFactory.deploy(
        minDelay,
        proposers,
        executors
    )
    await contract.deployTransaction.wait()
    print(`timelock deployed to ${contract.address}`)
}

module.exports = { deployTimelock }
