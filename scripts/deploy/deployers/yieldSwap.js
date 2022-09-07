const { ethers } = require(`hardhat`)
const { print, getChainId } = require("../../shared/utilities")

const contracts = require('../../../constants/contracts')
const initials = require('../../../constants/initials')

const deployYieldSwap = async (deployer) => {
    const chainId = await getChainId()
    const chefAddress = contracts.masterChef[chainId]
    const rewardTokenAddress = contracts.helixToken[chainId]
    const feeHandlerAddress = contracts.feeHandler[chainId]
    const collectorPercent = initials.YIELD_SWAP_COLLECTOR_PERCENT[chainId]
    const minLockDuration = initials.YIELD_SWAP_MIN_LOCK_DURATION[chainId]
    const maxLockDuration = initials.YIELD_SWAP_MAX_LOCK_DURATION[chainId]

    print(`Deploy Yield Swap`);
    print(`chefAddress: ${chefAddress}`)
    print(`rewardTokenAddress: ${rewardTokenAddress}`)
    print(`feeHandlerAddress: ${feeHandlerAddress}`)
    print(`collectorPercent: ${collectorPercent}`)
    print(`minLockDuration: ${minLockDuration}`)
    print(`maxLockDuration: ${maxLockDuration}`)

    const ContractFactory = await ethers.getContractFactory('YieldSwap');
    const contract = await upgrades.deployProxy(
        ContractFactory,
        [
            chefAddress,               // stakes and earns yield on lp tokens
            rewardTokenAddress,
            feeHandlerAddress,
            collectorPercent,
            minLockDuration,    // minimum duration for which lp tokens can be locked 
            maxLockDuration     // maximum duration for which lp tokens can be locked
        ]
    );     
    await contract.deployTransaction.wait();
    
    print(`Yield Swap deployed to ${contract.address}`);

    const implementationAddress = await upgrades.erc1967.getImplementationAddress(
        contract.address
    )   
    print(`Implementation address: ${implementationAddress}`)       
}

module.exports = { deployYieldSwap }
