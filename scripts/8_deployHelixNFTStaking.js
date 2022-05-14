/**
 * @dev NFT Staking Deployment 
 *
 * command for deploy on bsc-testnet: 
 * 
 *      npx hardhat run scripts/8_deployHelixNFTStaking.js --network testnetBSC
 *       
 * Workflow:
 * 
 *      1. Deploy `HelixNFT` contract.
 *      2. Deploy `HelixChefNFT` contract.
 *         - Set `HelixNFT` address deployed to `IHelixNFT` of `HelixChefNFT`.
 *         - Set `HelixChefNFT` contract to staker of `HelixNFT`.
 *         - Set `deployer` to minter of `HelixNFT`, Owner(deployer) can add another man later.
 *         - Add RewardToken of `HelixChefNFT` with helixToken
 */
const { ethers, network, upgrades } = require(`hardhat`);
const contracts = require("./constants/contracts")
const initials = require("./constants/initials")
const env = require("./constants/env")

const rewardToken = contracts.helixToken[env.network];
const initialHelixPoints = initials.NFT_INITIAL_HELIXPOINTS[env.network];
const levelUpPercent = initials.NFT_LEVEL_UP_PERCENT[env.network];
const startBlock = initials.NFTCHEF_START_BLOCK[env.network];
const rewardPerBlock = initials.NFTCHEF_REWARD_PER_BLOCK[env.network];
const lastRewardBlock = initials.NFTCHEF_LAST_REWARD_BLOCK[env.network];

let helixNft, helixChefNft;

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${ deployer.address}`);
    
    let nonce = await network.provider.send(`eth_getTransactionCount`, [deployer.address, "latest"]);
    
    console.log(`------ Start deploying Helix NFT contract ---------`);
    const HelixNFT = await ethers.getContractFactory(`HelixNFT`);
    helixNft = await upgrades.deployProxy(HelixNFT, [``, initialHelixPoints, levelUpPercent], {nonce: nonce});
    await helixNft.deployTransaction.wait();
    console.log(`Helix NFT deployed to ${helixNft.address}`);

    console.log(`------ Start deploying HelixChefNFT ---------`);
    const HelixChefNFT = await ethers.getContractFactory(`HelixChefNFT`);
    helixChefNft = await upgrades.deployProxy(HelixChefNFT, [helixNft.address, lastRewardBlock], {nonce: nonce});
    await helixChefNft.deployTransaction.wait();
    console.log(`HelixChefNFT deployed to ${helixChefNft.address}`);

    //Set `HelixChefNFT` contract as staker of HelixNFT
    let tx = await helixNft.addStaker(helixChefNft.address, {gasLimit: 3000000});
    await tx.wait();
    
    //Add `deployer` as minter of HelixNFT
    tx = await helixNft.addMinter(deployer.address, {gasLimit: 3000000});
    await tx.wait();

    //Add RewardToken with HELIX
    tx = await helixChefNft.addNewRewardToken(rewardToken, startBlock, rewardPerBlock, {gasLimit: 3000000});
    await tx.wait();

    console.log(`Do NOT forget to fund the newly deployed HelixNFTChef with some reward tokens!`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
 