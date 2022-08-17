const { run } = require(`hardhat`)
const { print, getChainId } = require("../../shared/utilities")

const contracts = require('../../../constants/contracts')

const verifyHelixVault = async (verifyer) => {
    const chainId = await getChainId()
    const helixVaultAddress = contracts.helixVaultImplementation[chainId]

    print(`verify Helix Vault`);
    print(`helixVaultAddress: ${helixVaultAddress}`)

    await run(
        "verify:verify", {
            address: helixVaultAddress,
        }
    )     
}

module.exports = { verifyHelixVault }
