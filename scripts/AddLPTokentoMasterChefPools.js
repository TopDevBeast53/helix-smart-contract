/**
 * @dev Add LP token to MasterChef
 * 
 * Run on bsc-testnet: 
 *      npx hardhat run scripts/AddLPTokentoMasterChefPools.js --network testnetBSC
 * 
 *      npx hardhat run scripts/AddLPTokentoMasterChefPools.js --network rinkeby
 */

const { ethers, network } = require(`hardhat`);
const contracts = require("./constants/contracts")
const addresses = require("./constants/addresses")
const env = require("./constants/env")
require("dotenv").config();

// HELIX-WETH:  0xfbfe53025c54b70b48070904f8765703D2aD749D
// HELIX-USDC: 0x161962Aec8f3c61D865cd5d53A334780763364e6
// WETH-USDC: 0xf810902563e1a5e5C91C85a110B11dF6Db6cdda9
// DAI-USDC: 0x867A1b846F16886F12f6Ff1a256BeCae3314B1A4
// USDC-USDT: 0x89a218a09b668541c08675A9Cd4e4b2ab2063Aa4
const MasterChefAddress = contracts.masterChef[env.network];
const HELIX_WETH = addresses.HELIX_WETH[env.network]; // update LP token address
const HELIX_WETH_AllocPoint = 1000;

const HELIX_USDC = addresses.HELIX_USDC[env.network]; // update LP token address
const HELIX_USDC_AllocPoint = 1000;

const WETH_USDC = addresses.WETH_USDC[env.network]; // update LP token address
const WETH_USDC_AllocPoint = 1000;

const DAI_USDC = addresses.DAI_USDC[env.network]; // update LP token address
const DAI_USDC_AllocPoint = 1000;

const USDC_USDT = addresses.USDC_USDT[env.network]; // update LP token address
const USDC_USDT_AllocPoint = 1000;

async function main() {
    const rpc =  new ethers.providers.JsonRpcProvider(env.rpcURL) ;
    const admin = new ethers.Wallet( process.env.PRIVATE_KEY, rpc);
    let nonce = await network.provider.send(`eth_getTransactionCount`, [admin.address, "latest"]);
    
    const IMasterChef = await ethers.getContractFactory("MasterChef");
    const masterChef = IMasterChef.attach(MasterChefAddress).connect(admin);
    
    // const IHelixLPToken = await ethers.getContractFactory("HelixLP");
    // const helixLPToken = IHelixLPToken.attach(HelixLPTokenAddress).connect(admin);

    let tx;

    // tx = await masterChef.add(HELIX_WETH_AllocPoint, HELIX_WETH, true, {nonce: nonce++, gasLimit: 3000000});
    // await tx.wait();
    // console.log("PoolInfo id 1:", await masterChef.poolInfo('1'));

    // tx = await masterChef.add(HELIX_USDC_AllocPoint, HELIX_USDC, true, {nonce: nonce++, gasLimit: 3000000});
    // await tx.wait();
    // console.log("PoolInfo id 2:", await masterChef.poolInfo('2'));

    // tx = await masterChef.add(WETH_USDC_AllocPoint, WETH_USDC, true, {nonce: nonce++, gasLimit: 3000000});
    // await tx.wait();
    // console.log("PoolInfo id 3:", await masterChef.poolInfo('3'));

    // tx = await masterChef.add(DAI_USDC_AllocPoint, DAI_USDC, true, {nonce: nonce++, gasLimit: 3000000});
    // await tx.wait();
    // console.log("PoolInfo id 4:", await masterChef.poolInfo('4'));

    // tx = await masterChef.add(USDC_USDT_AllocPoint, USDC_USDT, true, {nonce: nonce++, gasLimit: 3000000});
    // await tx.wait();
    // console.log("PoolInfo id 5:", await masterChef.poolInfo('5'));

    console.log(`length of Pools: ${await masterChef.poolLength()}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error);
        process.exit(1);
    });