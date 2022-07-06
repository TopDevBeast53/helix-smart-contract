const { ethers } = require(`hardhat`)
const { print } = require("../../shared/utilities")

const env = require('../../../constants/env')
const contracts = require('../../../constants/contracts')
const initials = require('../../../constants/initials')

const helixTokenAddress = contracts.helixToken[env.network]
const feeHandlerAddress = contracts.feeHandler[env.network]
const feeMinterAddress = contracts.feeMinter[env.network]
const startBlock = initials.HELIX_VAULT_START_BLOCK[env.network]
const lastRewardBlock = initials.HELIX_VAULT_LAST_REWARD_BLOCK[env.network]
const collectorPercent = initials.HELIX_VAULT_COLLECTOR_PERCENT[env.network]

const deployHelixVault = async (deployer) => {
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
