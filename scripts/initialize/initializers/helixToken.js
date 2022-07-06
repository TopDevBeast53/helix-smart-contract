const { ethers } = require(`hardhat`)
const { print, loadContract, getContractName } = require("../../shared/utilities")
const { addMinter } = require("../../setter/setters/setters")

const env = require('../../../constants/env')
const contracts = require('../../../constants/contracts')

const masterChefAddress = contracts.masterChef[env.network]
const referralRegisterAddress = contracts.referralRegister[env.network]
const helixVaultAddress = contracts.helixVault[env.network]
const helixTokenAddress = contracts.helixToken[env.network]

const initializeHelixToken = async (wallet) => {
    print("initialize the helix token contract") 
    const helixToken = await loadContract(helixTokenAddress, wallet)
    await addMinter(helixToken, referralRegisterAddress)
    await addMinter(helixToken, vaultAddress)
    await addMinter(helixToken, masterChefAddress)
}

module.exports = { initializeHelixToken }
