/**
 * @dev Swap Fee Rewards with AP Deployment
 *
 * command to deploy on bsc-testnet:
 *      `npx hardhat run scripts/10_deploySwapFee.js --network testnetBSC`
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
const targetTokenAddress = contracts.auraToken[env.network]; // Note that targetTokenAddress == auraTokenAddress
const targetAPTokenAddress = contracts.auraLP[env.network];
const oracleAddress = contracts.oracle[env.network];
const auraTokenAddress = contracts.auraToken[env.network];
const auraNFTAddress = contracts.auraNFT[env.network];
const refRegAddress = contracts.referralRegister[env.network];

gasLimit = 9999999;

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${deployer.address}`);

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
        { 
            gasLimit,
            nonce: nonce,
        },
    );
    await swapFee.deployTransaction.wait();
    console.log(`SwapFeeRewardsWithAP deployed to ${swapFee.address}`);

    // 2. Register swapFee contract with the Router.
    const Router = await ethers.getContractFactory('AuraRouterV1');
    const router = Router.attach(routerAddress);
    await router.setSwapFeeReward(swapFee.address, { gasLimit });
    console.log(`Swap Fee address registered with Router`);

    // 3. Register swapFee contract with the exchange's auraNFT as an accruer.
    const AuraNFT = await ethers.getContractFactory('AuraNFT');
    const auraNFT = AuraNFT.attach(auraNFTAddress);
    await auraNFT.addAccruer(swapFee.address, { gasLimit });
    console.log(`Swap Fee registered with AuraNFT as accruer`);

    // 4. Register the swapFee contract with the referralRegister as a recorder
    const RefReg = await ethers.getContractFactory('ReferralRegister');
    const refReg = RefReg.attach(refRegAddress);
    await refReg.addRecorder(swapFee.address, { gasLimit });
    console.log(`Swap Fee registered with Referral Register as recorder`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
