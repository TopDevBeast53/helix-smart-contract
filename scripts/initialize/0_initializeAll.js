/* 
 * @dev Used to (re)connect all contract references to other contracts
 * 
 * Run from project root using:
 *     npx hardhat run scripts/1_connect/0_connectAll.js --network rinkeby
 *     npx hardhat run scripts/1_connect/0_connectAll.js --network ropsten
 */

const { ethers } = require("hardhat");
const { print } = require("../shared/utilities")
const {
    connectFactory,
    initFeeMinter,
    connectHelixChefNft,
    connectHelixNft,
    connectHelixToken,
    connectMasterChef,
    connectReferralRegister,
    connectRouter,
} = require("../shared/connect")

async function main() {
    const [wallet] = await ethers.getSigners()

    await connectFactory(wallet)
    print("\n")

    await initFeeMinter(wallet)
    print("\n")

    await connectHelixChefNft(wallet)
    print("\n")

    await connectHelixNft(wallet)
    print("\n")

    await connectHelixToken(wallet)
    print("\n")

    await connectMasterChef(wallet)
    print("\n")

    await connectReferralRegister(wallet)
    print("\n")

    await connectRouter(wallet)
    print("\n")

    print("done")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
