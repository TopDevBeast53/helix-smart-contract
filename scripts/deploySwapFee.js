/**
 * @dev Swap Fee Rewards with AP Deployment
 *
 * command to deploy on bsc-testnet:
 *      `npx hardhat run scripts/deploySwapFee.js --network testnetBSC`
 *
 * Workflow:
 *      1. Deploy `SwapFeeRewardsWithAP` contract.                                                                                         
 *      2. Call 'setSwapFeeReward' on Router with deployed swapFee contract address.
 */
const { ethers } = require(`hardhat`);
const contracts = require('./constants/contracts');
const env = require('./constants/env');

const factoryAddress = contracts.factory[env.network];
const routerAddress = contracts.router[env.network];
const targetTokenAddress = contracts.auraToken[env.network];    // Note that targetTokenAddress == auraTokenAddress
const targetAPTokenAddress = contracts.auraLP[env.network];
const oracleAddress = contracts.oracle[env.network];
const auraTokenAddress = contracts.auraToken[env.network];
const auraNFTAddress = contracts.auraNFT[env.network];

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${deployer.address}`);
    // Deployed by = 0x59201fb8cb2D61118B280c8542127331DD141654

    let nonce = await network.provider.send(`eth_getTransactionCount`, [deployer.address, "latest"])

    // 1. Deploy the Swap Fee Rewards with AP Contract.
    console.log(`Deploy SwapFeeRewardsWithAP`);
    const SwapFee = await ethers.getContractFactory('SwapFeeRewardsWithAP');
    const swapFee = await SwapFee.deploy(
        factoryAddress,
        routerAddress,
        targetTokenAddress,
        targetAPTokenAddress,
        oracleAddress,
        auraTokenAddress,
        auraNFTAddress,
        { nonce: nonce },
    );
    await swapFee.deployTransaction.wait();
    console.log(`SwapFeeRewardsWithAP deployed to ${swapFee.address}`);

    // 2. Call 'setSwapFeeReward' on Router with swapFee contract address.
    const Router = await ethers.getContractFactory('AuraRouterV1');
    const router = Router.attach(routerAddress);
    let tx = await router.setSwapFeeReward(swapFee.address);
    console.log(`Set Swap Fee Reward on Router transaction results: ${tx}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
