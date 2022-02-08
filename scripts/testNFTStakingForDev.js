/**
 * @dev Deployment for test of NFT Staking  
 *
 * command for deploy on bsc-testnet: 
 * 
 *      `npx hardhat run scripts/testNFTStakingForDev.js --network testnetBSC`
 *       
 * Workflow:
 * 
 *      1. Initialize to set wallet & contract instance
 *      2. Check how many `AURA` tokens `AuraChefNFT` contract has
 *      3. Mint to an user by minter
 *      4. Stake by the user
 *      5. Accrue AuraPoints to the user by accruer(TODO: accruer should be SwapFeeRewardsWithAP but now minter temporary)
 *      6. Boost NFT by the user
 */


const { ethers, network } = require(`hardhat`);
const {BigNumber} = require("ethers");
const contracts = require("./constants/contracts")
const env = require("./constants/env")
 
require("dotenv").config();

let IAuraChefNFT, IAuraNFT, IAuraToken;
let rpc, minter, user;
let tx, nonce_minter, nonce_user;

function expandTo18Decimals(n) {
    return (new BigNumber.from(n)).mul((new BigNumber.from(10)).pow(18))
}

async function init() {
    rpc =  new ethers.providers.JsonRpcProvider(env.rpcURL) ;
    minter = new ethers.Wallet( process.env.PRIVATE_KEY, rpc);
    user = new ethers.Wallet( process.env.USER_PRIVATE_KEY, rpc);
    IAuraChefNFT = await ethers.getContractFactory("AuraChefNFT");
    IAuraNFT = await ethers.getContractFactory("AuraNFT");
    IAuraToken = await ethers.getContractFactory("AuraToken");
    console.log('-- initialize to set connections --');
    console.log('minter address:', minter.address);
    console.log('user address:', user.address);
}

async function getAuraTokenBalanceOf(address){
    const AuraToken = IAuraToken.attach(contracts.auraToken[env.network]).connect(user);
    let ret = await AuraToken.balanceOf(address);
    return ret;
}

async function mintToUserByMinter() {
    console.log('-- Now minting --');

    const AuraNFT = IAuraNFT.attach(contracts.auraNFT[env.network]).connect(minter);

    tx = await AuraNFT.mint(user.address, {nonce: nonce_minter, gasLimit: 3000000});//
    await tx.wait();

    console.log('-- Successful to mint to user --');
}

async function stake() {

    console.log('-- Now staking --');

    let prev = await getAuraTokenBalanceOf(user.address);
    console.log('Previous `AURA` Balance of `user` is', prev.toString());

    const AuraNFT = IAuraNFT.attach(contracts.auraNFT[env.network]).connect(user);
    const AuraChefNFT = IAuraChefNFT.attach(contracts.auraNFTChef[env.network]).connect(user);
    
    const lastTokenId = await AuraNFT.getLastTokenId();

    for (let tokenId = 1; tokenId <= lastTokenId; tokenId++) {
        const token = await AuraNFT.getToken(tokenId);
        if (token.tokenOwner == user.address && token.isStaked == false) {
            //start staking
            tx = await AuraChefNFT.stake([tokenId], {nonce: nonce_user, gasLimit: 3000000});
            await tx.wait();

            let now = await getAuraTokenBalanceOf(user.address);
            console.log('Now You have received', (now - prev).toString(), 'AURA');
            return tokenId;
        }
    }
    return 0;
}

async function withdrawReward() {
    console.log('-- Now withdraw --')
    const AuraChefNFT = IAuraChefNFT.attach(contracts.auraNFTChef[env.network]).connect(user);
    
    let prev = await getAuraTokenBalanceOf(user.address);
    console.log('Previous `AURA` Balance of `user` is ', prev.toString());

    tx = await AuraChefNFT.withdrawRewardToken({nonce: ++nonce_user, gasLimit: 3000000});
    await tx.wait();

    let now = await getAuraTokenBalanceOf(user.address);
    console.log('Now You have received ', (now - prev).toString());
}

async function accrueAuraPoints() {

    const AuraNFT = IAuraNFT.attach(contracts.auraNFT[env.network]).connect(minter);

    console.log('-- Adding accruer --');
    const _isAccruer = await AuraNFT.isAccruer(minter.address);
    if (!_isAccruer) {
        tx = await AuraNFT.addAccruer(minter.address, {nonce: ++nonce_minter, gasLimit: 3000000});
        const ret = await tx.wait();
        if(ret)
            console.log('Added accruer:', minter.address);
    } else {
        console.log('Already exist accruer');
    }

    console.log('-- Now accrue --');

    const prevAP = await AuraNFT.getAccumulatedAP(user.address);
    console.log('Previous AuraPoints balance of `user` is', prevAP.toString());

    console.log('- Adding AuraPoints 15 ether to `user` -');
    tx = await AuraNFT.accruePoints(user.address, expandTo18Decimals(15), {nonce: ++nonce_minter, gasLimit: 3000000});//
    await tx.wait();

    const curAP = await AuraNFT.getAccumulatedAP(user.address);
    console.log('Current AuraPoints balance of `user` is', curAP.toString());
}

async function boostNFT(tokenId) {

    console.log('-- Now boosting NFT --');

    const AuraChefNFT = IAuraChefNFT.attach(contracts.auraNFTChef[env.network]).connect(user);
    const AuraNFT = IAuraNFT.attach(contracts.auraNFT[env.network]).connect(user);

    const prevAP = await AuraNFT.getAccumulatedAP(user.address);
    console.log('Previous AuraPoints balance of `user` is', prevAP.toString());

    const prevLevel = await AuraNFT.getLevel(tokenId);
    console.log('Previous tokenId', tokenId, '`s level is', prevLevel.toString());
    

    console.log('- Boosting NFT id', tokenId, 'with', prevAP.toString(), 'amount by user -');
    tx = await AuraChefNFT.boostAuraNFT(tokenId, prevAP, {nonce: ++nonce_user, gasLimit: 3000000})
    await tx.wait();

    const curAP = await AuraNFT.getAccumulatedAP(user.address);
    console.log('Current AuraPoints balance of `user` is', curAP.toString());

    const curLevel = await AuraNFT.getLevel(tokenId);
    console.log('Current tokenId', tokenId, '`s level is', curLevel.toString());

}

async function main() {

    //initialize to set wallet & contract instance
    await init();

    //get nonce of minter
    nonce_minter = await network.provider.send(`eth_getTransactionCount`, [minter.address, "latest"]);

    // check how many `AURA` tokens `AuraChefNFT` has
    let ret = await getAuraTokenBalanceOf(contracts.auraNFTChef[env.network]);
    if (parseInt(ret.toString()) < 100000) {
        console.log('AuraChefNFT has not enough `AURA` tokens, now balance is', ret.toString());
        console.log('You should send `AURA` more than 100000 wei to AuraChefNFT address');
        return;
    }
    console.log('`AURA` balance of AuraChefNFT is', ret.toString());

    //mint by minter
    await mintToUserByMinter();

    //get nonce of user
    nonce_user = await network.provider.send(`eth_getTransactionCount`, [user.address, "latest"]);

    //stake
    let stakedTokedId = await stake();
    if (stakedTokedId != 0) {
        console.log('User has staked tokenId:', stakedTokedId);
    } else {
        console.log('Error to minting!');
    }

    //accrue AuraPoints by accruer(TODO: accruer should be SwapFeeRewardsWithAP but now minter in temporary)
    await accrueAuraPoints();

    //boost NFT
    if (stakedTokedId != 0) {
        await boostNFT(stakedTokedId);
    }

    console.log('Done!')
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error);
        process.exit(1);
    });