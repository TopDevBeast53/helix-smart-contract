const { ethers } = require(`hardhat`)
const { print, getChainId } = require("../../shared/utilities")

const initials = require("../../../constants/initials")

const deployAirdropPaymentSplitter = async (deployer) => {
    const chainId = await getChainId()
    const payees = initials.AIRDROP_PAYMENT_SPLITTER_PAYEES[chainId]
    const shares = initials.AIRDROP_PAYMENT_SPLITTER_SHARES[chainId]

    print("deploy airdrop payment splitter")

    if (payees.length == 0) {
        print(`payees length must not be zero`)
        return
    }
    if (payees.length != shares.length) {
        print(`payees length (${payees.length}) != shares length (${shares.length})`)
        return
    }

    print("payees: shares")
    const length = payees.length
    for (let i = 0; i < length; i++) {
        print(`${payees[i]}: ${shares[i]}`) 
    }
    print(`length: ${payees.length}`)

    const ContractFactory = await ethers.getContractFactory('AirdropPaymentSplitter')
    const contract = await ContractFactory.deploy(payees, shares)
    await contract.deployTransaction.wait()
    print(`airdrop payment splitter deployed to ${contract.address}`)
}

module.exports = { deployAirdropPaymentSplitter }
