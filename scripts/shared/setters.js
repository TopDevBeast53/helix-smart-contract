// This script exports javascript versions of contract setters

const { print } = require("./utilities")

// Set the fee collector percent on the contract                                                   
const setCollectorPercent = async (contract, contractName, percent) => {                           
    print(`set ${contractName} collector percent to ${percent}`)                                   
    const tx = await contract.setCollectorPercent(percent)                                      
    await tx.wait()                                                                             
}                                                                                                  
                                                                                                   
// Set the nft chef percent on the contract                                                        
const setNftChefPercent = async (contract, contractName, percent) => {                             
    print(`set ${contractName} nft chef percent to ${percent}`)                                    
    const tx = await contract.setNftChefPercent(percent)                                        
    await tx.wait()                                                                                                                                                                                      
}                                                                                                  
                                                                                                   
// Transfer timelock ownership of the contract                                                     
const transferTimelockOwnership = async (contract, contractName, timelockOwner) => {               
    print(`transfer timelock ownership of ${contractName} to ${timelockOwner}`)                    
    const tx = await contract.transferTimelockOwnership(timelockOwner)                          
    await tx.wait()                                                                             
}                                                                                                  
                                                                                                   
// Transfer ownership of the contract                                                              
const transferOwnership = async (contract, contractName, owner) => {                               
    print(`transfer ownership of ${contractName} to ${owner}`)                                     
    const tx = await contract.transferOwnership(owner)                                          
    await tx.wait()                                                                             
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
                                                                                                   
    const tx = await contract.setToMintPercents(minters, toMintPercents)                        
    await tx.wait()                                                                             
}  

// Set the oracle factory of the contract
const setOracleFactory = async (contract, contractName, oracleFactory) => {
    print(`set ${contractName} oracle factory to ${oracleFactory}`)
    const tx = await contract.setOracleFactory(oracleFactory)
    await tx.wait()
}

// Add a new accruer to contract
const addAccruer = async (contract, contractName, accruer) => {
    print(`add ${accruer} as an accruer to ${contractName}`)
    const tx = await contract.addAccruer(accruer)
    await tx.wait()
}

// Add a new minter to contract
const addMinter = async (contract, contractName, minter) => {
    print(`add ${minter} as a minter to ${contractName}`)
    const tx = await contract.addMinter(minter)
    await tx.wait()
}

// Add a new staker to contract
const addStaker = async (contract, contractName, staker) => {
    print(`add ${staker} as a staker to ${contractName}`)
    const tx = await contract.addStaker(staker)
    await tx.wait()
}

const setReferralRegister = async (contract, contractName, referralRegisterAddress) => {
    print(`set ${contractName} referral register to ${referralRegisterAddress}`)
    const tx = await contract.setReferralRegister(referralRegisterAddress)
    await tx.wait()
}

const addRecorder = async (contract, contractName, recorderAddress) => {
    print(`add ${recorderAddress} as a recorder to ${contractName}`)
    const tx = await contract.addRecorder(recorderAddress)
    await tx.wait()
}

const setSwapRewards = async (contract, contractName, swapRewardsAddress) => {
    print(`add ${swapRewardsAddress} as the swap rewards contract for ${contractName}`)
    const tx = await contract.setSwapRewards(swapRewardsAddress)
    await tx.wait()
}

module.exports = {
    setCollectorPercent: setCollectorPercent,
    setNftChefPercent: setNftChefPercent,
    transferTimelockOwnership: transferTimelockOwnership,
    transferOwnership: transferOwnership,
    setToMintPercents: setToMintPercents,
    setOracleFactory: setOracleFactory,
    addAccruer: addAccruer,
    addMinter: addMinter,
    addStaker: addStaker,
    setReferralRegister: setReferralRegister,
    addRecorder: addRecorder,
    setSwapRewards: setSwapRewards,
}
