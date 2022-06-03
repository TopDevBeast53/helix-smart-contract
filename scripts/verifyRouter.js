/**
 * @dev Verify the deployed Router contract
 *
 * command for verify on bsc-testnet: 
 * 
 *      npx hardhat run scripts/verifyRouter.js --network rinkeby 
 */

const hre = require('hardhat')
const env = require('./constants/env')
const addresses = require('./constants/addresses')
const contracts = require('./constants/contracts')
const externalContracts = require('./constants/externalContracts')

const routerAddress = externalContracts.router[env.network]
const factoryAddress = contracts.factory[env.network]
const wethAddress = addresses.WETH[env.network] 

async function main() {
    console.log(`Verify Router contract`)
    console.log(`router address ${routerAddress}`)
    console.log(`factory address ${factoryAddress}`)
    console.log(`weth address ${wethAddress}`)
    await hre.run(
        "verify:verify", { 
            address: routerAddress, 
            constructorArguments: [
                factoryAddress,
                wethAddress
            ] 
        }
    )
    console.log('done')
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
