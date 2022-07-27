const { ethers } = require("hardhat")
const { allowance } = require("../readers/helixToken")

async function main(owner, spender) {
    const [wallet] = await ethers.getSigners()
    console.log(await allowance(wallet, owner, spender))
}

main("0xee936e648cD998e9df4531dF77EF2D2AECA5921b", "0x51606CAdD699fa80B8bFc3375103259e5ed7C195")
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
