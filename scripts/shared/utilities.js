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
    // const contract = contractFactory.attach(address).connect(wallet)
    // return contract
}

// Set the oracle factory of the contract
const setOracleFactory = async (contract, contractName, oracleFactory) => {
    print(`set ${contractName} oracle factory to ${oracleFactory}`)
    // const tx = await contract.setOracleFactory(oracleFactory)
    // await tx.wait()
}

// Add a new accruer to contract
const addAccruer = async (contract, contractName, accruer) => {
    print(`add ${accruer} as an accruer to ${contractName}`)
    // const tx = await contract.addAccruer(accruer)
    // await tx.wait()
}

// Add a new minter to contract
const addMinter = async (contract, contractName, minter) => {
    print(`add ${minter} as a minter to ${contractName}`)
    // const tx = await contract.addMinter(minter)
    // await tx.wait()
}

// Add a new staker to contract
const addStaker = async (contract, contractName, staker) => {
    print(`add ${staker} as a staker to ${contractName}`)
    // const tx = await contract.addStaker(staker)
    // await tx.wait()
}

const setReferralRegister = async (contract, contractName, referralRegisterAddress) => {
    print(`set ${contractName} referral register to ${referralRegisterAddress}`)
    // const tx = await contract.setReferralRegister(referralRegisterAddress)
    // await tx.wait()
}
    
const addRecorder = async (contract, contractName, recorderAddress) => {
    print(`add ${recorderAddress} as a recorder to ${contractName}`)
    // const tx = await contract.addRecorder(recorderAddress)
    // await tx.wait()
}

const setSwapRewards = async (contract, contractName, swapRewardsAddress) => {
    print(`add ${swapRewardsAddress} as the swap rewards contract for ${contractName}`)
    // const tx = await contract.setSwapRewards(swapRewardsAddress)
    // await tx.wait()
}

const connectRouter = async (
    routerName, 
    routerAddress, 
    wallet, 
    swapRewardsAddress, 
) => {
    const router = await loadContract(routerName, routerAddress, wallet)
    await setSwapRewards(router, routerName, swapRewardsAddress) 
}

module.exports = {
    verbose: verbose,
    overrides: overrides,
    print: print,
    loadContract: loadContract,
    setCollectorPercent: setCollectorPercent,
    setNftChefPercent: setNftChefPercent,
    transferTimelockOwnership: transferTimelockOwnership,
    transferOwnership: transferOwnership,
    setToMintPercents: setToMintPercents,
    setOracleFminteactory: setOracleFactory,
    addAccruer: addAccruer,
    addMinter: addMinter,
    addStaker: addStaker,
    setReferralRegister: setReferralRegister,
    addRecorder: addRecorder,
    setSwapRewards: setSwapRewards,
}
