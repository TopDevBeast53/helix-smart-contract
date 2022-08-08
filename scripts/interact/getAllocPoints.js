const { ethers } = require("hardhat")
const { loadContract } = require("../shared/utilities")

const env = require("../../constants/env")
const contracts = require("../../constants/contracts")

const masterChefAddress = contracts.masterChef[env.network]

async function main() {
    const [wallet] = await ethers.getSigners()
    const masterChef = await loadContract(masterChefAddress, wallet)

    const poolLength = await masterChef.poolLength()
    
    console.log("\n")
    console.log(`poolId\tlpToken\t\t\t\t\t\tallocPoint`)
    for (let poolId = 0; poolId < poolLength; poolId++) {
        const poolInfo = await masterChef.poolInfo(poolId)
        const lpToken = poolInfo.lpToken
        const allocPoint = poolInfo.allocPoint
        console.log(`${poolId}\t${lpToken}\t${allocPoint}`)
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
