/*
 * deploy Swap Rewards
 * 
 * run from root: 
 *      npx hardhat run scripts/deploy/16_deploySwapRewards.js --network
 */

const { ethers } = require('hardhat')
const { deploySwapRewards } = require("./deployers/deployers")

async function main() {
    const [deployer] = await ethers.getSigners()
    console.log(`Deployer address: ${deployer.address}`)
    await deploySwapRewards(deployer)
    console.log('done')
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
