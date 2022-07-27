const { ethers } = require("hardhat")
const { DELEGATION_TYPEHASH } = require("../readers/helixToken")

async function main() {
    const [wallet] = await ethers.getSigners()
    console.log(await DELEGATION_TYPEHASH(wallet))
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
