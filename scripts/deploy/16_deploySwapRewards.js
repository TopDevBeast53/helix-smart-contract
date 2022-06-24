/*
 * deploy Swap Rewards
 * 
 * run from root: 
 *      npx hardhat run scripts/deploy/16_deploySwapRewards.js --network rinkeby
 */

const {ethers} = require('hardhat')
const contracts = require("../constants/contracts")
const env = require("../constants/env")

const helixTokenAddress = contracts.helixToken[env.network]
const oracleFactoryAddress = contracts.oracleFactory[env.network]
const refRegAddress = contracts.referralRegister[env.network]
const routerAddress = contracts.router[env.network]

async function main() {
    const [deployer] = await ethers.getSigners()
    console.log(`Deployer address: ${deployer.address}`)

    console.log('Deploy SwapRewards')
    const contractFactory = await ethers.getContractFactory('SwapRewards')
    const contract = await contractFactory.deploy(
        helixTokenAddress,
        oracleFactoryAddress,
        refRegAddress,
        routerAddress
    )
    await contract.deployTransaction.wait()

    console.log(`swapRewards deployed to ${contract.address}`)
    console.log('done')
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
