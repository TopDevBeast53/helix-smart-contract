const { ethers } = require(`hardhat`)
const { print } = require("../utilities")

const deployMulticall = async (deployer) => {
    print("deploy multicall")
    const Multicall2 = await ethers.getContractFactory(`Multicall2`)
    let contract = await Multicall2.deploy()
    await contract.deployTransaction.wait()
    print(`Multicall2 deployed to ${contract.address}`)
}

module.exports = { deployMulticall } 
