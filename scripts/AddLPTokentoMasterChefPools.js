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

// AURA-BUSD : 0xB024cd9a1Fe32D615ee6EF7137E355A422b3d9d7
const MasterChefAddress = contracts.masterChef[env.network];
const AuraLPTokenAddress = "0xB024cd9a1Fe32D615ee6EF7137E355A422b3d9d7"; // update LP token address
const LPDepositValue = 822;

async function main() {
    const rpc =  new ethers.providers.JsonRpcProvider(env.rpcURL) ;
    const admin = new ethers.Wallet( process.env.PRIVATE_KEY, rpc);
    const nonce = await network.provider.send(`eth_getTransactionCount`, [admin.address, "latest"]);
    
    const IMasterChef = await ethers.getContractFactory("MasterChef");
    const masterChef = IMasterChef.attach(MasterChefAddress).connect(admin);
    
    const IAuraLPToken = await ethers.getContractFactory("AuraLP");
    const auraLPToken = IAuraLPToken.attach(AuraLPTokenAddress).connect(admin);

    const transaction = await masterChef.add(LPDepositValue, auraLPToken.address, true, {nonce: nonce, gasLimit: 3000000});
    console.log(await transaction.wait());

    console.log("PID of the added LP Token:", await masterChef.poolLength());
    console.log("PoolInfo:", await masterChef.poolInfo('1'));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error);
        process.exit(1);
    });