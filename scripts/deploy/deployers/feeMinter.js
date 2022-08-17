const { ethers, upgrades } = require("hardhat")
const { print, getChainId } = require("../../shared/utilities")

const initials = require("../../../constants/initials")


const deployFeeMinter = async (deployer) => {
    const chainId = await getChainId()
    const totalToMintPerBlock = initials.FEE_MINTER_TOTAL_TO_MINT_PER_BLOCK[chainId]

    print("deploy fee minter");
    print(`total to mint per block: ${totalToMintPerBlock}`)

    const ContractFactory = await ethers.getContractFactory('FeeMinter');
    const contract = await ContractFactory.deploy(totalToMintPerBlock);
    await contract.deployTransaction.wait();
    print(`FeeMinter deployed to ${contract.address}`);
}

module.exports = { deployFeeMinter }
