/**
 * deploy Swap Rewards
 *
 * run from root:
 *      npx hardhat run scripts/12_deploySwapRewards.js --network rinkeby
 */

// Define script parameters
const { ethers } = require(`hardhat`)
const contracts = require('./constants/contracts')
const env = require('./constants/env')

const helixTokenAddress = contracts.helixToken[env.network]
const oracleFactoryAddress = contracts.oracleFactory[env.network]
const refRegAddress = contracts.referralRegister[env.network]
const routerAddress = contracts.router[env.network]

async function main() {
    const [deployer] = await ethers.getSigners()
    (`Deployer address: ${deployer.address}\n`)

    // Deploy the SwapRewards contract
    const SwapRewards = await ethers.getContractFactory('SwapRewards')
    const swapRewards = await SwapRewards.deploy(
        helixTokenAddress,
        oracleFactoryAddress,
        refRegAddress,
        routerAddress
    )
    await swapRewards.deployTransaction.wait()
    console.log(`swapRewards deployed to ${swapRewards.address}`)

    console.log('done')
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
