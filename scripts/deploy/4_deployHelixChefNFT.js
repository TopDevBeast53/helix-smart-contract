/**
 * deply Helix NFT
 *
 * run from root: 
 *      npx hardhat run scripts/deploy/4_deployHelixChefNFT.js --network rinkeby
 */

 const { ethers, network, upgrades } = require(`hardhat`)
 const contracts = require("../constants/contracts")
 const env = require("../constants/env")
 
 const rewardToken = contracts.helixToken[env.network];
 const helixNFTAddress = contracts.helixNFT[env.network];
 
 async function main() {
     const [deployer] = await ethers.getSigners()
     console.log(`Deployer address: ${ deployer.address}`)
     
     let nonce = await network.provider.send(
         `eth_getTransactionCount`, 
         [deployer.address, "latest"]
     )
     
     console.log(`Deploy Upgradeable Helix Chef NFT`)
     const HelixChefNftFactory = await ethers.getContractFactory(`HelixChefNFT`)
     const helixChefNftProxy = await upgrades.deployProxy(
         HelixChefNftFactory, 
         [helixNFTAddress, rewardToken], 
         {nonce: nonce++}
     )
     await helixChefNftProxy.deployTransaction.wait()
     console.log(`Helix Chef NFT Proxy address: ${helixChefNftProxy.address}`)
 
     const helixChefNftImplementationAddress = await upgrades.erc1967.getImplementationAddress(
         helixChefNftProxy.address
     )
     console.log(`Helix Chef NFT Implementation address: ${helixChefNftImplementationAddress}`)   
     console.log('done')
 }
 
 main()
     .then(() => process.exit(0))
     .catch((error) => {
         console.error(error)
         process.exit(1)
     });
  
 
