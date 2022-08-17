const { run } = require(`hardhat`)
const { print, getChainId } = require("../../shared/utilities")

const initials = require("../../../constants/initials")
const contracts = require("../../../constants/contracts")

const verifyAirdropPaymentSplitter = async () => {
    const chainId = await getChainId()
    const airdropPaymentSplitterAddress = contracts.airdropPaymentSplitter[chainId]
    const payees = initials.AIRDROP_PAYMENT_SPLITTER_PAYEES[chainId]
    const shares = initials.AIRDROP_PAYMENT_SPLITTER_SHARES[chainId]

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
