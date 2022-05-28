/**
 * @dev Helix NFT Deployment 
 *
 * command for deploy on bsc-testnet: 
 * 
 *      npx hardhat run scripts/5_deployHelixNftStaking.js --network testnetBSC
 * 
 *      npx hardhat run scripts/5_deployHelixNftStaking.js --network rinkeby
 */

const { ethers, network, upgrades } = require(`hardhat`)
const contracts = require("./constants/contracts")
const env = require("./constants/env")

const rewardToken = contracts.helixToken[env.network];

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

    console.log(`Deploy Upgradeable Helix Chef NFT`)
    const HelixChefNftFactory = await ethers.getContractFactory(`HelixChefNFT`)
    const helixChefNftProxy = await upgrades.deployProxy(
        HelixChefNftFactory, 
        [helixNftProxy.address, rewardToken], 
        {nonce: nonce++}
    )
    await helixChefNftProxy.deployTransaction.wait()
    console.log(`Helix Chef NFT Proxy address: ${helixChefNftProxy.address}`)

    const helixChefNftImplementationAddress = await upgrades.erc1967.getImplementationAddress(
        helixChefNftProxy.address
    )
    console.log(`Helix Chef NFT Implementation address: ${helixChefNftImplementationAddress}`)   

    console.log(`Add helix chef nft as staker to helix nft`)
    let tx = await helixNftProxy.addStaker(helixChefNftProxy.address, {gasLimit: 3000000})
    await tx.wait()
    
    // console.log(`Add deployer address as minter to helix nft`)
    // tx = await helixNftProxy.addMinter(deployer.address, {gasLimit: 3000000, nonce: nonce++})
    // await tx.wait()
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    });
 
