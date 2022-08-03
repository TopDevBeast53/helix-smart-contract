const fs = require("fs")
const { ethers } = require("hardhat") 

const env = require("../../../constants/env")
const contracts = require("../../../constants/contracts")

const helixTokenName = "HelixToken"
const helixTokenAddress = contracts.helixToken[env.network]

const vipPresaleName = "VipPresale"
const vipPresaleAddress = contracts.vipPresale[env.network]

const airdropName = "AirdropPaymentSplitter"
const airdropAddress = contracts.airdropPaymentSplitter[env.network]

const masterChefName = "MasterChef"
const masterChefAddress = contracts.masterChef[env.network]

const vaultName = "HelixVault"
const vaultAddress = contracts.helixVault[env.network]

const referralRegisterName = "ReferralRegister"
const referralRegisterAddress = contracts.referralRegister[env.network]

// Load a contract
async function loadContract(name, address) {
    const contractFactory = await ethers.getContractFactory(name)
    const contract = contractFactory.attach(address)
    return contract
}

// Return the contracts that will be queried in this script
async function loadContracts() {
    const helixToken = await loadContract(helixTokenName, helixTokenAddress)
    const airdrop = await loadContract(airdropName, airdropAddress)
    const masterChef = await loadContract(masterChefName, masterChefAddress)
    const vault = await loadContract(vaultName, vaultAddress)
    const referralRegister = await loadContract(referralRegisterName, referralRegisterAddress)
    return { 
        helixToken, 
        airdrop,
        masterChef,
        vault,
        referralRegister,
    }
}

// Load the directory as a list with each file in the directory appended as a sub-list
function loadAddresses() {
    const { addresses } = require("./addresses")
    return addresses
}

// Load the vip presale csv
function loadVipPresale() {
    let data = fs.readFileSync(
        "./scripts/snapshot/helix/vipPresaleBalances.csv",
        {encoding:'utf8', flag:'r'}
    )
    data = data.split("\n")

    vipPresale = {}
    for (let i = 0; i < data.length; i++) {
        const entry = data[i].split(",")
        const address = entry[0]
        const balance = entry[1]
        vipPresale[address] = balance
    }
    return vipPresale
}

// Return the helixToken balance of address
async function getHelixTokenBalanceOf(helixToken, address) {
    return await helixToken.balanceOf(address)
}

// Return the vip helixToken balance of address
function getVipPresaleBalanceOf(vipPresale, address) {
    if (address in vipPresale) { 
        return vipPresale[address]
    } else {
        return 0
    }
}

// Return the airdrop helix token balance of address
async function getAirdropBalanceOf(airdrop, address) {
    return await airdrop.releasableErc20(helixTokenAddress, address)
}

// Return the amount of helix deposited to the masterChef pools
async function getMasterChefAmount(masterChef, address) {
    const length = await masterChef.poolLength()

    let sum = ethers.BigNumber.from("0")
    for (let pid = 0; pid < length; pid++) {
        const amount = (await masterChef.userInfo(pid, address))[0]
        sum = sum.add(amount)
    }
    return sum
}

// Return address' sum of pending helix across all masterChef pools
async function getMasterChefPendingHelix(masterChef, address) {
    const length = await masterChef.poolLength()

    let sum = ethers.BigNumber.from("0")
    for (let pid = 0; pid < length; pid++) {
        sum = sum.add(await masterChef.pendingHelixToken(pid, address))
    }
    return sum
}

// Return the sum of open vault deposits the address has made
async function getVaultDepositSum(vault, address) {
    const deposits = await vault.getDepositIds(address)
    const length = deposits.length
    let sum = ethers.BigNumber.from("0")
    for (let i = 0; i < length; i++) {
        const deposit = await vault.getDeposit(deposits[i])
        if (deposit.withdrawn == false) {
            sum = sum.add(deposit.amount)
        }
    }
    return sum
}

// Return the address' referral reward
async function getReferralReward(referralRegister, address) {
    return await referralRegister.rewards(address)
}

async function main() {
    const contracts = await loadContracts() 
    const helixToken = contracts.helixToken
    const airdrop = contracts.airdrop
    const masterChef = contracts.masterChef
    const vault = contracts.vault
    const referralRegister = contracts.referralRegister

    // TODO Load spreadsheets from the spreadsheet directory as a list of lists
    // TODO Merge the spreadsheets for a list of all unique addresses that have ever held helixToken
    const addresses = loadAddresses()

    const vipPresale = loadVipPresale()

    let results = []
    let subResults = []

    // Add a csv header
    const header = [
        "address",
        "helixTokenBalance",
        "vipPresaleBalance",
        "airdropBalance",
        "masterChefAmount",
        "masterChefPending",
        "vaultDepositedSum",
        "referralReward"
    ]
    results.push(header)

    // Iterate over the unique address list
    for (let i = 171; i < addresses.length; i++) {
        console.log(i)

        // For each address in list check: 
        const address = addresses[i]

        // current balance
        const helixTokenBalance = await getHelixTokenBalanceOf(helixToken, address) 
        // console.log(`${address}: ${helixTokenBalance}`)

        // vip balance
        const vipPresaleBalance = getVipPresaleBalanceOf(vipPresale, address)
        // console.log(`${address}: ${vipPresaleBalance}`)

        // airdrop balance
        const airdropBalance = await getAirdropBalanceOf(airdrop, address)
        // console.log(`${address}: ${airdropBalance}`)

        // masterChef deposited total
        const masterChefAmount = await getMasterChefAmount(masterChef, address)
        // console.log(`${address}: ${masterChefAmount}`)

        // masterChef pending 
        const masterChefPending = await getMasterChefPendingHelix(masterChef, address) 
        // console.log(`${address}: ${masterChefPending}`)

        // vault deposited total
        const vaultDepositSum = await getVaultDepositSum(vault, address)
        // console.log(`${address}: ${vaultDeposits}`)

        // referral register rewards 
        const referralReward = await getReferralReward(referralRegister, address)
        // console.log(`${address}: ${referralReward}`)

        // add each balance to row entry
        results.push([
            address, 
            helixTokenBalance,
            vipPresaleBalance,
            airdropBalance,
            masterChefAmount,
            masterChefPending,
            vaultDepositSum,
            referralReward
        ])

        subResults.push([
            address, 
            helixTokenBalance,
            vipPresaleBalance,
            airdropBalance,
            masterChefAmount,
            masterChefPending,
            vaultDepositSum,
            referralReward
        ])

        // Save every 10 to prevent having to restart from the beginning if fail
        if (i > 0 && i % 10 == 0) {
            // Convert the results array to string
            const toCsv = subResults.map((subResults) => {
                return subResults.join()
            }).join("\n")

            // Save to all address balances to csv
            const path = `./scripts/snapshot/helix/balancesMaster-${i-10}-${i}.csv`
            fs.writeFileSync(path, toCsv, (err) => {
                if (err) {
                    console.log(error)
                }
            })

            subResults = []
        }
    }

    // Convert the results array to string
    const toCsv = subResults.map((subResults) => {
        return subResults.join()
    }).join("\n")

    // Save to all address balances to csv
    const path = "./scripts/snapshot/helix/balancesMaster-final.csv"
    fs.writeFileSync(path, toCsv, (err) => {
        if (err) {
            console.log(error)
        } else {
            console.log(fs.readFileSync(path, "utf8"))
            console.log("done")
        }
    })
}

   
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
