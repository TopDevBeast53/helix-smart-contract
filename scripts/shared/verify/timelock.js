const { ethers } = require(`hardhat`)
const { print } = require("../utilities")

const env = require("../../constants/env")
const initials = require("../../constants/initials")

const minDelay = initials.TIMELOCK_MIN_DELAY[env.network]
const proposers = initials.TIMELOCK_PROPOSERS[env.network]
const executors = initials.TIMELOCK_EXECUTORS[env.network]

const deployTimelock = async (deployer) => {
    print("deploy timelock")
    print(`minDelay: ${minDelay}`)
    print(`proposers: ${proposers}`)
    print(`executors: ${executors}`)

    /*
    const ContractFactory = await ethers.getContractFactory('TimelockController')
    const contract = await ContractFactory.deploy(
        minDelay,
        proposers,
        executors
    )
    await contract.deployTransaction.wait()
    print(`owner multisig deployed to ${contract.address}`)
    */
}

module.exports = { deployTimelock }
