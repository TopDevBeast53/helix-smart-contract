/**
 * @dev Add LP token to MasterChef
 * 
 * Run on bsc-testnet: 
 *      npx hardhat run scripts/testYieldSwap.js --network testnetBSC
 * 
 *      npx hardhat run scripts/testYieldSwap.js --network rinkeby
 */

const { ethers, network } = require(`hardhat`);
const contracts = require("./constants/contracts")
const addresses = require("./constants/addresses")
const env = require("./constants/env")
require("dotenv").config();

const yieldSwapAddress = contracts.yieldSwap[env.network];
const LpHelixWETHToken = addresses.HELIX_WETH[env.network];
const helixToken = contracts.helixToken[env.network];

async function main() {
    const rpc =  new ethers.providers.JsonRpcProvider(env.rpcURL) ;
    const admin = new ethers.Wallet( process.env.PRIVATE_KEY, rpc);
    
    const ILpToken = await ethers.getContractFactory("HelixToken");
    const lp = ILpToken.attach(LpHelixWETHToken).connect(admin);

    const IYieldSwap = await ethers.getContractFactory("YieldSwap");
    const ys = IYieldSwap.attach(yieldSwapAddress).connect(admin);
    
    let tx
    tx = await lp.approve(yieldSwapAddress, '100000000000000000000000000')
    await tx.wait()
 
    // console.log(`adding an Order`)
    // tx = await ys.openSwap(LpHelixWETHToken, helixToken, 1, 10, 1000, true, false)
    // await tx.wait()

    console.log(`All swaps: ${await ys.getSwaps()}`)
    
    // tx = await ys.makeBid(2, 10)
    // await tx.wait()

    // console.log(`All bids: ${await ys.bids(0)}`)
    // console.log(`\n`)

    // console.log(`swaps id 2: ${await ys.swaps(2)}`)
    console.log(`\n`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error);
        process.exit(1);
    });