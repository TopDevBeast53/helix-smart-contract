const { getChainId, loadContract } = require("./utilities")
const contracts = require("../../constants/contracts")

const name = "HelixChefNFT"

const chainId = async () => await hre.run("getChainId")
const contract = async () => await hre.run(
    "loadContract", 
    { 
        name: name, 
        address: contracts.helixChefNFT[await chainId()]
    }
)


// READ


subtask("helixChefNft.getAccruedReward")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).getAccruedReward(
            args.arg0,
            args.arg1,
        )
        console.log(result.toString())
    })

subtask("helixChefNft.getAccruer")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).getAccruer(
            args.arg0,
        )
        console.log(result.toString())
    })

subtask("helixChefNft.getNumAccruers")
    .setAction(async () => {
        const result = await (await contract()).getNumAccruers()
        console.log(result.toString())
    })

subtask("helixChefNft.getUsersStakedWrappedNfts")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).getUsersStakedWrappedNfts(
            args.arg0,
        )
        console.log(result.toString())
    })

subtask("helixChefNft.helixNFT")
    .setAction(async () => {
        const result = await (await contract()).helixNFT()
        console.log(result.toString())
    })

subtask("helixChefNft.isAccruer")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).isAccruer(
            args.arg0,
        )
        console.log(result.toString())
    })

subtask("helixChefNft.owner")
    .setAction(async () => {
        const result = await (await contract()).owner()
        console.log(result.toString())
    })

subtask("helixChefNft.paused")
    .setAction(async () => {
        const result = await (await contract()).paused()
        console.log(result.toString())
    })

subtask("helixChefNft.pendingReward")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).pendingReward(
            args.arg0,
        )
        console.log(result.toString())
    })

subtask("helixChefNft.rewardToken")
    .setAction(async () => {
        const result = await (await contract()).rewardToken()
        console.log(result.toString())
    })

subtask("helixChefNft.totalStakedWrappedNfts")
    .setAction(async () => {
        const result = await (await contract()).totalStakedWrappedNfts()
        console.log(result.toString())
    })

subtask("helixChefNft.users")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).users(
            args.arg0,
        )
        console.log(result.toString())
    })

subtask("helixChefNft.usersStakedWrappedNfts")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).usersStakedWrappedNfts(
            args.arg0,
        )
        console.log(result.toString())
    })


// WRITE


subtask("helixChefNft.accrueReward")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).accrueReward(
            args.arg0,
            args.arg1,
        )
    })

subtask("helixChefNft.addAccruer")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).addAccruer(
            args.arg0,
        )
    })

subtask("helixChefNft.initialize")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).initialize(
            args.arg0,
            args.arg1,
        )
    })

subtask("helixChefNft.pause")
    .setAction(async () => {
        const result = await (await contract()).pause()
    })

subtask("helixChefNft.removeAccruer")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).removeAccruer(
            args.arg0,
        )
    })

subtask("helixChefNft.renounceOwnership")
    .setAction(async () => {
        const result = await (await contract()).renounceOwnership()
    })

subtask("helixChefNft.setHelixNFT")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).setHelixNFT(
            args.arg0,
        )
    })

subtask("helixChefNft.stake")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).stake(
            args.arg0,
        )
    })

subtask("helixChefNft.transferOwnership")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).transferOwnership(
            args.arg0,
        )
    })

subtask("helixChefNft.unpause")
    .setAction(async () => {
        const result = await (await contract()).unpause()
    })

subtask("helixChefNft.unstake")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).unstake(
            args.arg0,
        )
    })

subtask("helixChefNft.withdrawRewardToken")
    .setAction(async () => {
        const result = await (await contract()).withdrawRewardToken()
    })

