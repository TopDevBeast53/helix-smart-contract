// Export functions used by scripts

const verbose = true;

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

// Print the given string if verbose is true and do nothing otherwise
const print = (str) => {
    if (verbose) console.log(str)
}
