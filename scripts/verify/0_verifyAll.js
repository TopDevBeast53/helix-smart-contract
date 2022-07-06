/**
 * @dev Verify the deployed contracts
 *
 * command for verify on testnet:
 *      npx hardhat run scripts/5_verify/0_verifyAll.js --network ropsten
 */

const { print } = require("../shared/utilities")

const {
    verifyOwnerMultiSig,
    verifyTreasuryMultiSig,
    verifyDevTeamMultiSig,
    verifyTimelock,
    verifyHelixToken,
    verifyHelixNft,
    verifyFeeMinter,
    verifyHelixNftBridge,
    verifyHelixChefNft,
    verifyFeeHandler,
    verifyReferralRegister,
    verifyHelixVault,
    verifyFactory,
    verifyOracleFactory,
    verifyRouter,
    verifyMigrator,
    verifySwapRewards,
    verifyMasterChef,
    verifyAutoHelix,
    verifyMulticall,
} = require("../shared/verify/verifiers")

async function main() {
    await verifyOwnerMultiSig()
    print("\n")
    
    await verifyTreasuryMultiSig()
    print("\n")

    await verifyDevTeamMultiSig()
    print("\n")

    await verifyTimelock()
    print("\n")

    await verifyHelixToken()
    print("\n")

    await verifyHelixNft()
    print("\n")
    
    await verifyFeeMinter()
    print("\n")

    await verifyHelixNftBridge()
    print("\n")

    await verifyHelixChefNft()
    print("\n")

    await verifyFeeHandler()
    print("\n")
    
    await verifyReferralRegister()
    print("\n")

    await verifyHelixVault()
    print("\n")

    await verifyFactory()
    print("\n")

    await verifyOracleFactory()
    print("\n")

    await verifyRouter()
    print("\n")

    await verifyMigrator()
    print("\n")

    await verifySwapRewards()
    print("\n")

    await verifyMasterChef()
    print("\n")

    await verifyAutoHelix()
    print("\n")
    
    await verifyMulticall()
    print("\n")

    console.log("done")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
