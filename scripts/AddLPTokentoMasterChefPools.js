const hre = require("hardhat")
require("dotenv").config();

const AuraLPTokenAddress = "0x529cce4dd9c2234be9ca724a4158b8f675b22778";
const LPDepositValue = 822;

async function main() {
    const rpc =  new hre.ethers.providers.JsonRpcProvider( process.env.RPC_ENDPOINT ) ;
    const wallet = new hre.ethers.Wallet( process.env.PRIVATE_KEY, rpc);

    const MasterChef = await hre.ethers.getContractFactory("MasterChef");
    const masterChef = MasterChef.attach("0x3E54EdDd13b2909A4047188A1C7b2e4BAF7b656c").connect(wallet);
    
    const AuraLPToken = await hre.ethers.getContractFactory("AuraLP");
    const auraLPToken = AuraLPToken.attach(AuraLPTokenAddress).connect(wallet);

    const transaction = await masterChef.add(LPDepositValue, auraLPToken.address, true);
    console.log(await transaction.wait());

    console.log("PID of the added LP Token:", await masterChef.poolLength());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error);
        process.exit(1);
    });