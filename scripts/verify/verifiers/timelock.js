const { run } = require(`hardhat`)
const { print } = require("../../shared/utilities")

const env = require("../../../constants/env")
const initials = require("../../../constants/initials")
const contracts = require("../../../constants/contracts")

const timelockAddress = contracts.timelock[env.network]

const minDelay = initials.TIMELOCK_MIN_DELAY[env.network]
const proposers = initials.TIMELOCK_PROPOSERS[env.network]
const executors = initials.TIMELOCK_EXECUTORS[env.network]

const verifyTimelock = async () => {
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
