const { ethers } = require("hardhat")
const { DOMAIN_TYPEHASH } = require("../readers/helixToken")

async function main() {
    const [wallet] = await ethers.getSigners()
    console.log(await DOMAIN_TYPEHASH(wallet))
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
