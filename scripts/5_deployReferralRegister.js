/**
 * @dev Referral Register Deployment
 *
 * command for deploy on bsc-testnet: 
 * 
 *      npx hardhat run scripts/5_deployReferralRegister.js --network testnetBSC
 * 
 *      npx hardhat run scripts/5_deployReferralRegister.js --network rinkeby
 * 
 */
const { ethers, upgrades } = require(`hardhat`);
const contracts = require("./constants/contracts")
const initials = require("./constants/initials")
const env = require("./constants/env")

const HelixTokenAddress = contracts.helixToken[env.network];
const StakingFeePercent = initials.REFERRAL_STAKING_FEE_PERCENT[env.network];
const SwapFeePercent = initials.REFERRAL_SWAP_FEE_PERCENT[env.network];

async function main() {

    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${ deployer.address}`);

    console.log(`------ Start deploying Referral Register contract ---------`);
    const ReferralRegister = await ethers.getContractFactory(`ReferralRegister`);
    ref = await upgrades.deployProxy(ReferralRegister, [HelixTokenAddress, StakingFeePercent, SwapFeePercent]);
    await ref.deployTransaction.wait();
    console.log(`Referral Register deployed to ${ref.address}`);

    console.log(`------ Add Referral Register as Minter to HelixToken ---------`);
    const HelixToken = await ethers.getContractFactory(`HelixToken`);
    const helixToken = HelixToken.attach(HelixTokenAddress);

    let tx = await helixToken.addMinter(ref.address);
    await tx.wait();
    console.log(`Success to add Minter to HelixToken`)
}

 main()
     .then(() => process.exit(0))
     .catch((error) => {
         console.error(error);
         process.exit(1);
     }); 
