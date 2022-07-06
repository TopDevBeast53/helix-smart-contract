const { ethers } = require(`hardhat`)
const { print } = require("../../shared/utilities")

const env = require('../../../constants/env')
const contracts = require('../../../constants/contracts')
const initials = require('../../../constants/initials')

const tokenAddress = initials.AIRDROP_TOKEN[env.network]               // HELIX / tokenB
const name = initials.AIRDROP_NAME[env.network]
const withdrawPhaseDuration = initials.AIRDROP_WITHDRAW_PHASE_DURATION[env.network]

// Define contract settings
const initialBalance = initials.AIRDROP_INITIAL_BALANCE[env.network]

const deployAirDrop = async (deployer) => {
    print(`Deploy Air Drop`)
    print(`tokenAddress: ${tokenAddress}`)
    print(`name: ${name}`)
    print(`withdrawPhaseDuration: ${withdrawPhaseDuration}`)

    const ContractFactory = await ethers.getContractFactory('AirDrop')
    const contract = await ContractFactory.deploy(
        name,
        tokenAddress,
        withdrawPhaseDuration
    )     
    await contract.deployTransaction.wait()
    print(`Air Drop deployed to ${contract.address}`)

    /*
    // Send funds of outputToken to the contract
    const IToken = await ethers.getContractFactory('TestToken')
    token = await IToken.attach(tokenAddress).connect(deployer) 

    print(`Send ${initialBalance} tokens to airdrop`)
    // Add zeros since token has 18 decimals
    await token.transfer(contract.address, initialBalance.toString() + '000000000000000000')
    */
}

module.exports = { deployAirDrop } 
