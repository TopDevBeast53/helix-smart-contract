const { run } = require('hardhat');
const { print, getChainId } = require("../../shared/utilities")

const contracts = require("../../../constants/contracts")

const verifyMigrator = async () => {
    const chainId = await getChainId()
    const migratorAddress = contracts.helixMigrator[chainId]
    const routerAddress = contracts.router[chainId];

    print('verify Migrator');
    print(`migratorAddress: ${migratorAddress}`)
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
