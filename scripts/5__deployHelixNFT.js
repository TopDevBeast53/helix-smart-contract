/**
 * @dev Helix NFT Deployment 
 *
 * command for deploy on bsc-testnet: 
 * 
 *      npx hardhat run scripts/5__deployHelixNFT.js --network rinkeby
 */

const { ethers, network, upgrades } = require(`hardhat`)

async function main() {
    const [deployer] = await ethers.getSigners()
    console.log(`Deployer address: ${ deployer.address}`)
    
    let nonce = await network.provider.send(
        `eth_getTransactionCount`, 
        [deployer.address, "latest"]
    )
    
    console.log(`Deploy Upgradeable Helix NFT`)
    const helixNftFactory = await ethers.getContractFactory(`HelixNFT`)
    const helixNftProxy = await upgrades.deployProxy(helixNftFactory, [``], {nonce: nonce++})
    await helixNftProxy.deployTransaction.wait()
    console.log(`Helix NFT proxy address: ${helixNftProxy.address}`)

    const helixNftImplementationAddress = await upgrades.erc1967.getImplementationAddress(
        helixNftProxy.address
    )
    console.log(`Helix NFT Implementation address: ${helixNftImplementationAddress}`)   
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    });
 
