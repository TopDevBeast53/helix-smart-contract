/**
 * deploy Helix NFT
 *
 * run from root: 
 *      npx hardhat run scripts/0_deploy/5_deployHelixNFT.js --network ropsten
 */

const { ethers } = require(`hardhat`)
const { deployHelixNft } = require("../shared/deploy/deployers")

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
 
