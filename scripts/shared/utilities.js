// Export functions used by scripts

const { ethers, network } = require("hardhat")

const verbose = true;

const env = require("../../constants/env")
const contracts  = require("../../constants/contracts")

const overrides = {
    gasLimit: 9999999
}

// Print the given string if verbose is true and do nothing otherwise
const print = (str) => {
    if (verbose) console.log(str)
}

// Return the contract from address with wallet connected
const loadContract = async (address, wallet) => {
    const name = await getContractName(address)
    print(`load contract ${name} from ${address}`)
    const contractFactory = await ethers.getContractFactory(name)
    const contract = contractFactory.attach(address).connect(wallet)
    return contract
}

// Return the encoded function data for calling the function with arguments
const getEncodedFunctionData = (contract, functionName, arguments) => {
    let contractName = isAddress(contract) ? getContractName(contract) : contract
    let contractFolder = getContractEnclosingFolder(contractName)
    const stringArgs = getCommaSeparatedString(arguments)
    print(`get the encoded function data to call ${contractName}.${functionName}(${stringArgs})`)

    const contractJson = require(
        `../../artifacts/contracts/${contractFolder}/${contractName}.sol/${contractName}.json`
    )
    const contractAbi = contractJson.abi
    const contractInterface = new ethers.utils.Interface(contractAbi)

    return contractInterface.encodeFunctionData(functionName, arguments)
}

// Return the current chainId
const getChainId = async () => {
    let chainId = network.config.chainId

    // Get the chainId from the provider if it can't be accessed directly
    if (chainId === undefined) {
        const url = network.config.url
        const provider = new ethers.providers.JsonRpcProvider(url)
        chainId = (await provider.getNetwork()).chainId
    }

    return chainId
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
const getContractName = async (address) => {
    const chainId = await getChainId()
    switch (address) {
        case contracts.ownerMultiSig[chainId]:
           return "MultiSigWallet"
        case contracts.treasuryMultiSig[chainId]:
            return "TokenMultiSigWallet"
        case contracts.devTeamMultiSig[chainId]:
            return "TokenMultiSigWallet"
        case contracts.timelock[chainId]:
            return "TimelockController"
        case contracts.helixToken[chainId]:
            return "HelixToken"
        case contracts.helixNFT[chainId]:
            return "HelixNFT"
        case contracts.helixNFTImplementation[chainId]:
            return "HelixNFT"
        case contracts.feeMinter[chainId]:
            return "FeeMinter"
        case contracts.helixNFTBridge[chainId]:
            return "HelixNFTBridge"
        case contracts.helixChefNFT[chainId]:
            return "HelixChefNFT"
        case contracts.helixChefNFTImplementation[chainId]:
            return "HelixChefNFT"
        case contracts.feeHandler[chainId]:
            return "FeeHandler"
        case contracts.feeHandlerImplementation[chainId]:
            return "FeeHandler"
        case contracts.referralRegister[chainId]:
            return "ReferralRegister"
        case contracts.referralRegisterImplementation[chainId]:
            return "ReferralRegister"
        case contracts.helixVault[chainId]:
            return "HelixVault"
        case contracts.helixVaultImplementation[chainId]:
            return "HelixVault"
        case contracts.factory[chainId]:
            return "HelixFactory"
        case contracts.factoryImplementation[chainId]:
            return "HelixFactory"
        case contracts.oracleFactory[chainId]:
            return "OracleFactory"
        case contracts.oracleFactoryImplementation[chainId]:
            return "OracleFactory"
        case contracts.router[chainId]:
            return "HelixRouterV1"
        case contracts.helixMigrator[chainId]:
            return "HelixMigrator"
        case contracts.swapRewards[chainId]:
            return "SwapRewards"
        case contracts.masterChef[chainId]:
            return "MasterChef"
        case contracts.masterChefImplementation[chainId]:
            return "MasterChef"
        case contracts.autoHelix[chainId]:
            return "AutoHelix"
        case contracts.autoHelixImplementation[chainId]:
            return "AutoHelix"
        case contracts.multicall[chainId]:
            return "Multicall"
        case contracts.airDrop[chainId]:
            return "AirDrop"
        case contracts.yieldSwap[chainId]:
            return "YieldSwap"
        case contracts.yieldSwapImplementation[chainId]:
            return "YieldSwap"
        case contracts.lpSwap[chainId]:
            return "LpSwap"
        case contracts.lpSwapImplementation[chainId]:
            return "LpSwap"
        default:
            throw "Error: contract address not found"
            return
    }
}

const getContractEnclosingFolder = (name) => {
    switch (name) {
        case "FeeCollector":
            return "fees"
        case "FeeHandler":
            return "fees"
        case "FeeMinter":
            return "fees"
        case "HelixMigrator":
            return "migrations"
        case "MultiSigWallet":
            return "multisig"
        case "TokenMultiSigWallet":
            return "multisig"
        case "OracleFactory":
            return "oracles"
        case "LpSwap":
            return "p2p"
        case "YieldSwap":
            return "p2p"
        case "AirDrop":
            return "presales"
        case "PublicPresale":
            return "presales"
        case "VipPresale":
            return "presales"
        case "ReferralRegister":
            return "referrals"
        case "AutoHelix":
            return "staking"
        case "MasterChef":
            return "staking"
        case "HelixChefNFT":
            return "stakingNFT"
        case "HelixNFTBridge":
            return "stakingNFT"
        case "HelixFactory":
            return "swaps"
        case "HelixPair":
            return "swaps"
        case "HelixRouterV1":
            return "swaps"
        case "SwapRewards":
            return "swaps"
        case "TimelockController":
            return "timelock"
        case "HelixLP":
            return "tokens"
        case "HelixNFT":
            return "tokens"
        case "HelixToken":
            return "tokens"
        case "Multicall2":
            return "utils"
        case "HelixVault":
            return "vaults"
        default:
            return "Error: contract name not found"
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
    getChainId,
}
