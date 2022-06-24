/**
 * deploy Master Chef
 *
 * run from root:
 *      npx hardhat run scripts/deploy/17_deployMasterChef.js --network rinkeby
 */

const { ethers, upgrades } = require(`hardhat`);
const contracts = require("../constants/contracts")
const addresses = require("../constants/addresses")
const initials = require("../constants/initials")
const env = require("../constants/env")

const HelixTokenAddress = contracts.helixToken[env.network];
const referralRegisterAddress = contracts.referralRegister[env.network];
const feeMinterAddress = contracts.feeMinter[env.network];
const DeveloperAddress = addresses.masterChefDeveloper[env.network];
const StartBlock = initials.MASTERCHEF_START_BLOCK[env.network];
const StakingPercent = initials.MASTERCHEF_STAKING_PERCENT[env.network];
const DevPercent = initials.MASTERCHEF_DEV_PERCENT[env.network];

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${ deployer.address}`);
    
    if (DevPercent + StakingPercent != 1000000) {
        console.log('DevPercent + StakingPercent != 1000000');
        return;
    }

    console.log(`------ Start deploying Master Chef contract ---------`);
    const MasterChef = await ethers.getContractFactory(`MasterChef`);
    const chef = await upgrades.deployProxy(MasterChef, [
        HelixTokenAddress,
        DeveloperAddress,
        feeMinterAddress,
        StartBlock,
        StakingPercent,
        DevPercent,
        referralRegisterAddress
    ]);

    await chef.deployTransaction.wait();
    console.log(`Master Chef deployed to ${chef.address}`);

    const implementationAddress = await upgrades.erc1967.getImplementationAddress(
        chef.address
    )
    console.log(`Implementation address: ${implementationAddress}`)

    console.log(`done`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
