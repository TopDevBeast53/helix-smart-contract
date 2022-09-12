const { ethers } = require(`hardhat`)
const { upgradeHelixChefNft } = require("./upgraders/upgraders")

async function main() {
    const [deployer] = await ethers.getSigners()
    console.log(`Deployer address: ${ deployer.address}`)
    await upgradeHelixChefNft(deployer)
    console.log(`done`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
