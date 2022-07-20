const { run } = require(`hardhat`)
const { print } = require("../../shared/utilities")

const env = require("../../../constants/env")
const initials = require("../../../constants/initials")
const contracts = require("../../../constants/contracts")

const paymentSplitterAddress = contracts.paymentSplitter[env.network]

const payees = initials.PAYMENT_SPLITTER_PAYEES[env.network]
const shares = initials.PAYMENT_SPLITTER_SHARES[env.network]

const verifyPaymentSplitter = async () => {
    print("verify payment splitter")
    print(`paymentSplitterAddress ${paymentSplitterAddress}`)

    if (payees.length != shares.length) {
        print(`payees length (${payees.length}) != shares length (${shares.length})`)
        return
    }

    print("payees: shares")
    const length = payees.length
    for(let i = 0; i < length; i++) {
        print(`${payees[i]}: ${shares[i]}`)
    }

    await run(
        "verify:verify", {
            address: paymentSplitterAddress,
            constructorArguments: [
                payees,
                shares 
            ]
        }
    )
}

module.exports = { verifyPaymentSplitter }
