const { run } = require(`hardhat`);
const { print, getChainId } = require("../../shared/utilities")

const contracts = require("../../../constants/contracts")

const name = 'Test Token B'
const symbol = 'TTB'
const totalSupply = '1000000000000000000000000000';        // 1 billion

const verifyTestToken = async () => {
    const chainId = await getChainId()
    const testTokenAddress = contracts.testToken[chainId]

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
