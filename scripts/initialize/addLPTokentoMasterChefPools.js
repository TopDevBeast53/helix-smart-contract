/**
 * @dev Add LP token to MasterChef
 * 
 * Run on bsc-testnet: 
 *      npx hardhat run scripts/initialize/AddLPTokentoMasterChefPools.js --network testnetBSC
 *      npx hardhat run scripts/initialize/AddLPTokentoMasterChefPools.js --network rinkeby
 */
const { ethers, network } = require(`hardhat`);
const contracts = require("../constants/contracts")
const initials = require("../constants/initials")
const env = require("../constants/env")

const verbose = true

/// Wallet making the transactions in this script
let wallet
/// The contract whose setters are being called by this script
let contract
let nonce

const masterChefAddress = contracts.masterChef[env.network];
const lpTokenAddresses = initials.MASTERCHEF_LPTOKEN_ADDRESSES[env.network];
const allocPointValues = initials.MASTERCHEF_ALLOC_POINTS[env.network];

/// Console.log str if verbose is true and false otherwise
function print(str) {
    if (verbose) console.log(str)
}

async function addLiquidity(lpTokenAddress, allocPoint) {
    print(`add liquidity with LpToken:${lpTokenAddress}  AllocPoins:${allocPoint}`)
    const tx = await contract.add(allocPoint, lpTokenAddress, true, {nonce: nonce++, gasLimit: 3000000})
    await tx.wait()
}

/// Load the contract that will be used in this script
async function load() {   
    // Load the wallet
    [wallet] = await ethers.getSigners()
    print(`load wallet: ${wallet.address}`)

    const rpc =  new ethers.providers.JsonRpcProvider(env.rpcURL) ;
    const admin = new ethers.Wallet( process.env.PRIVATE_KEY, rpc);
    nonce = await network.provider.send(`eth_getTransactionCount`, [admin.address, "latest"]);

    print(`load masterChef: ${masterChefAddress}`)
    const contractFactory = await ethers.getContractFactory('MasterChef')
    contract = contractFactory.attach(masterChefAddress).connect(wallet)
}

async function main() {
    await load() 

    if (lpTokenAddresses.length != allocPointValues.length) {
        print(`Error: different length between LpTokenAddresses and allocPointValues `)
        return
    }
    for (let i = 0; i < lpTokenAddresses.length; i++) {
        await addLiquidity(lpTokenAddresses[i], allocPointValues[i])
    }
    print(`length of Pools: ${await contract.poolLength()}`);
    print('done')
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error);
        process.exit(1);
    });