const { ethers } = require(`hardhat`)
const { upgradeSynthReactor } = require("./upgraders/upgraders")

async function main() {
    const [deployer] = await ethers.getSigners()
    console.log(`Deployer address:\t${deployer.address}`)
    await upgradeSynthReactor(deployer)
    console.log(`done`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
