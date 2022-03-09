/**
 * @dev Referral Register Deployment
 *
 * command for deploy on bsc-testnet: 
 * 
 *      `npx hardhat run scripts/4_deployReferralRegister.js --network testnetBSC`
 */
const { ethers, network } = require(`hardhat`);
const contracts = require("./constants/contracts")
const initials = require("./constants/initials")
const env = require("./constants/env")

const AuraTokenAddress = contracts.auraToken[env.network];
const StakingFeePercent = initials.REFERRAL_STAKING_FEE_PERCENT[env.network];
const SwapFeePercent = initials.REFERRAL_SWAP_FEE_PERCENT[env.network];

async function main() {

    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${ deployer.address}`);

    let nonce = await network.provider.send(`eth_getTransactionCount`, [deployer.address, "latest"]);

    console.log(`------ Start deploying Referral Register contract ---------`);
    const ReferralRegister = await ethers.getContractFactory(`ReferralRegister`);
    ref = await ReferralRegister.deploy(AuraTokenAddress, StakingFeePercent, SwapFeePercent);
    await ref.deployTransaction.wait();
    console.log(`Referral Register deployed to ${ref.address}`);

    console.log(`------ Add Referral Register as Minter to AuraToken ---------`);
    const AuraToken = await ethers.getContractFactory(`AuraToken`);
    const auraToken = AuraToken.attach(AuraTokenAddress);

    let tx = await auraToken.addMinter(ref.address);
    await tx.wait();
    console.log(`Success to add Minter to AuraToken`)
}

 main()
     .then(() => process.exit(0))
     .catch((error) => {
         console.error(error);
         process.exit(1);
     }); 