/*
 * @dev Deployment script for Yield Swap contract.
 *
 * Run from project root using:
 *     npx hardhat run scripts/14_deployYieldSwap.js --network testnetBSC
 * 
 *     npx hardhat run scripts/14_deployYieldSwap.js --network rinkeby
 */

// Define script parameters
const { ethers } = require(`hardhat`)
const env = require('./constants/env')
const contracts = require('./constants/contracts')
const initials = require('./constants/initials')

// Define contract constructor arguments
const chefAddress = contracts.masterChef[env.network]
const rewardTokenAddress = contracts.helixToken[env.network]
const feeHandlerAddress = contracts.feeHandler[env.network]
const minLockDuration = initials.YIELD_SWAP_MIN_LOCK_DURATION[env.network]
const maxLockDuration = initials.YIELD_SWAP_MAX_LOCK_DURATION[env.network]

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${deployer.address}`);

    console.log(`Deploy Yield Swap`);
    const ContractFactory = await ethers.getContractFactory('YieldSwap');
    const contract = await upgrades.deployProxy(
        ContractFactory,
        [
            chefAddress,               // stakes and earns yield on lp tokens
            rewardTokenAddress,
            feeHandlerAddress,
            minLockDuration,    // minimum duration for which lp tokens can be locked 
            maxLockDuration     // maximum duration for which lp tokens can be locked
        ]
    );     
    await contract.deployTransaction.wait();
    
    console.log(`Yield Swap deployed to ${contract.address}`);

    const implementationAddress = await upgrades.erc1967.getImplementationAddress(
        contract.address
    )   
    console.log(`Implementation address: ${implementationAddress}`)       

    console.log(`Done`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
