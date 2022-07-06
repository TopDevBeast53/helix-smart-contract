const { ethers } = require(`hardhat`);
const { print } = require("../utilities")

const name = 'Test Token B'
const symbol = 'TTB'
const totalSupply = '1000000000000000000000000000';        // 1 billion

const deployTestToken = async (deployer) => {
    print(`Deploy Test Token`);
    print(`name: ${name}`)
    print(`symbol: ${symbol}`)
    print(`totalSupply: ${totalSupply}`)

    const TestToken = await ethers.getContractFactory('TestToken');
    const testToken = await TestToken.deploy(name, symbol, totalSupply);
    await testToken.deployTransaction.wait();
    print(`${name} deployed to ${testToken.address}`);
}

module.exports = { deployTestToken }
