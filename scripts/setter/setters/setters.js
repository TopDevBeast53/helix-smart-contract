// This script exports javascript versions of contract setters

const { print, getContractName } = require("./utilities")

const env = require("../constants/env")
const names = require("../constants/names")

// Set the fee collector percent on the contract                                                   
const setCollectorPercent = async (contract, percent) => {                           
    const contractName = getContractName(contract.address)
    print(`set ${contractName} collector percent to ${percent}`)                                   
    const tx = await contract.setCollectorPercent(percent)                                      
    await tx.wait()                                                                             
}                                                                                                  
                                                                                                   
// Set the default nft chef percent on the contract                                                        
const setDefaultNftChefPercent = async (contract, percent) => {                             
    const contractName = getContractName(contract.address)
    print(`set ${contractName} nft chef percent to ${percent}`)                                    
    const tx = await contract.setDefaultNftChefPercent(percent)                                        
    await tx.wait()                                                                                                                                                                                      
}                                                                                                  

const setNftChefPercent = async (contract, sourceAddress, nftChefPercent) => {
    const contractName = getContractName(contract.address)
    const sourceName = getContractName(sourceAddress)
    print(`set ${contractName} nftChefPercent for ${sourceName} to ${nftChefPercent}`)
    const tx = await contract.setNftChefPercent(sourceAddress, nftChefPercent)
    await tx.wait()
}
                                                                                                   
// Transfer timelock ownership of the contract                                                     
const transferTimelockOwnership = async (contract, timelockOwner) => {               
    const contractName = getContractName(contract.address)
    print(`transfer timelock ownership of ${contractName} to ${timelockOwner}`)                    
    const tx = await contract.transferTimelockOwnership(timelockOwner)                          
    await tx.wait()                                                                             
}                                                                                                  
                                                                                                   
// Transfer ownership of the contract                                                              
const transferOwnership = async (contract, owner) => {                               
    const contractName = getContractName(contract.address)
    print(`transfer ownership of ${contractName} to ${owner}`)                                     
    const tx = await contract.transferOwnership(owner)                                          
    await tx.wait()                                                                             
}                                                                                                  
                                                                                                   
// Set the array of minters and the toMintPercent of each                                          
const setToMintPercents = async (contract, minters, toMintPercents) => {             
    const contractName = getContractName(contract.address)
    print(`set ${contractName} minters and to mint percents`)                                      
    if (minters.length != toMintPercents.length) {                                                 
        throw "SetToMintPercents: minters.length != toMintPercents.length"                         
    }                                                                                              
    for (let i = 0; i < minters.length; i++) {                                                     
        print(`\t${minters[i]}:\t${toMintPercents[i]}`)                                            
    }                                                                                              
                                                                                                   
    const tx = await contract.setToMintPercents(minters, toMintPercents)                        
    await tx.wait()                                                                             
}  

// Set the oracle factory of the contract
const setOracleFactory = async (contract, oracleFactory) => {
    const contractName = getContractName(contract.address)
    print(`set ${contractName} oracle factory to ${oracleFactory}`)
    const tx = await contract.setOracleFactory(oracleFactory)
    await tx.wait()
}

// Add a new accruer to contract
const addAccruer = async (contract, accruer) => {
    const contractName = getContractName(contract.address)
    print(`add ${accruer} as an accruer to ${contractName}`)
    const tx = await contract.addAccruer(accruer)
    await tx.wait()
}

// Add a new minter to contract
const addMinter = async (contract, minter) => {
    const contractName = getContractName(contract.address)
    print(`add ${minter} as a minter to ${contractName}`)
    const tx = await contract.addMinter(minter)
    await tx.wait()
}

// Add a new staker to contract
const addStaker = async (contract, staker) => {
    const contractName = getContractName(contract.address)
    print(`add ${staker} as a staker to ${contractName}`)
    const tx = await contract.addStaker(staker)
    await tx.wait()
}

const setReferralRegister = async (contract, referralRegisterAddress) => {
    const contractName = getContractName(contract.address)
    print(`set ${contractName} referral register to ${referralRegisterAddress}`)
    const tx = await contract.setReferralRegister(referralRegisterAddress)
    await tx.wait()
}

const addRecorder = async (contract, recorderAddress) => {
    const contractName = getContractName(contract.address)
    print(`add ${recorderAddress} as a recorder to ${contractName}`)
    const tx = await contract.addRecorder(recorderAddress)
    await tx.wait()
}

const setSwapRewards = async (contract, swapRewardsAddress) => {
    const contractName = getContractName(contract.address)
    print(`add ${swapRewardsAddress} as the swap rewards contract for ${contractName}`)
    const tx = await contract.setSwapRewards(swapRewardsAddress)
    await tx.wait()
}

module.exports = {
    setCollectorPercent,
    setDefaultNftChefPercent,
    setNftChefPercent,
    transferTimelockOwnership,
    transferOwnership,
    setToMintPercents,
    setOracleFactory,
    addAccruer,
    addMinter,
    addStaker,
    setReferralRegister,
    addRecorder,
    setSwapRewards,
}
