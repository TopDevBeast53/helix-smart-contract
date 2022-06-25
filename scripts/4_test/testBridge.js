/**
 * @dev Add LP token to MasterChef
 * 
 * Run on bsc-testnet: 
 *      npx hardhat run scripts/test/testBridge.js --network rinkeby
 */

const { ethers, network } = require(`hardhat`);
const contracts = require("../constants/contracts")
const env = require("../constants/env")
require("dotenv").config();

const bridgeAddress = contracts.helixNFTBridge[env.network];

async function main() {
    const rpc =  new ethers.providers.JsonRpcProvider(env.rpcURL) ;
    const admin = new ethers.Wallet( process.env.PRIVATE_KEY, rpc);
    
    const IBridge = await ethers.getContractFactory("HelixNFTBridge");
    const bridge = IBridge.attach(bridgeAddress).connect(admin);

    let tx
    tx = await bridge.addBridgeFactory('0xb1F7D313Ce45fe62EdE9CE4cfb46833051d38e57',  [
        'HpcZn4ntMXqPK5sPoFNkqjrnLiz9tR7KCGfxjmjjE8AP',
        'Eu6D8FVdptKVzhsfnxEJ7aSa8qj1MBED1PJPsow2h5UH',
        'DgcrpRJ7ZygVfLZcfaHe2MPtUiPMRZo4RqLGeAYcsRkt'
      ], 
      [
        'https://arweave.net/iaBn-emDadrzbgn0xDE0BgCgjAZbAnY7q6PQCYpbE9g?ext=png',
        'https://arweave.net/XOp_icBOjCn7FeLG36zSMqbnG5HwXaGO2QEcQrAqqNY?ext=png',
        ''
      ]
    )
    await tx.wait()
    console.log('add factory done')
    
    console.log(`All factories: ${await bridge.getBridgeFactories('0xb1F7D313Ce45fe62EdE9CE4cfb46833051d38e57')}`)
    console.log(`\n`)

    
    tx = await bridge.bridgeToEthereum(0)
    await tx.wait()
    console.log('done')
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error);
        process.exit(1);
    });