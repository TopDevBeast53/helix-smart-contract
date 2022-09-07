const { verifyRouterProxy } = require("./verifiers/verifiers")

async function main() {
    await verifyRouterProxy()
    console.log("done")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
