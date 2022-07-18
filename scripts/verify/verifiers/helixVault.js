const { run } = require(`hardhat`)
const { print } = require("../../shared/utilities")

const env = require('../../../constants/env')
const contracts = require('../../../constants/contracts')

const helixVaultAddress = contracts.helixVaultImplementation[env.network]

const verifyHelixVault = async (verifyer) => {
    print(`verify Helix Vault`);

    await run(
        "verify:verify", {
            address: helixVaultAddress,
        }
    )     
}

module.exports = { verifyHelixVault }
