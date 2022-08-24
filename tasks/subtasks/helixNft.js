const { getChainId, loadContract } = require("./utilities")
const contracts = require("../../constants/contracts")

const name = "HelixNFT"

const chainId = async () => await hre.run("getChainId")
const contract = async () => await hre.run(
    "loadContract", 
    { 
        name: name, 
        address: contracts.helixNFT[await chainId()]
    }
)


// READ


subtask("helixNft.MAX_ARRAY_LENGTH_PER_REQUEST")
    .setAction(async () => {
        const result = await (await contract()).MAX_ARRAY_LENGTH_PER_REQUEST()
        console.log(result.toString())
    })

subtask("helixNft.balanceOf")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).balanceOf(args.arg0)
        console.log(result.toString())
    })

subtask("helixNft.getApproved")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).getApproved(args.arg0)
        console.log(result.toString())
    })

subtask("helixNft.getBridgeFactoryId")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).getBridgeFactoryId(args.arg0)
        console.log(result.toString())
    })

subtask("helixNft.getInfoForStaking")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).getInfoForStaking(args.arg0)
        console.log(result.toString())
    })

subtask("helixNft.getLastTokenId")
    .setAction(async () => {
        const result = await (await contract()).getLastTokenId()
        console.log(result.toString())
    })

subtask("helixNft.getMintTokenIDs")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).getMintTokenIDs(args.arg0)
        console.log(result.toString())
    })

subtask("helixNft.getMinter")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).getMinter(args.arg0)
        console.log(result.toString())
    })

subtask("helixNft.getMinterLength")
    .setAction(async () => {
        const result = await (await contract()).getMinterLength()
        console.log(result.toString())
    })

subtask("helixNft.getStaker")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).getStaker(args.arg0)
        console.log(result.toString())
    })

subtask("helixNft.getStakerLength")
    .setAction(async () => {
        const result = await (await contract()).getStakerLength()
        console.log(result.toString())
    })

subtask("helixNft.getToken")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).getToken(args.arg0)
        console.log(result.toString())
    })

subtask("helixNft.getTokenIdsOfOwner")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).getTokenIdsOfOwner(args.arg0)
        console.log(result.toString())
    })

subtask("helixNft.isApprovedForAll")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).isApprovedForAll(
            args.arg0,
            args.arg1,
        )
        console.log(result.toString())
    })

subtask("helixNft.isMinter")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).isMinter(args.arg0)
        console.log(result.toString())
    })

subtask("helixNft.isStaker")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).isStaker(args.arg0)
        console.log(result.toString())
    })

subtask("helixNft.name")
    .setAction(async () => {
        const result = await (await contract()).name()
        console.log(result.toString())
    })

subtask("helixNft.owner")
    .setAction(async () => {
        const result = await (await contract()).owner()
        console.log(result.toString())
    })

subtask("helixNft.ownerOf")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).ownerOf(args.arg0)
        console.log(result.toString())
    })

subtask("helixNft.supportsInterface")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).supportsInterface(args.arg0)
        console.log(result.toString())
    })

subtask("helixNft.symbol")
    .setAction(async () => {
        const result = await (await contract()).symbol()
        console.log(result.toString())
    })

subtask("helixNft.tokenByIndex")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).tokenByIndex(args.arg0)
        console.log(result.toString())
    })

subtask("helixNft.tokenOfOwnerByIndex")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).tokenOfOwnerByIndex(
            args.arg0,
            args.arg1,
        )
        console.log(result.toString())
    })

subtask("helixNft.tokenURI")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).tokenURI(args.arg0)
        console.log(result.toString())
    })

subtask("helixNft.totalSupply")
    .setAction(async () => {
        const result = await (await contract()).totalSupply()
        console.log(result.toString())
    })



// WRITE


subtask("helixNft.addMinter")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).addMinter(args.arg0)
    })

subtask("helixNft.addStaker")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).addStaker(args.arg0)
    })

subtask("helixNft.approve")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).approve(
            args.arg0,
            args.arg1,
        )
    })

subtask("helixNft.burn")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).burn(args.arg0)
    })

subtask("helixNft.delMinter")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).delMinter(args.arg0)
    })

subtask("helixNft.delStaker")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).delStaker(args.arg0)
    })

subtask("helixNft.initialize")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).initialize(args.arg0)
    })

subtask("helixNft.mint")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).mint(args.arg0)
    })

subtask("helixNft.mintExternal")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .addPositionalParam("arg2")
    .addPositionalParam("arg3")
    .addPositionalParam("arg4")
    .setAction(async (args) => {
        const result = await (await contract()).mintExternal(
            args.arg0,
            args.arg1,
            args.arg2,
            args.arg3,
            args.arg4,
        )
    })

subtask("helixNft.safeTransferFrom")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .addPositionalParam("arg2")
    .setAction(async (args) => {
        const result = await (await contract()).safeTransferFrom(
            args.arg0,
            args.arg1,
            args.arg2,
        )
    })


// safeTransferFrom

subtask("helixNft.setApprovalForAll")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).setApprovalForAll(
            args.arg0,
            args.arg1,
        )
    })

subtask("helixNft.setBaseURI")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).setBaseURI(args.arg0)
    })

subtask("helixNft.setIsStaked")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .setAction(async (args) => {
        const result = await (await contract()).setIsStaked(
            args.arg0,
            args.arg1,
        )
    })

subtask("helixNft.transferFrom")
    .addPositionalParam("arg0")
    .addPositionalParam("arg1")
    .addPositionalParam("arg2")
    .setAction(async (args) => {
        const result = await (await contract()).transferFrom(
            args.arg0,
            args.arg1,
            args.arg2,
        )
    })

subtask("helixNft.transferOwnership")
    .addPositionalParam("arg0")
    .setAction(async (args) => {
        const result = await (await contract()).transferOwnership(args.arg0)
    })

