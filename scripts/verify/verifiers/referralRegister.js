const { run } = require(`hardhat`)
const { print, getChainId } = require("../../shared/utilities")

const contracts = require("../../../constants/contracts")

const verifyReferralRegister = async () => {
    const chainId = await getChainId()
    const referralRegisterAddress = contracts.referralRegisterImplementation[chainId]

    print("verify referral register")
    print(`referralRegisterAddress: ${referralRegisterAddress}`)

    await run(
        "verify:verify", {
            address: referralRegisterAddress,
        }
    )
}

module.exports = { verifyReferralRegister }
