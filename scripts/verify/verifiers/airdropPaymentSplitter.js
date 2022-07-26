const { run } = require(`hardhat`)
const { print } = require("../../shared/utilities")

const env = require("../../../constants/env")
const initials = require("../../../constants/initials")
const contracts = require("../../../constants/contracts")

const airdropPaymentSplitterAddress = contracts.airdropPaymentSplitter[env.network]

const payees = initials.AIRDROP_PAYMENT_SPLITTER_PAYEES[env.network]
const shares = initials.AIRDROP_PAYMENT_SPLITTER_SHARES[env.network]

const verifyAirdropPaymentSplitter = async () => {
    print("verify airdrop payment splitter")
    print(`airdropPaymentSplitterAddress ${airdropPaymentSplitterAddress}`)

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
            address: airdropPaymentSplitterAddress,
            constructorArguments: [
                payees,
                shares 
            ]
        }
    )
}

module.exports = { verifyAirdropPaymentSplitter }
