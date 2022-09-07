/*
 * deploy Payment Splitter
 * 
 * run from root:
 *      npx hardhat run scripts/deploy/paymentSplitter.js --network 
 */

const { ethers } = require("hardhat")
const { deployAirdropPaymentSplitter } = require("./deployers/deployers")

async function main() {
    const [deployer] = await ethers.getSigners()
    console.log(`Deployer address: ${deployer.address}`)
    await deployAirdropPaymentSplitter(deployer)
    console.log(`done`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
