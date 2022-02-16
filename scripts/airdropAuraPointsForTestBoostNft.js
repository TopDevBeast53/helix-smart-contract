/**
 * @dev To airdrop auraPoints(default 20 ether) for testing boost of auraNFT
 *
 * command for deploy on bsc-testnet: 
 * 
 *      `npx hardhat run scripts/airdropAuraPointsForTestBoostNft.js --network testnetBSC`
 *       
 * Workflow:
 * 
 *      1. Initialize to set wallet & contract instance
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

let IAuraNFT;
let rpc, minter, user;
let tx, nonce_minter;

function expandTo18Decimals(n) {
    return (new BigNumber.from(n)).mul((new BigNumber.from(10)).pow(18))
}

async function init() {
    rpc =  new ethers.providers.JsonRpcProvider(env.rpcURL) ;
    minter = new ethers.Wallet( process.env.PRIVATE_KEY, rpc);
    user = new ethers.Wallet( process.env.USER_PRIVATE_KEY, rpc);
    IAuraNFT = await ethers.getContractFactory("AuraNFT");
    console.log('-- initialize to set connections --');
    console.log('minter address:', minter.address);
    console.log('user address:', user.address);
}

async function accrueAuraPoints(val) {

    const AuraNFT = IAuraNFT.attach(contracts.auraNFT[env.network]).connect(minter);

    console.log('-- Adding accruer --');
    const _isAccruer = await AuraNFT.isAccruer(minter.address);
    if (!_isAccruer) {
        tx = await AuraNFT.addAccruer(minter.address, {nonce: nonce_minter++, gasLimit: 3000000});
        const ret = await tx.wait();
        if(ret)
            console.log('Added accruer:', minter.address);
    } else {
        console.log('Already exist accruer');
    }

    console.log('-- Now accrue --');

    const prevAP = await AuraNFT.getAccumulatedAP(user.address);
    console.log('Previous AccumulatedAP balance of `user` is', prevAP.toString());

    console.log('- Adding AuraPoints', val, 'ether to `user` -');
    tx = await AuraNFT.accruePoints(user.address, expandTo18Decimals(val), {nonce: nonce_minter++, gasLimit: 3000000});//
    await tx.wait();

    const curAP = await AuraNFT.getAccumulatedAP(user.address);
    console.log('Current AccumulatedAP balance of `user` is', curAP.toString());
}

async function main() {

    //initialize to set wallet & contract instance
    await init();

    //get nonce of minter
    nonce_minter = await network.provider.send(`eth_getTransactionCount`, [minter.address, "latest"]);
    //accrue AuraPoints by accruer(TODO: accruer should be SwapFeeRewardsWithAP but now minter in temporary)
    await accrueAuraPoints(20);//ether

    console.log('Done!')
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error);
        process.exit(1);
    });