/**
 * upgrade Master Chef
 *
 * run from root:
 *      npx hardhat run scripts/upgrade/masterChef.js --network
 */

const { ethers } = require(`hardhat`)
const { upgradeMasterChef } = require("./upgraders/upgraders")

async function main() {
    const [deployer] = await ethers.getSigners()
    console.log(`Deployer address: ${ deployer.address}`)
    await upgradeMasterChef(deployer)
    console.log(`done`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
