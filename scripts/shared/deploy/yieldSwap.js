const { ethers } = require(`hardhat`)
const { print } = require("../utilities")

const env = require('../../constants/env')
const contracts = require('../../constants/contracts')
const initials = require('../../constants/initials')

const chefAddress = contracts.masterChef[env.network]
const rewardTokenAddress = contracts.helixToken[env.network]
const feeHandlerAddress = contracts.feeHandler[env.network]
const collectorPercent = contracts.YIELD_SWAP_COLLECTOR_PERCENT[env.network]
const minLockDuration = initials.YIELD_SWAP_MIN_LOCK_DURATION[env.network]
const maxLockDuration = initials.YIELD_SWAP_MAX_LOCK_DURATION[env.network]

const deployYieldSwap = async (deployer) => {
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
