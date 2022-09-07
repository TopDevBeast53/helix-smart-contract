/**
 * @dev Add LP token to MasterChef
 * 
 * Run on bsc-testnet: 
 *      npx hardhat run scripts/testHelixVault.js --network testnetBSC
 *      npx hardhat run scripts/testHelixVault.js --network rinkeby
 */

const { ethers, network } = require(`hardhat`);
const { getChainId, getRpcUrl } = require("../shared/utilities")
const contracts = require("./constants/contracts")
require("dotenv").config();

async function main() {
    const chainId = await getChainId()
    const helixVaultAddress = contracts.helixVault[chainId];
    const helixToken = contracts.helixToken[chainId];

    const rpcUrl = getRpcUrl()
    const rpc =  new ethers.providers.JsonRpcProvider(rpcUrl) ;
    const admin = new ethers.Wallet( process.env.PRIVATE_KEY, rpc);
    
    const IHelixToken = await ethers.getContractFactory("HelixToken");
    const helix = IHelixToken.attach(helixToken).connect(admin);

    // const tx = await helix.approve(helixVaultAddress, '100000000000000000000000000')
    // await tx.wait()

    const IHelixVault = await ethers.getContractFactory("HelixVault");
    const vault = IHelixVault.attach(helixVaultAddress).connect(admin);

    // const t1 = await vault.deposit('1000000000000000000', 0, 0)
    // await t1.wait()

    // console.log(`PendingReward DepositIDs: ${await vault.pendingReward(1)}`)
    // console.log(`last DepositID: ${await vault.depositId()}`)
    // console.log(`PRECISION_FACTOR: ${await vault.PRECISION_FACTOR()}`)
    
    console.log(`\n`)

    // console.log(`Claiming`)
    // const t2 = await vault.claimReward(1)
    // await t2.wait()

    // console.log(`\n`)

    // console.log(`adding duration`)
    // const t2 = await vault.addDuration(60, 50)
    // await t2.wait()

    // console.log(`\n`)

    console.log(`done`)

    console.log("DepositIDs:", await vault.getDepositIds("0x5e3A0B1aaccd48E92D6BB9886F9C5159c773f9B2"));
    console.log("Deposit by id 1:", await vault.deposits(1));
    console.log("Deposit by id 1:", await vault.depositId());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error);
        process.exit(1);
    });
