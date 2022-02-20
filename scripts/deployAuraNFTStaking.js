/**
 * @dev NFT Staking Deployment 
 *
 * command for deploy on bsc-testnet: 
 * 
 *      `npx hardhat run scripts/deployAuraNFTStaking.js --network testnetBSC`
 *       
 * Workflow:
 * 
 *      1. Deploy `AuraNFT` contract.
 *      2. Deploy `AuraChefNFT` contract.
 *         - Set `AuraNFT` address deployed to `IAuraNFT` of `AuraChefNFT`.
 *         - Set `AuraChefNFT` contract to staker of `AuraNFT`.
 *         - Set `deployer` to minter of `AuraNFT`, Owner(deployer) can add another man later.
 *         - Set `SwapFee` to accruer of `AuraNFT`, Owner(deployer) can add another man later.
 *         - Add RewardToken of `AuraChefNFT` with WBNB
 */
const { ethers, network, upgrades } = require(`hardhat`);
const {BigNumber} = require("ethers");
const contracts = require("./constants/contracts")
const env = require("./constants/env")

const initialAuraPoints = expandTo18Decimals(1); // AuraNFT's _initialAuraPoints
const levelUpPercent = 10; // AuraNFT's _levelUpPercent
const startBlock = 0; // AuraChetNFT's RewardToken attribute `startBlock`
const rewardPerBlock = 10000; // AuraChefNFT's RewardToken attribute `rewardPerBlock`
const lastRewardBlock = 0; // AuraChefNFT initial param: Reward will calculate from this blocknum -->update me

function expandTo18Decimals(n) {
    return (new BigNumber.from(n)).mul((new BigNumber.from(10)).pow(18))
}

let auraNft, auraChefNft, swapFee;

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
    //constructor (IAuraNFT _auraNFT, uint _lastRewardBlock)
    auraChefNft = await AuraChefNFT.deploy(auraNft.address, lastRewardBlock);
    await auraChefNft.deployTransaction.wait();
    console.log(`AuraChefNFT deployed to ${auraChefNft.address}`);

    console.log(`------ Start deploying SwapFeeRewardsWithAP ---------`);
    const SwapFee = await ethers.getContractFactory('SwapFeeRewardsWithAP');
    swapFee = await SwapFee.deploy();
    await swapFee.deployTransaction.wait();
    console.log(`SwapFeeRewardsWithAP deployed to ${swapFee.address}`);

    //Set `AuraChefNFT` contract as staker of AuraNFT
    let tx = await auraNft.addStaker(auraChefNft.address, {gasLimit: 3000000});
    await tx.wait();
    
    //Add `deployer` as minter of AuraNFT
    tx = await auraNft.addMinter(deployer.address, {gasLimit: 3000000});
    await tx.wait();

    //Set `SwapFee` contract as accruer of AuraNFT
    tx = await auraNft.addAccruer(swapFee.address, {gasLimit: 3000000});
    await tx.wait();

    //Add RewardToken with AURA
    tx = await auraChefNft.addNewRewardToken(contracts.auraToken[env.network], startBlock, rewardPerBlock, {gasLimit: 3000000});
    await tx.wait();

    console.log('done!')
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
 