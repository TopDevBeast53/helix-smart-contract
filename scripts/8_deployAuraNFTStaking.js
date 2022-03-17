/**
 * @dev NFT Staking Deployment 
 *
 * command for deploy on bsc-testnet: 
 * 
 *      `npx hardhat run scripts/8_deployAuraNFTStaking.js --network testnetBSC`
 *       
 * Workflow:
 * 
 *      1. Deploy `AuraNFT` contract.
 *      2. Deploy `AuraChefNFT` contract.
 *         - Set `AuraNFT` address deployed to `IAuraNFT` of `AuraChefNFT`.
 *         - Set `AuraChefNFT` contract to staker of `AuraNFT`.
 *         - Set `deployer` to minter of `AuraNFT`, Owner(deployer) can add another man later.
 *         - Add RewardToken of `AuraChefNFT` with WBNB
 */
const { ethers, network, upgrades } = require(`hardhat`);
const contracts = require("./constants/contracts")
const initials = require("./constants/initials")
const env = require("./constants/env")

const rewardToken = contracts.auraToken[env.network];
const initialAuraPoints = initials.NFT_INITIAL_AURAPOINTS[env.network];
const levelUpPercent = initials.NFT_LEVEL_UP_PERCENT[env.network];
const startBlock = initials.NFTCHEF_START_BLOCK[env.network];
const rewardPerBlock = initials.NFTCHEF_REWARD_PER_BLOCK[env.network];
const lastRewardBlock = initials.NFTCHEF_LAST_REWARD_BLOCK[env.network];

let auraNft, auraChefNft;

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${ deployer.address}`);
    
    let nonce = await network.provider.send(`eth_getTransactionCount`, [deployer.address, "latest"]);
    
    console.log(`------ Start deploying Aura NFT contract ---------`);
    const AuraNFT = await ethers.getContractFactory(`AuraNFT`);
    auraNft = await upgrades.deployProxy(AuraNFT, [``, initialAuraPoints, levelUpPercent], {nonce: nonce});
    await auraNft.deployTransaction.wait();
    console.log(`Aura NFT deployed to ${auraNft.address}`);

    console.log(`------ Start deploying AuraChefNFT ---------`);
    const AuraChefNFT = await ethers.getContractFactory(`AuraChefNFT`);
    auraChefNft = await AuraChefNFT.deploy(auraNft.address, lastRewardBlock);
    await auraChefNft.deployTransaction.wait();
    console.log(`AuraChefNFT deployed to ${auraChefNft.address}`);

    //Set `AuraChefNFT` contract as staker of AuraNFT
    let tx = await auraNft.addStaker(auraChefNft.address, {gasLimit: 3000000});
    await tx.wait();
    
    //Add `deployer` as minter of AuraNFT
    tx = await auraNft.addMinter(deployer.address, {gasLimit: 3000000});
    await tx.wait();

    //Add RewardToken with AURA
    tx = await auraChefNft.addNewRewardToken(rewardToken, startBlock, rewardPerBlock, {gasLimit: 3000000});
    await tx.wait();

    console.log(`Do NOT forget to fund the newly deployed AuraNFTChef with some reward tokens!`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
 