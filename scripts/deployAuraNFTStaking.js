//npx hardhat run scripts/deployAuraNFTStaking.js --network testnetBSC
const { ethers, network } = require(`hardhat`);
const {BigNumber} = require("ethers");

/*
* 1. Deploy AuraNFT contract
* 5.
* */

// AuraNFT's _initialAuraPoints
const initialAuraPoints = expandTo18Decimals(1);
// AuraNFT's _levelUpPercent
const levelUpPercent = 10;

function expandTo18Decimals(n) {
    return (new BigNumber.from(n)).mul((new BigNumber.from(10)).pow(18))
}

let auraNft, auraChefNft;

async function main() {

    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${ deployer.address}`);
    
    let nonce = await network.provider.send(`eth_getTransactionCount`, [deployer.address, "latest"]);
    
    console.log(`Start deploying Aura NFT contract`);
    const AuraNFT = await ethers.getContractFactory(`AuraNFT`);
    auraNft = await AuraNFT.deploy(``, initialAuraPoints, levelUpPercent, {nonce: nonce});
    await auraNft.deployTransaction.wait();
    console.log(`Aura NFT deployed to ${auraNft.address}`);

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
