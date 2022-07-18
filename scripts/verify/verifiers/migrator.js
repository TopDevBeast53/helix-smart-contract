const { run } = require('hardhat');
const { print } = require("../../shared/utilities")

const env = require("../../../constants/env")
const contracts = require("../../../constants/contracts")

const migratorAddress = contracts.helixMigrator[env.network]

const routerAddress = contracts.router[env.network];

const verifyMigrator = async () => {
    print('verify Migrator');
    print(`routerAddress: ${routerAddress}`)

    await run(
        "verify:verify", {
            address: migratorAddress,
            constructorArguments: [
                routerAddress
            ]
        }
    )
}

module.exports = { verifyMigrator }
