const { run } = require(`hardhat`)
const { print, getChainId } = require("../../shared/utilities")

const initials = require("../../../constants/initials")
const contracts = require("../../../constants/contracts")

const verifyTimelock = async () => {
    const chainId = await getChainId()
    const timelockAddress = contracts.timelock[chainId]
    const minDelay = initials.TIMELOCK_MIN_DELAY[chainId]
    const proposers = contracts.ownerMultiSig[chainId]
    const executors = initials.TIMELOCK_EXECUTORS[chainId]

    print("verify timelock")
    print(`timelockAddress: ${timelockAddress}`)
    print(`minDelay: ${minDelay}`)
    print(`proposers: ${proposers}`)
    print(`executors: ${executors}`)

    await run(
        "verify:verify", {
            address: timelockAddress,
            constructorArguments: [
                minDelay,
                proposers,
                executors
            ]
        }
    )
}

module.exports = { verifyTimelock }
