const { run } = require(`hardhat`)
const { print } = require("../../shared/utilities")

const contracts = require("../../../constants/contracts")
const env = require("../../../constants/env")

const referralRegisterAddress = contracts.referralRegisterImplementation[env.network]

const verifyReferralRegister = async () => {
    print("verify referral register")
    print(`referralRegisterAddress: ${referralRegisterAddress}`)

    await run(
        "verify:verify", {
            address: referralRegisterAddress,
        }
    )
}

module.exports = { verifyReferralRegister }
