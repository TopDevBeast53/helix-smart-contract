const { ethers } = require(`hardhat`)
const { print } = require("../../shared/utilities")

const deploySynthToken = async (deployer) => {
    print("deploy synth token")
    const ContractFactory = await ethers.getContractFactory('SynthToken')
    const contract = await ContractFactory.deploy()
    await contract.deployTransaction.wait()
    print(`synth token deployed to ${contract.address}`)
}

module.exports = { deploySynthToken }
