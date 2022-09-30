const { verifySynthReactor } = require("./verifiers/verifiers")

async function main() {
    await verifySynthReactor()
    console.log("done")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
