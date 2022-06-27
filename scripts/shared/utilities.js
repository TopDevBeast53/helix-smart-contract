// Export functions used by scripts

const verbose = true;

const overrides = {
    gasLimit: 9999999
}

module.exports.print = (str) => {
    print(str)
}

// Return the contract with name from address with wallet connected
module.exports.loadContract = async (name, address, wallet) => {
    print(`load ${name} from ${address}`)
    const contractFactory = await ethers.getContractFactory(name)
    const contract = contractFactory.attach(address).connect(wallet)
    return contract
}

// Set the fee collector percent on the contract
module.exports.setCollectorPercent = async (contract, contractName, percent) => {
    print(`set ${contractName} collector percent to ${percent}`)
    const tx = await contract.setCollectorPercent(percent)
    await tx.wait()
}

// Set the nft chef percent on the contract
module.exports.setNftChefPercent = async (contract, contractName, percent) => {
    print(`set ${contractName} nft chef percent to ${percent}`)
    const tx = await contract.setNftChefPercent(percent)
    await tx.wait()
}

// Transfer timelock ownership of the contract
module.exports.transferTimelockOwnership = async (contract, contractName, timelockOwner) => {
    print(`transfer timelock ownership of ${contractName} to ${timelockOwner}`)
    const tx = await contract.transferTimelockOwnership(timelockOwner)
    await tx.wait()
}

// Transfer ownership of the contract
module.exports.transferOwnership = async (contract, contractName, owner) => {
    print(`transfer ownership of ${contractName} to ${owner}`)
    const tx = await contract.transferOwnership(owner)
    await tx.wait()
}

// Set the oracleFactory of the contract
module.exports.setOracleFactory = async (contract, contractName, oracleFactory) => {
    print(`set ${contractName} oracle factory to ${oracleFactory}`)
    // const tx = await contract.setOracleFactory(oracleFactory)
    // await tx.wait()
}

// Set the array of minters and the toMintPercent of each
module.exports.setToMintPercents = async (contract, contractName, minters, toMintPercents) => {
    print(`set ${contractName} minters and to mint percents`)
    if (minters.length != toMintPercents.length) {
        throw "SetToMintPercents: minters.length != toMintPercents.length"
    }
    for (let i = 0; i < minters.length; i++) {
        print(`\t${minters[i]}:\t${toMintPercents[i]}`)
    }

    // const tx = await contract.setToMintPercents(minters, toMintPercents)
    // await tx.wait()
}

// Print the given string if verbose is true and do nothing otherwise
const print = (str) => {
    if (verbose) console.log(str)

}
