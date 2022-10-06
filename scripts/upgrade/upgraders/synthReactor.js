const { ethers, upgrades } = require(`hardhat`)
const { getChainId } = require("../../shared/utilities")

const contracts = require("../../../constants/contracts")

const upgradeSynthReactor = async (deployer) => {
    const chainId = await getChainId()
    const synthReactorAddress = contracts.synthReactor[chainId]

    console.log(`Upgrade SynthReactor`)
    console.log(`Proxy address:\t\t${synthReactorAddress}`)

    const contractFactory = await ethers.getContractFactory(`SynthReactor`)
    const tx = await upgrades.upgradeProxy(synthReactorAddress, contractFactory);
    await tx.deployed();

    const implementationAddress = await upgrades.erc1967.getImplementationAddress(
        synthReactorAddress
    )
    console.log(`Implementation address:\t${implementationAddress}`)
}

module.exports = { upgradeSynthReactor }
