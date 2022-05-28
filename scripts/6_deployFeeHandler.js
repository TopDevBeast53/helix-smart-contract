/**
 * @dev FeeHandler deployment script
 * 
 * command for deploy on bsc-testnet: 
 *      npx hardhat run scripts/6_deployFeeHandler.js --network testnetBSC
 * command for deploy on rinkeby: 
 *      npx hardhat run scripts/6_deployFeeHandler.js --network rinkeby
 */

const { ethers, upgrades } = require("hardhat")
const addresses = require("./constants/addresses")
const contracts = require("./constants/contracts")
const env = require("./constants/env")

const treasuryAddress = addresses.TREASURY[env.network]
const nftChefAddress = contracts.helixChefNFT[env.network]
const feeHandlerAddress = contracts.feeHandler[env.network]

async function main() {

    console.log(`Register fee handler as nft chef accruer`)
    const NftChef = await ethers.getContractFactory("HelixChefNFT")
    const nftChef = await NftChef.attach(nftChefAddress)
    let tx = await nftChef.addAccruer(feeHandlerAddress)
    await tx.wait()
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
