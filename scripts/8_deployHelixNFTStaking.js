/**
 * @dev Helix NFT Deployment 
 *
 * command for deploy on bsc-testnet: 
 * 
 *      npx hardhat run scripts/8_deployHelixNftStaking.js --network testnetBSC
 * 
 *      npx hardhat run scripts/8_deployHelixNftStaking.js --network rinkeby
 */

const { ethers, network, upgrades } = require(`hardhat`)
const contracts = require("./constants/contracts")
const env = require("./constants/env")

async function main() {
    const [deployer] = await ethers.getSigners()
    console.log(`Deployer address: ${ deployer.address}`)
    
    const nonce = await network.provider.send(
        `eth_getTransactionCount`, 
        [deployer.address, "latest"]
    )
    
    console.log(`Deploy Upgradeable Helix NFT`)
    const helixNftFactory = await ethers.getContractFactory(`HelixNFT`)
    helixNftProxy = await upgrades.deployProxy(HelixNftFactory, [``], {nonce: nonce})
    await helixNftProxy.deployTransaction.wait()
    console.log(`Helix NFT proxy address: ${helixNftProxy.address}`)

    const helixNftImplementationAddress = await upgrades.erc1967.getImplementationAddress(
        helixNftProxy.address
    )
    console.log(`Helix NFT Implementation address: ${helixNftImplementationAddress}`)   

    console.log(`Deploy Upgradeable Helix Chef NFT`)
    const HelixChefNftFactory = await ethers.getContractFactory(`HelixChefNFT`)
    const helixChefNftProxy = await upgrades.deployProxy(
        HelixChefNftFactory, 
        [helixNft.address, rewardToken], 
        {nonce: nonce}
    )
    await helixChefNftProxy.deployTransaction.wait()
    console.log(`Helix Chef NFT Proxy address: ${helixChefNftProxy.address}`)

    const helixChefNftImplementationAddress = await upgrades.erc1967.getImplementationAddress(
        helixChefNftProxy.address
    )
    console.log(`Helix Chef NFT Implementation address: ${helixChefNftImplementationAddress}`)   

    console.log(`Add helix chef nft as staker to helix nft`)
    let tx = await helixNft.addStaker(helixChefNft.address, {gasLimit: 3000000})
    await tx.wait()
    
    console.log(`Add deployer address as minter to helix nft`)
    tx = await helixNft.addMinter(deployer.address, {gasLimit: 3000000})
    await tx.wait()

    console.log(`Do NOT forget to fund the newly deployed HelixNFTChef with reward token!`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    });
 
