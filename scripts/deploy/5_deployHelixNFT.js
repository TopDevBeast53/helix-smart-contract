/**
 * deploy Helix NFT
 *
 * run from root: 
 *      npx hardhat run scripts/deploy/5_deployHelixNFT.js --network
 */

const { ethers } = require(`hardhat`)
const { deployHelixNft } = require("./deployers/deployers")

async function main() {
    const [deployer] = await ethers.getSigners()
    console.log(`Deployer address: ${ deployer.address}`)
    await deployHelixNft(deployer)
    console.log('done')
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    });
 
