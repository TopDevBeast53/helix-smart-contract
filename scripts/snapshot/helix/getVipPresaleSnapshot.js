const fs = require("fs")
const { ethers } = require("hardhat") 

const env = require("../../../constants/env")
const contracts = require("../../../constants/contracts")

const vipPresaleName = "VipPresale"
const vipPresaleAddress = contracts.vipPresale[56]

// Load a contract
async function loadContract(name, address) {
    const contractFactory = await ethers.getContractFactory(name)
    const contract = contractFactory.attach(address)
    return contract
}

// Return the contracts that will be queried in this script
async function loadContracts() {
    const vipPresale = await loadContract(vipPresaleName, vipPresaleAddress)
    return { vipPresale }
}

function loadAddresses() {
    const { addresses } = require("./addresses")
    return addresses
}

// Return the vip helixToken balance of address
async function getVipPresaleBalanceOf(vipPresale, address, outputToken) {
    const user = await vipPresale.users(address)
    return await vipPresale.getAmountOut(user.balance, outputToken)
}

async function main() {
    const contracts = await loadContracts() 
    const vipPresale = contracts.vipPresale

    const addresses = loadAddresses()

    const outputToken = await vipPresale.outputToken()

    let results = []
    // Iterate over the unique address list
    for (let i = 0; i < addresses.length; i++) {
        // For each address in list check: 
        const address = addresses[i]

        // vip balance
        const vipPresaleBalance = await getVipPresaleBalanceOf(vipPresale, address, outputToken)

        // add each balance to row entry
        results.push([address, vipPresaleBalance])
    }

    let toCsv = results.map((results) => {
        return results.join()
    }).join("\n")

    // Save to all address balances to csv
    fs.writeFileSync("./scripts/snapshot/helix/vipPresaleBalances.csv", toCsv, (err) => {
        if (err) {
            console.log(error)
        } else {
            console.log(fs.readFileSync("./scripts/snapshot/helix/vipPresaleBalances.csv", "utf8"))
        }
    })
}

   
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
