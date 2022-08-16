const { ethers } = require(`hardhat`)
const { print, getChainId } = require("../../shared/utilities")

const initials = require("../../../constants/initials")

const deployPaymentSplitter = async (deployer) => {
    const chainId = await getChainId()
    const payees = initials.PAYMENT_SPLITTER_PAYEES[chainId]
    const shares = initials.PAYMENT_SPLITTER_SHARES[chainId]

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
