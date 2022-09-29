/**
 * @dev Verify the deployed SynthToken
 */

const { verifySynthToken } = require("./verifiers/verifiers")

async function main() {
    await verifySynthToken()
    console.log("done")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
