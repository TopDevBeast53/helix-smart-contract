/**
 * @dev Add LP token to MasterChef
 * 
 * Run on bsc-testnet: 
 *      `npx hardhat run scripts/AddLPTokentoMasterChefPools.js --network testnetBSC`
 */

const { ethers, network } = require(`hardhat`);
const contracts = require("./constants/contracts")
const env = require("./constants/env")
require("dotenv").config();

//1 HELIX-BNB : 0xf2E8F8697539394089CBF666425924a26B8A88da
//2 HELIX-USDT:   0x1cc66Fc2196b619625e72970555F73e7ddE31eaC
//3 BNB-BUSD:    0xad9cFF1Cf4440B5e47812AFA76292bA69b2f5f16
//4 HELIX-BUSD:   0x204f1FbFe8cA19BEe4dbf11f70c618E974bC0CF0
const MasterChefAddress = contracts.masterChef[env.network];
const HelixLPTokenAddress = "0x204f1FbFe8cA19BEe4dbf11f70c618E974bC0CF0"; // update LP token address
const allocPoint = 1500;

async function main() {
    const rpc =  new ethers.providers.JsonRpcProvider(env.rpcURL) ;
    const admin = new ethers.Wallet( process.env.PRIVATE_KEY, rpc);
    const nonce = await network.provider.send(`eth_getTransactionCount`, [admin.address, "latest"]);
    
    const IMasterChef = await ethers.getContractFactory("MasterChef");
    const masterChef = IMasterChef.attach(MasterChefAddress).connect(admin);
    
    const IHelixLPToken = await ethers.getContractFactory("HelixLP");
    const helixLPToken = IHelixLPToken.attach(HelixLPTokenAddress).connect(admin);

    const transaction = await masterChef.add(allocPoint, helixLPToken.address, true, {nonce: nonce, gasLimit: 3000000});
    console.log(await transaction.wait());

    console.log("PID of the added LP Token:", await masterChef.poolLength());
    console.log("PoolInfo 1:", await masterChef.poolInfo('1'));
    console.log("PoolInfo 2:", await masterChef.poolInfo('2'));
    console.log("PoolInfo 3:", await masterChef.poolInfo('3'));
    console.log("PoolInfo 4:", await masterChef.poolInfo('4'));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error);
        process.exit(1);
    });