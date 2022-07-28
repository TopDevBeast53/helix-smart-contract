const { loadContract } = require("./utilities")

const env = require("../../constants/env")
const contracts = require("../../constants/contracts")

const name = "Multicall2"
const address = contracts.multicall[env.network]

const contract = async () => await hre.run("loadContract", { name: name, address: address })


// READ


// getBlockHash
subtask("multicall.getBlockHash")
    .setAction(async () => {
        const result = await (await contract()).getBlockHash()
        console.log(result.toString())
    })

// getBlockNumber

// getCurrentBlockCoinbase

// getCurrentBlockDifficulty

// getCurrentBlockGasLimit

// getCurrentBlockTimestamp

// getEthBalance

// getLastBlockHash


// WRITE


// aggregate

// blockAndAggregate

// tryAggregate

// tryBlockAndAggregate
