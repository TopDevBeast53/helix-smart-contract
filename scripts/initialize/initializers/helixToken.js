const { ethers } = require(`hardhat`)
const { print, loadContract, getChainId } = require("../../shared/utilities")
const { addMinter } = require("../../shared/setters/setters")

const contracts = require('../../../constants/contracts')

const initializeHelixToken = async (wallet) => {
    const chainId = await getChainId()
    const masterChefAddress = contracts.masterChef[env.network]
    const referralRegisterAddress = contracts.referralRegister[env.network]
    const vaultAddress = contracts.helixVault[env.network]
    const helixTokenAddress = contracts.helixToken[env.network]

    print("initialize the helix token contract") 
    const helixToken = await loadContract(helixTokenAddress, wallet)
    await addMinter(helixToken, referralRegisterAddress)
    await addMinter(helixToken, vaultAddress)
    await addMinter(helixToken, masterChefAddress)
}

module.exports = { initializeHelixToken }
