// Export functions used by scripts

const verbose = true;

const overrides = {
    gasLimit: 9999999
}

// Print the given string if verbose is true and do nothing otherwise
const print = (str) => {
    if (verbose) console.log(str)
}

// Return the contract with name from address with wallet connected
const loadContract = async (name, address, wallet) => {
    print(`load ${name} from ${address}`)
    const contractFactory = await ethers.getContractFactory(name)
    const contract = contractFactory.attach(address).connect(wallet)
    return contract
}

module.exports = {
    verbose: verbose,
    overrides: overrides,
    print: print,
    loadContract: loadContract,
}
