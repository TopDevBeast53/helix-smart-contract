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

// Set the fee collector percent on the contract
const setCollectorPercent = async (contract, contractName, percent) => {
    print(`set ${contractName} collector percent to ${percent}`)
    // const tx = await contract.setCollectorPercent(percent)
    // await tx.wait()
}

// Set the nft chef percent on the contract
const setNftChefPercent = async (contract, contractName, percent) => {
    print(`set ${contractName} nft chef percent to ${percent}`)
    // const tx = await contract.setNftChefPercent(percent)
    // await tx.wait()
}

// Transfer timelock ownership of the contract
const transferTimelockOwnership = async (contract, contractName, timelockOwner) => {
    print(`transfer timelock ownership of ${contractName} to ${timelockOwner}`)
    // const tx = await contract.transferTimelockOwnership(timelockOwner)
    // await tx.wait()
}

// Transfer ownership of the contract
const transferOwnership = async (contract, contractName, owner) => {
    print(`transfer ownership of ${contractName} to ${owner}`)
    // const tx = await contract.transferOwnership(owner)
    // await tx.wait()
}

// Set the array of minters and the toMintPercent of each
const setToMintPercents = async (contract, contractName, minters, toMintPercents) => {
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

// Set the oracle factory of the contract
const setOracleFactory = async (contract, contractName, oracleFactory) => {
    print(`set ${contractName} oracle factory to ${oracleFactory}`)
    // const tx = await contract.setOracleFactory(oracleFactory)
    // await tx.wait()
}

// Load the factory contract and (re)build any connections it has to other contracts
const connectFactory = async (name, address, wallet, oracleFactoryAddress) => {
    print(`(re)build any references the factory contract holds to other contracts`)
    const factory = await loadContract(name, address, wallet)
    await setOracleFactory(factory, name, oracleFactoryAddress)
}

// Load the feeMinter contract and (re)initialize it's state
const initFeeMinter = async (name, address, wallet, minters, toMintPercents) => {
    print(`(re)initialize the feeMinter to it's default state`)
    const feeMinter = await loadContract(name, address, wallet)
    await setToMintPercents(feeMinter, name, minters, toMintPercents)
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

const connectHelixChefNft = async (
    helixChefNftName, 
    helixChefNftAddress, 
    wallet, 
    feeHandlerAddress
) => {
    const helixChefNft = await loadContract(helixChefNftName, helixChefNftAddress, wallet)
    await addAccruer(helixChefNft, helixChefNftName, feeHandlerAddress)
}

const connectHelixNft = async (
    helixNftName, 
    helixNftAddress, 
    wallet, 
    helixNftBridgeAddress, 
    helixChefNftAddress
) => {
    const helixNft = await loadContract(helixNftName, helixNftAddress, wallet)
    await addMinter(helixNft, helixNftName, helixNftBridgeAddress)
    await addStaker(helixNft, helixNftName, helixChefNftAddress)
}

const connectHelixToken = async (
    helixTokenName, 
    helixTokenAddress, 
    wallet, 
    referralRegisterAddress,
    vaultAddress,
    masterChefAddress
) => {
    const helixToken = await loadContract(helixTokenName, helixTokenAddress, wallet) 
    await addMinter(helixToken, helixTokenName, referralRegisterAddress)
    await addMinter(helixToken, helixTokenName, vaultAddress)
    await addMinter(helixToken, helixTokenName, masterChefAddress)
}

const setReferralRegister = async (contract, contractName, referralRegisterAddress) => {
    print(`set ${contractName} referral register to ${referralRegisterAddress}`)
    // const tx = await contract.setReferralRegister(referralRegisterAddress)
    // await tx.wait()
}

const connectMasterChef = async (
    masterChefName, 
    masterChefAddress, 
    wallet, 
    referralRegisterAddress
) => {
    const masterChef = await loadContract(masterChefName, masterChefAddress, wallet)
    await setReferralRegister(masterChef, masterChefName, referralRegisterAddress)
}

const addRecorder = async (contract, contractName, recorderAddress) => {
    print(`add ${recorderAddress} as a recorder to ${contractName}`)
    // const tx = await contract.addRecorder(recorderAddress)
    // await tx.wait()
}

const connectReferralRegister = async (
    referralRegisterName, 
    referralRegisterAddress, 
    wallet, 
    swapRewardsAddress, 
    masterChefAddress
) => {
    const referralRegister = await loadContract(
        referralRegisterName, 
        referralRegisterAddress, 
        wallet
    )
    await addRecorder(referralRegister, referralRegisterName, swapRewardsAddress)
    await addRecorder(referralRegister, referralRegisterName, masterChefAddress) 
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
    connectFactory: connectFactory,
    initFeeMinter: initFeeMinter,
    addAccruer: addAccruer,
    addMinter: addMinter,
    addStaker: addStaker,
    connectHelixChefNft: connectHelixChefNft,
    connectHelixNft: connectHelixNft,
    connectHelixToken: connectHelixToken,
    setReferralRegister: setReferralRegister,
    connectMasterChef: connectMasterChef,
    addRecorder: addRecorder,
    connectReferralRegister: connectReferralRegister,
    setSwapRewards: setSwapRewards,
    connectRouter: connectRouter,
}
