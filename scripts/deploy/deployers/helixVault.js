const { ethers } = require(`hardhat`)
const { print, getChainId } = require("../../shared/utilities")

const contracts = require('../../../constants/contracts')
const initials = require('../../../constants/initials')

const deployHelixVault = async (deployer) => {
    const chainId = await getChainId()
    const helixTokenAddress = contracts.helixToken[chainId]
    const feeHandlerAddress = contracts.feeHandler[chainId]
    const feeMinterAddress = contracts.feeMinter[chainId]
    const startBlock = initials.HELIX_VAULT_START_BLOCK[chainId]
    const lastRewardBlock = initials.HELIX_VAULT_LAST_REWARD_BLOCK[chainId]
    const collectorPercent = initials.HELIX_VAULT_COLLECTOR_PERCENT[chainId]

    print(`Deploy Helix Vault`);
    print(`helixTokenAddress: ${helixTokenAddress}`)
    print(`feeHandlerAddress: ${feeHandlerAddress}`)
    print(`feeMinterAddress: ${feeMinterAddress}`)
    print(`startBlock: ${startBlock}`)
    print(`lastRewardBlock: ${lastRewardBlock}`)
    print(`collectorPercent: ${collectorPercent}`)

    const VaultContract = await ethers.getContractFactory('HelixVault');
    const vaultProxy = await upgrades.deployProxy(
        VaultContract,
        [
            helixTokenAddress,
            feeHandlerAddress,
            feeMinterAddress,
            startBlock,
            lastRewardBlock,
            collectorPercent
        ]
    )     
    await vaultProxy.deployTransaction.wait();
    
    print(`Helix Vault proxy deployed to ${vaultProxy.address}`);

    const implementationAddress = await upgrades.erc1967.getImplementationAddress(
        vaultProxy.address
    )
    print(`Implementation address: ${implementationAddress}`)
}

module.exports = { deployHelixVault }
