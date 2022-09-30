const { ethers } = require(`hardhat`)
const { deploySynthReactor } = require("./deployers/deployers")

async function main() {
    const [deployer] = await ethers.getSigners()
    console.log(`Deployer address:\t${deployer.address}`)
    await deploySynthReactor(deployer)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
