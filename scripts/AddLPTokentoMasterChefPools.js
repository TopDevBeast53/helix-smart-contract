/**
 * @dev Add LP token to MasterChef
 * 
 * Run on bsc-testnet: 
 *      `npx hardhat run scripts/AddLPTokentoMasterChefPools.js --network testnetBSC`
 */

const { ethers, network } = require(`hardhat`);
const contracts = require("./constants/contracts")
const addresses = require("./constants/addresses")
const env = require("./constants/env")
require("dotenv").config();

//1 HELIX-BNB :
//2 HELIX-USDT:
//3 BNB-BUSD:  
//4 HELIX-BUSD:
const MasterChefAddress = contracts.masterChef[env.network];
const HelixLP_H_BNB = addresses.HELIX_BNB[env.network]; // update LP token address
const HelixLP_H_BNB_AllocPoint = 1500;

const HelixLP_H_USDT = addresses.HELIX_USDT[env.network]; // update LP token address
const HelixLP_H_USDT_AllocPoint = 1200;

const HelixLP_BNB_BUSD = addresses.BNB_BUSD[env.network]; // update LP token address
const HelixLP_BNB_BUSD_AllocPoint = 1000;

const HelixLP_H_BUSD = addresses.HELIX_BUSD[env.network]; // update LP token address
const HelixLP_H_BUSD_AllocPoint = 1000;

async function main() {
    const rpc =  new ethers.providers.JsonRpcProvider(env.rpcURL) ;
    const admin = new ethers.Wallet( process.env.PRIVATE_KEY, rpc);
    const nonce = await network.provider.send(`eth_getTransactionCount`, [admin.address, "latest"]);
    
    const IMasterChef = await ethers.getContractFactory("MasterChef");
    const masterChef = IMasterChef.attach(MasterChefAddress).connect(admin);
    
    // const IHelixLPToken = await ethers.getContractFactory("HelixLP");
    // const helixLPToken = IHelixLPToken.attach(HelixLPTokenAddress).connect(admin);

    let tx;

    // tx = await masterChef.add(HelixLP_H_BNB_AllocPoint, HelixLP_H_BNB, true, {nonce: nonce, gasLimit: 3000000});
    // await tx.wait();
    // console.log("PoolInfo id 1:", await masterChef.poolInfo('1'));

    // tx = await masterChef.add(HelixLP_H_USDT_AllocPoint, HelixLP_H_USDT, true, {nonce: nonce, gasLimit: 3000000});
    // await tx.wait();
    // console.log("PoolInfo id 2:", await masterChef.poolInfo('2'));

    // tx = await masterChef.add(HelixLP_BNB_BUSD_AllocPoint, HelixLP_BNB_BUSD, true, {nonce: nonce, gasLimit: 3000000});
    // await tx.wait();
    // console.log("PoolInfo id 3:", await masterChef.poolInfo('3'));

    tx = await masterChef.add(HelixLP_H_BUSD_AllocPoint, HelixLP_H_BUSD, true, {nonce: nonce, gasLimit: 3000000});
    await tx.wait();
    console.log("PoolInfo id 4:", await masterChef.poolInfo('4'));

    console.log(`length of Pools: ${await masterChef.poolLength()}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error);
        process.exit(1);
    });