const { ethers, upgrades } = require("hardhat")
const { print } = require("../../shared/utilities")

const env = require("../../../constants/env")
const initials = require("../../../constants/initials")

const totalToMintPerBlock = initials.FEE_MINTER_TOTAL_TO_MINT_PER_BLOCK[env.network]

const deployFeeMinter = async (deployer) => {
    print("deploy fee minter");
    print(`total to mint per block: ${totalToMintPerBlock}`)

    const ContractFactory = await ethers.getContractFactory('FeeMinter');
    const contract = await ContractFactory.deploy(totalToMintPerBlock);
    await contract.deployTransaction.wait();
    print(`FeeMinter deployed to ${contract.address}`);
}

module.exports = { deployFeeMinter }
