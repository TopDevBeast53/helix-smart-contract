/*
 * @dev Deployment script for Air Drop contract.
 *
 * Run from project root using:
 *     npx hardhat run scripts/18_deployAirDrop.js --network testnetBSC
 */


// Define script parameters
const { ethers } = require(`hardhat`)
const env = require('./constants/env')
const contracts = require('./constants/contracts')
const initials = require('./constants/initials')

// Define contract constructor arguments                                    // main  / test
const tokenAddress = initials.AIRDROP_TOKEN[env.network]               // HELIX / tokenB
const name = initials.AIRDROP_NAME[env.network]
const withdrawPhaseDuration = initials.AIRDROP_WITHDRAW_PHASE_DURATION[env.network]

// Define contract settings
const initialBalance = initials.AIRDROP_INITIAL_BALANCE[env.network]

async function main() {
    const [deployer] = await ethers.getSigners()
    console.log(`Deployer address: ${deployer.address}`)

    // Deploy the contract
    console.log(`Deploy Air Drop`)
    const ContractFactory = await ethers.getContractFactory('AirDrop')
    const contract = await ContractFactory.deploy(
        name,
        tokenAddress,
        withdrawPhaseDuration
    )     
    await contract.deployTransaction.wait()
    console.log(`Air Drop deployed to ${contract.address}`)

    // Send funds of outputToken to the contract
    const IToken = await ethers.getContractFactory('TestToken')
    token = await IToken.attach(tokenAddress).connect(deployer) 

    console.log(`Send ${initialBalance} tokens to airdrop`)
    // Add zeros since token has 18 decimals
    await token.transfer(contract.address, initialBalance.toString() + '000000000000000000')
    console.log('Done')
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
