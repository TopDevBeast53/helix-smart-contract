const { run } = require(`hardhat`);
const { print } = require("../../shared/utilities")

const env = require("../../../constants/env")
const contracts = require("../../../constants/contracts")

const testTokenAddress = contracts.testToken[env.network]

const name = 'Test Token B'
const symbol = 'TTB'
const totalSupply = '1000000000000000000000000000';        // 1 billion

const verifyTestToken = async () => {
    print(`verify Test Token`);
    print(`name: ${name}`)
    print(`symbol: ${symbol}`)
    print(`totalSupply: ${totalSupply}`)

    await run(
        "verify:verify", {
            address: testTokenAddress,
            constructorArguments: [
                name,
                symbol,
                totalSupply
            ]
        }
    )
}

module.exports = { verifyTestToken }
