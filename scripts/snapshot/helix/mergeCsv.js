const fs = require("fs")

// Return the file at path as a list of lists
function loadFile(path) {
    let file = fs.readFileSync(path, {encoding: "utf8", flag:"r"})
    file = file.split("\n")
   
    let result = []
    for (let i = 0; i < file.length; i++) {
        result.push(file[i].split(","))
    }
    return result
}

function getPath(index) {
    return `./scripts/snapshot/helix/csvs/subResults/balancesMaster-${index}-${index+10}.csv`
}

function getCsv(list) {
    return list.map((list) => {
        return list.join() 
    }).join("\n")
}

function writeFile(path, content) {
    fs.writeFileSync(path, content, (err) => {
        if (err) console.log(err)
    })
}

function main() {
    // load the addresses
    const { addressess } = require("./addresses")

    const header = [
        "address",
        "helixTokenBalance",
        "vipPresaleBalance",
        "airdropBalance",
        "masterChefAmount",
        "masterChefPending",
        "vaultDepositSum",
        "referralReward"
    ]

    let results = []
    results.push(header) 

    for (let i = 0; i < addresses.length; i += 10) {
        console.log(i)
        const path = getPath(i)
        const file = loadFile(path)
        for (let i = 0; i < file.length; i++) {
            const entry = file[i]
            results.push(entry) 
        }
    }

    const toCsv = getCsv(results)
    writeFile("./scripts/snapshot/helix/master.csv", toCsv)
}

main()
