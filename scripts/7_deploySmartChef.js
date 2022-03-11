/**
 * @dev Smart Chef Deployment
 * 
 * A new Smart Chef must be deployed every time we want to create a pool for a certain pair
 * of (staking token, reward token) or duration / reward per block, etc.
 *
 * command for deploy on bsc-testnet: 
 * 
 *      `npx hardhat run scripts/7_deploySmartChef.js --network testnetBSC`
 *       
 * Workflow:
 * 
 *      1. Deploy `SmartChef` contract.
 *      2. Add `SmartChef` as minter to `AuraToken`
 */
const { ethers, network } = require(`hardhat`);
const contracts = require("./constants/contracts")
const addresses = require("./constants/addresses")
const initials = require("./constants/initials")
const env = require("./constants/env")

const StakingTokenAddress = addresses.BUSD[env.network];// token A which must be staked in this pool
const RewardTokenAddress = contracts.auraToken[env.network];
const StartBlock = initials.SMARTCHEF_START_BLOCK;
const EndBlock = initials.SMARTCHEF_END_BLOCK;
const RewardPerBlock = initials.SMARTCHEF_REWARD_PER_BLOCK;

async function main() {

    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${ deployer.address}`);
    
    let nonce = await network.provider.send(`eth_getTransactionCount`, [deployer.address, "latest"]);

    console.log(`------ Start deploying Smart Chef contract ---------`);
    const SmartChef = await ethers.getContractFactory(`SmartChef`);
    chef = await SmartChef.deploy(
    /*STAKING token address=*/StakingTokenAddress,
    /*REWARD token address=*/RewardTokenAddress,
    /*reward amount per block=*/RewardPerBlock,
    /*start block=*/StartBlock,
    /*end block=*/EndBlock, {nonce: nonce});
    await chef.deployTransaction.wait();
    console.log(`Smart Chef deployed to ${chef.address}`);

    console.log(`Do NOT forget to fund the newly deployed chef with some reward tokens!`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
 