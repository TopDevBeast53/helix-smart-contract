/**
 * @dev FeeHandler deployment script
 * 
 * command for deploy on rinkeby: 
 *      npx hardhat run scripts/6_deployFeeMinter.js --network rinkeby
 */

const { ethers, upgrades } = require("hardhat")
const initials = require("./constants/initials")
const env = require("./constants/env")

const totalToMintPerBlock = initials.FEE_MINTER_TOTAL_TO_MINT_PER_BLOCK[env.network]

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${deployer.address}`);

    console.log(`------ Start deploying FeeMinter ---------`);
    console.log(`FEE_MINTER_TOTAL_TO_MINT_PER_BLOCK: ${totalToMintPerBlock}`)

    const ContractFactory = await ethers.getContractFactory('FeeMinter');
    const contract = await ContractFactory.deploy(totalToMintPerBlock);
    await contract.deployTransaction.wait();
    console.log(`FeeMinter deployed to ${contract.address}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
 