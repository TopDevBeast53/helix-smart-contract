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
 *      2. Check how many `HELIX` tokens `HelixChefNFT` contract has
 *      3. Mint to an user by minter
 *      4. Stake by the user
 *      5. Accrue HelixPoints to the user by accruer(TODO: accruer should be SwapFeeRewardsWithAP but now minter temporary)
 *      6. Boost NFT by the user
 */


const { ethers, network } = require(`hardhat`);
const {BigNumber} = require("ethers");
const contracts = require("./constants/contracts")
const env = require("./constants/env")
 
require("dotenv").config();

let IHelixChefNFT, IHelixNFT, IHelixToken;
let rpc, minter, user;
let tx, nonce_minter, nonce_user;

function expandTo18Decimals(n) {
    return (new BigNumber.from(n)).mul((new BigNumber.from(10)).pow(18))
}

async function init() {
    rpc =  new ethers.providers.JsonRpcProvider(env.rpcURL) ;
    minter = new ethers.Wallet( process.env.PRIVATE_KEY, rpc);
    user = new ethers.Wallet( process.env.USER_PRIVATE_KEY, rpc);
    IHelixChefNFT = await ethers.getContractFactory("HelixChefNFT");
    IHelixNFT = await ethers.getContractFactory("HelixNFT");
    IHelixToken = await ethers.getContractFactory("HelixToken");
    console.log('-- initialize to set connections --');
    console.log('minter address:', minter.address);
    console.log('user address:', user.address);
}

async function getHelixTokenBalanceOf(address){
    const HelixToken = IHelixToken.attach(contracts.helixToken[env.network]).connect(user);
    let ret = await HelixToken.balanceOf(address);
    return ret;
}

async function mintToUserByMinter() {
    console.log('-- Now minting --');

    const HelixNFT = IHelixNFT.attach(contracts.helixNFT[env.network]).connect(minter);

    tx = await HelixNFT.mint(user.address, {nonce: nonce_minter, gasLimit: 3000000});//
    await tx.wait();

    tx = await HelixNFT.getTokenIdsOfOwner(user.address);
    console.log('-- Successful to mint to user --');
    console.log('tokenids:', tx);
}

async function stake() {

    console.log('-- Now staking --');

    let prev = await getHelixTokenBalanceOf(user.address);
    console.log('Previous `HELIX` Balance of `user` is', prev.toString());

    const HelixNFT = IHelixNFT.attach(contracts.helixNFT[env.network]).connect(user);
    const HelixChefNFT = IHelixChefNFT.attach(contracts.helixNFTChef[env.network]).connect(user);
    
    const lastTokenId = await HelixNFT.getLastTokenId();

    for (let tokenId = 1; tokenId <= lastTokenId; tokenId++) {
        const token = await HelixNFT.getToken(tokenId);
        if (token.tokenOwner == user.address && token.isStaked == false) {
            //start staking
            tx = await HelixChefNFT.stake([tokenId], {nonce: nonce_user, gasLimit: 3000000});
            await tx.wait();

            let now = await getHelixTokenBalanceOf(user.address);
            console.log('Now You have received', (now - prev).toString(), 'HELIX');
            return tokenId;
        }
    }
    return 0;
}

async function withdrawReward() {
    console.log('-- Now withdraw --')
    const HelixChefNFT = IHelixChefNFT.attach(contracts.helixNFTChef[env.network]).connect(user);
    
    let prev = await getHelixTokenBalanceOf(user.address);
    console.log('Previous `HELIX` Balance of `user` is ', prev.toString());

    tx = await HelixChefNFT.withdrawRewardToken({nonce: ++nonce_user, gasLimit: 3000000});
    await tx.wait();

    let now = await getHelixTokenBalanceOf(user.address);
    console.log('Now You have received ', (now - prev).toString());
}

async function accrueHelixPoints() {

    const HelixNFT = IHelixNFT.attach(contracts.helixNFT[env.network]).connect(minter);

    console.log('-- Adding accruer --');
    const _isAccruer = await HelixNFT.isAccruer(minter.address);
    if (!_isAccruer) {
        tx = await HelixNFT.addAccruer(minter.address, {nonce: ++nonce_minter, gasLimit: 3000000});
        const ret = await tx.wait();
        if(ret)
            console.log('Added accruer:', minter.address);
    } else {
        console.log('Already exist accruer');
    }

    console.log('-- Now accrue --');

    const prevAP = await HelixNFT.getAccumulatedAP(user.address);
    console.log('Previous HelixPoints balance of `user` is', prevAP.toString());

    console.log('- Adding HelixPoints 15 ether to `user` -');
    tx = await HelixNFT.accruePoints(user.address, expandTo18Decimals(15), {nonce: ++nonce_minter, gasLimit: 3000000});//
    await tx.wait();

    const curAP = await HelixNFT.getAccumulatedAP(user.address);
    console.log('Current HelixPoints balance of `user` is', curAP.toString());
}

async function boostNFT(tokenId) {

    console.log('-- Now boosting NFT --');

    const HelixChefNFT = IHelixChefNFT.attach(contracts.helixNFTChef[env.network]).connect(user);
    const HelixNFT = IHelixNFT.attach(contracts.helixNFT[env.network]).connect(user);

    const prevAP = await HelixNFT.getAccumulatedAP(user.address);
    console.log('Previous HelixPoints balance of `user` is', prevAP.toString());

    const prevLevel = await HelixNFT.getLevel(tokenId);
    console.log('Previous tokenId', tokenId, '`s level is', prevLevel.toString());
    

    console.log('- Boosting NFT id', tokenId, 'with', prevAP.toString(), 'amount by user -');
    tx = await HelixChefNFT.boostHelixNFT(tokenId, prevAP, {nonce: ++nonce_user, gasLimit: 3000000})
    await tx.wait();

    const curAP = await HelixNFT.getAccumulatedAP(user.address);
    console.log('Current HelixPoints balance of `user` is', curAP.toString());

    const curLevel = await HelixNFT.getLevel(tokenId);
    console.log('Current tokenId', tokenId, '`s level is', curLevel.toString());

}

async function main() {

    //initialize to set wallet & contract instance
    await init();

    //get nonce of minter
    nonce_minter = await network.provider.send(`eth_getTransactionCount`, [minter.address, "latest"]);

    // check how many `HELIX` tokens `HelixChefNFT` has
    let ret = await getHelixTokenBalanceOf(contracts.helixNFTChef[env.network]);
    if (parseInt(ret.toString()) < 100000) {
        console.log('HelixChefNFT has not enough `HELIX` tokens, now balance is', ret.toString());
        console.log('You should send `HELIX` more than 100000 wei to HelixChefNFT address');
        return;
    }
    console.log('`HELIX` balance of HelixChefNFT is', ret.toString());

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

    //accrue HelixPoints by accruer(TODO: accruer should be SwapFeeRewardsWithAP but now minter in temporary)
    await accrueHelixPoints();

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