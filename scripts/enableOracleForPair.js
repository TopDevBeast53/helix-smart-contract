/*
 * @dev Deployment script for Oracle contract.
 *
 * Run from project root using:
 *     npx hardhat run scripts/enableOracleForPair.js --network testnetBSC
 */

const { ethers } = require(`hardhat`);

const FactoryAddress = '0x84f22547020f582Deef1eb1B57b3b213D5997471'; // <-- update me
const PairAddress = ''; // <-- update me

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${deployer.address}`);

    console.log(`------ Enable Pair for Oracle in Factory ---------`);
    console.log(`------ Pair Address = ${PairAddress}, Factory Address = ${FactoryAddress}`)
     const AuraFactory = await ethers.getContractFactory(`AuraFactory`);
     const f = AuraFactory.attach(AuraTokenAddress);

     let tx = await f.enablePair(contract.address, {gasLimit: 3000000});
     await tx.wait();
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
