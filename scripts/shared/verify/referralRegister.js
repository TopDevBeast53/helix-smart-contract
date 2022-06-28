const { run } = require(`hardhat`)
const { print } = require("../utilities")

const contracts = require("../../constants/contracts")
const env = require("../../constants/env")

const referralRegisterAddress = contracts.referralRegisterImplementation[env.network]

const verifyReferralRegister = async () => {
    print("verify referral register")

    await run(
        "verify:verify", {
            address: referralRegisterAddress,
        }
    )
}

module.exports = { verifyReferralRegister }
