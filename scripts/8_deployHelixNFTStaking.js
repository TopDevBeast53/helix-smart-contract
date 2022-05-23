/**
 * @dev NFT Staking Deployment 
 *
 * command for deploy on bsc-testnet: 
 * 
 *      npx hardhat run scripts/8_deployHelixNFTStaking.js --network testnetBSC
 * 
 *      npx hardhat run scripts/8_deployHelixNFTStaking.js --network rinkeby
 */
const { ethers, network, upgrades } = require(`hardhat`);
const contracts = require("./constants/contracts")
const env = require("./constants/env")

const rewardToken = contracts.helixToken[env.network];

let helixNft, helixChefNft;

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${ deployer.address}`);
    
    let nonce = await network.provider.send(`eth_getTransactionCount`, [deployer.address, "latest"]);
    
    console.log(`------ Start deploying Helix NFT contract ---------`);
    const HelixNFT = await ethers.getContractFactory(`HelixNFT`);
    helixNft = await upgrades.deployProxy(HelixNFT, [``], {nonce: nonce});
    await helixNft.deployTransaction.wait();
    console.log(`Helix NFT deployed to ${helixNft.address}`);

    console.log(`------ Start deploying HelixChefNFT ---------`);
    const HelixChefNFT = await ethers.getContractFactory(`HelixChefNFT`);
    helixChefNft = await upgrades.deployProxy(HelixChefNFT, [helixNft.address, rewardToken], {nonce: nonce});
    await helixChefNft.deployTransaction.wait();
    console.log(`HelixChefNFT deployed to ${helixChefNft.address}`);

    //Set `HelixChefNFT` contract as staker of HelixNFT
    let tx = await helixNft.addStaker(helixChefNft.address, {gasLimit: 3000000});
    await tx.wait();
    
    //Add `deployer` as minter of HelixNFT
    tx = await helixNft.addMinter(deployer.address, {gasLimit: 3000000});
    await tx.wait();

    console.log(`Do NOT forget to fund the newly deployed HelixNFTChef with some reward tokens!`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
 