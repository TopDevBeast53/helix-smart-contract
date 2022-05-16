/**
 * @dev AutoHelix Deployment
 *
 * command for deploy on bsc-testnet: 
 * 
 *      npx hardhat run scripts/15_deployMulticall.js --network testnetBSC
 * 
 *      npx hardhat run scripts/15_deployMulticall.js --network rinkeby
 */
const { ethers, network } = require(`hardhat`);

async function main() {

    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${ deployer.address}`);

    console.log(`------ Start deploying Multicall2 contract ---------`);
    const Multicall2 = await ethers.getContractFactory(`Multicall2`);
    let contract = await Multicall2.deploy();
    await contract.deployTransaction.wait();
    console.log(`Multicall2 deployed to ${contract.address}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
