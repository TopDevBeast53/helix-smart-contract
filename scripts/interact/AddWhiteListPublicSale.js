/**
 * @dev Add LP token to MasterChef
 * 
 * Run on bsc-testnet: 
 * 
 *      npx hardhat run scripts/interact/AddWhiteListPublicSale.js --network rinkeby
 */

const { ethers, network } = require(`hardhat`);
const contracts = require("../constants/contracts")
const env = require("../constants/env");
require("dotenv").config();

const publicSaleAddress = contracts.publicSale[env.network];

const addresses = ['0xee936e648cD998e9df4531dF77EF2D2AECA5921b', '0x2155BCeA4f362D5D9CE67817b826A8F31b61D0BF']

async function main() {
    const rpc = new ethers.providers.JsonRpcProvider(env.rpcURL);
    const admin = new ethers.Wallet(process.env.PRIVATE_KEY, rpc);

    const IVipPresale = await ethers.getContractFactory('PublicPresale')
    const VipPresale = IVipPresale.attach(publicSaleAddress).connect(admin);
    console.log(`Add WhiteList...`)
    const len = addresses.length;
    
    for (let i = 0; i < len; i += 20) {
        console.log(`from:${i}  to:${Math.min(i + 20, len) - 1} doing...`)
        console.log(`address i    == ${addresses[i]}`)
        console.log(`address i+19 == ${addresses[Math.min(i+19, len)]}`) 
        const txx = await VipPresale.whitelistAdd(
            addresses.slice(i, Math.min(i + 20, len)))
        await txx.wait()
        console.log(`done`)
    }
    console.log(`All Completed`)
    console.log(`\n`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error);
        process.exit(1);
    });
