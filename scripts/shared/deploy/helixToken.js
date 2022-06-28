const { ethers } = require(`hardhat`)
const { print } = require("../utilities")

const deployHelixToken = async (deployer) => {
    print("deploy helix token")
    /*
    const ContractFactory = await ethers.getContractFactory('HelixToken')
    const contract = await ContractFactory.deploy()
    await contract.deployTransaction.wait()
    print(`helix token deployed to ${contract.address}`)
    */
}

module.exports = { deployHelixToken }
