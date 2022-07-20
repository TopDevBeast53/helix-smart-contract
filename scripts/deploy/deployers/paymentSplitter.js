const { ethers } = require(`hardhat`)
const { print } = require("../../shared/utilities")

const env = require("../../../constants/env")
const initials = require("../../../constants/initials")

const payees = initials.PAYMENT_SPLITTER_PAYEES[env.network]
const shares = initials.PAYMENT_SPLITTER_SHARES[env.network]

const deployPaymentSplitter = async (deployer) => {
    print("deploy payment splitter")

    if (payees.length != shares.length) {
        print(`payees length (${payees.length}) != shares length (${shares.length})`)
        return
    }

    print("payees: shares")
    const length = payees.length
    for (let i = 0; i < length; i++) {
        print(`${payees[i]}: ${shares[i]}`) 
    }

    const ContractFactory = await ethers.getContractFactory('PaymentSplitter')
    const contract = await ContractFactory.deploy(payees, shares)
    await contract.deployTransaction.wait()
    print(`payment splitter deployed to ${contract.address}`)
}

module.exports = { deployPaymentSplitter }
