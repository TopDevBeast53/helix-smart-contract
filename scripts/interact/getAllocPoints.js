const { ethers } = require("hardhat")
const { loadContract, getChainId } = require("../shared/utilities")

const contracts = require("../../constants/contracts")

async function main() { 
    const chainId = await getChainId()
    const masterChefAddress = contracts.masterChef[chainId]

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
