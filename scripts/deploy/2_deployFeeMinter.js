/**
 * deploy FeeHandler
 * 
 * run from root: 
 *      npx hardhat run scripts/deploy/2_deployFeeMinter.js --network rinkeby
 */

const { ethers, upgrades } = require("hardhat")
const initials = require("../constants/initials")
const env = require("../constants/env")

const totalToMintPerBlock = initials.FEE_MINTER_TOTAL_TO_MINT_PER_BLOCK[env.network]

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${deployer.address}`);

    console.log(`------ Start deploying FeeMinter ---------`);
    console.log(`total to mint per block: ${totalToMintPerBlock}`)

    const ContractFactory = await ethers.getContractFactory('FeeMinter');
    const contract = await ContractFactory.deploy(totalToMintPerBlock);
    await contract.deployTransaction.wait();
    console.log(`FeeMinter deployed to ${contract.address}`);
    console.log('done')
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
 
