/**
 * @dev Swap Fee Rewards with AP Deployment
 *
 * command to deploy on bsc-testnet:
 *      `npx hardhat run scripts/deploySwapFee.js --network testnetBSC`
 *
 * Workflow:
 *      1. Deploy `SwapFeeRewardsWithAP` contract.                                                                                         
 *      2. Register swapFee contract address with the Router.
 *      3. Register swapFee contract address with the AuraNFT as an accruer.
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
const refRegAddress = contracts.refReg[env.network];

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
        refRegAddress,
        { nonce: nonce },
    );
    await swapFee.deployTransaction.wait();
    console.log(`SwapFeeRewardsWithAP deployed to ${swapFee.address}`);

    // 2. Register swapFee contract with the Router.
    const Router = await ethers.getContractFactory('AuraRouterV1');
    const router = Router.attach(routerAddress);
    let tx = await router.setSwapFeeReward(swapFee.address);
    console.log(`Register Swap Fee address with Router, transaction results: ${tx}`);

    // 3. Register swapFee contract with the exchange's auraNFT as an accruer.
    const AuraNFT = await ethers.getContractFactory('AuraNFT');
    const auraNFT = AuraNFT.attach(auraNFTAddress);
    tx = await auraNFT.addAccruer(swapFee.address);
    console.log(`Register Swap Fee with AuraNFT as accruer, transaction results: ${tx}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
