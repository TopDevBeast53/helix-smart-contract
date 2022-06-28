const { run } = require(`hardhat`)
const { print } = require("../utilities")

const env = require('../../constants/env')
const contracts = require('../../constants/contracts')
const initials = require('../../constants/initials')

const helixVaultAddress = contracts.helixVault[env.network]

const helixTokenAddress = contracts.helixToken[env.network]
const feeHandlerAddress = contracts.feeHandler[env.network]
const feeMinterAddress = contracts.feeMinter[env.network]
const startBlock = initials.HELIX_VAULT_START_BLOCK[env.network]
const lastRewardBlock = initials.HELIX_VAULT_LAST_REWARD_BLOCK[env.network]

const verifyHelixVault = async (verifyer) => {
    print(`verify Helix Vault`);
    print(`helixTokenAddress: ${helixTokenAddress}`)
    print(`feeHandlerAddress: ${feeHandlerAddress}`)
    print(`feeMinterAddress: ${feeMinterAddress}`)
    print(`startBlock: ${startBlock}`)
    print(`lastRewardBlock: ${lastRewardBlock}`)

    await run(
        "verify:verify", {
            address: helixVaultAddress,
            constructorArguments: [
                helixTokenAddress,
                feeHandlerAddress,
                feeMinterAddress,
                startBlock,
                lastRewardBlock
            ]
        }
    )     
}

module.exports = { verifyHelixVault }
