// Export functions used by scripts

const { ethers } = require("hardhat")

const verbose = true;

const env = require("../constants/env")
const contracts  = require("../constants/contracts")

const overrides = {
    gasLimit: 9999999
}

// Print the given string if verbose is true and do nothing otherwise
const print = (str) => {
    if (verbose) console.log(str)
}

// Return the contract from address with wallet connected
const loadContract = async (address, wallet) => {
    const name = getContractName(address)
    print(`load contract ${name} from ${address}`)
    const contractFactory = await ethers.getContractFactory(name)
    const contract = contractFactory.attach(address).connect(wallet)
    return contract
}

// Return the encoded function data for calling the function with arguments
const getEncodedFunctionData = (contract, functionName, arguments) => {
    let contractName = isAddress(contract) ? getContractName(contract) : contract
    const stringArgs = getCommaSeparatedString(arguments)
    print(`get the encoded function data to call ${contractName}.${functionName}(${stringArgs})`)

    const contractJson = require(`../../build/contracts/${contractName}.json`)
    const contractAbi = contractJson.abi
    const contractInterface = new ethers.utils.Interface(contractAbi)

    return contractInterface.encodeFunctionData(functionName, arguments)
}

// Return true if the string is an address and false otherwise
const isAddress = (str) => {
    if (str.length != 42) {
        return false
    }
    if (str.slice(0, 2) != "0x") {
        return false
    }
    return true
}

// Return the array as a comma separated string
const getCommaSeparatedString = (array) => {
    str = ""
    for (let i = 0; i < array.length; i++) {
        if (i > 0) {
            str += ", "
        }
        str += array[i]
    }
    return str
}

// Return the name of the contract at address
const getContractName = (address) => {
    switch (address) {
        case contracts.ownerMultiSig[env.network]:
           return "MultiSigWallet"
        case contracts.treasuryMultiSig[env.network]:
            return "TokenMultiSigWallet"
        case contracts.devTeamMultiSig[env.network]:
            return "TokenMultiSigWallet"
        case contracts.timelock[env.network]:
            return "TimelockController"
        case contracts.helixToken[env.network]:
            return "HelixToken"
        case contracts.helixNFT[env.network]:
            return "HelixNFT"
        case contracts.helixNFTImplementation[env.network]:
            return "HelixNFT"
        case contracts.feeMinter[env.network]:
            return "FeeMinter"
        case contracts.helixNFTBridge[env.network]:
            return "HelixNFTBridge"
        case contracts.helixChefNFT[env.network]:
            return "HelixChefNFT"
        case contracts.helixChefNFTImplementation[env.network]:
            return "HelixChefNFT"
        case contracts.feeHandler[env.network]:
            return "FeeHandler"
        case contracts.feeHandlerImplementation[env.network]:
            return "FeeHandler"
        case contracts.referralRegister[env.network]:
            return "ReferralRegister"
        case contracts.referralRegisterImplementation[env.network]:
            return "ReferralRegister"
        case contracts.helixVault[env.network]:
            return "HelixVault"
        case contracts.helixVaultImplementation[env.network]:
            return "HelixVault"
        case contracts.factory[env.network]:
            return "HelixFactory"
        case contracts.factoryImplementation[env.network]:
            return "HelixFactory"
        case contracts.oracleFactory[env.network]:
            return "OracleFactory"
        case contracts.oracleFactoryImplementation[env.network]:
            return "OracleFactory"
        case contracts.router[env.network]:
            return "HelixRouterV1"
        case contracts.helixMigrator[env.network]:
            return "HelixMigrator"
        case contracts.swapRewards[env.network]:
            return "SwapRewards"
        case contracts.masterChef[env.network]:
            return "MasterChef"
        case contracts.masterChefImplementation[env.network]:
            return "MasterChef"
        case contracts.autoHelix[env.network]:
            return "AutoHelix"
        case contracts.autoHelixImplementation[env.network]:
            return "AutoHelix"
        case contracts.multicall[env.network]:
            return "Multicall"
        case contracts.airDrop[env.network]:
            return "AirDrop"
        case contracts.yieldSwap[env.network]:
            return "YieldSwap"
        case contracts.yieldSwapImplementation[env.network]:
            return "YieldSwap"
        case contracts.lpSwap[env.network]:
            return "LpSwap"
        case contracts.lpSwapImplementation[env.network]:
            return "LpSwap"
        default:
            throw "Error: contract not found"
            return
    }
}

module.exports = {
    verbose,
    overrides,
    print,
    loadContract,
    getContractName,
    getCommaSeparatedString,
    getEncodedFunctionData,
}
