// Log the encoded function data for calling contract with functionName and arguments
// node scripts/4_test/logEncodedFunctionData.js [contract] [functionName] [arguments]

const { getEncodedFunctionData } = require("../shared/utilities")

// Parse the command line arguments into contract, functionName, and arguments
const parseArgs = (process) => {
    const args = process.argv.slice(2)
    const contract = args[0]
    const functionName = args[1]
    let arguments = []
    for (let i = 2; i < args.length; i++) {
        arguments.push(args[i])
    }
    return {contract, functionName, arguments}
}

const main = () => {
    const {contract, functionName, arguments} = parseArgs(process)
    const data = getEncodedFunctionData(contract, functionName, arguments)
    console.log(`data: ${data}`)
}

main()
