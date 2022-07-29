const { ethers } = require(`hardhat`);

const env = require("../../constants/env")
const contracts = require("../../constants/contracts")

const factoryAddress = contracts.factory[env.network]
const routerAddress = contracts.router[env.network]
const masterChefAddress = contracts.masterChef[env.network]

const rhelixAddress = "0x08626CF6A212a44C877D9740f86252dBD6292364"
const wrbtcAddress = "0xd07445d75A1A18A0030Bf7786990F3C1Ee71dB6e"
const rusdtAddress = "0x760ae0f5319D9efEdc9B99d7E73fdaB2f84E4d87"
const rifAddress = "0x700E1B86F9c47E10AB94FaA7E6C8260C0F07074D"
const sovAddress = "0xf5aBC0d6239D494AED4433189e1Ccb96B50E2be8"

const maxInt = ethers.constants.MaxUint256;

let tx

async function main() {
    const [wallet] = await ethers.getSigners()
    console.log(wallet.address)

    // Get the tokens
    const helixTokenContractFactory = await ethers.getContractFactory("HelixToken")
    const testTokenContractFactory = await ethers.getContractFactory("TestToken")

    const rhelix = helixTokenContractFactory.attach(rhelixAddress).connect(wallet)
    const wrbtc = testTokenContractFactory.attach(wrbtcAddress).connect(wallet)
    const rusdc = testTokenContractFactory.attach(rusdtAddress).connect(wallet)
    const rif = testTokenContractFactory.attach(rifAddress).connect(wallet)
    const sov = testTokenContractFactory.attach(sovAddress).connect(wallet)

    /*
    // Approve the router to spend the tokens
    console.log("rhelix approve router")
    tx = await rhelix.approve(routerAddress, maxInt)
    await tx.wait()
    console.log("wrbtc approve router")
    tx = await wrbtc.approve(routerAddress, maxInt)
    await tx.wait()
    console.log("rusdc approve router")
    tx = await rusdc.approve(routerAddress, maxInt)
    await tx.wait()
    console.log("rif approve router")
    tx = await rif.approve(routerAddress, maxInt)
    await tx.wait()
    console.log("sov approve router")
    tx = await sov.approve(routerAddress, maxInt)
    await tx.wait()
    */

    // Get the router
    const routerContractFactory = await ethers.getContractFactory("HelixRouterV1")
    const router = routerContractFactory.attach(routerAddress).connect(wallet)

    /*
    // Add liquidity to the router
    console.log("add rhelix wrbtc")
    tx = await router.addLiquidity(rhelix.address, wrbtc.address, 1000000, 1000000, 0, 0, wallet.address, maxInt)
    await tx.wait()
    console.log("add rhelix rusdc")
    tx = await router.addLiquidity(rhelix.address, rusdc.address, 1000000, 1000000, 0, 0, wallet.address, maxInt)
    await tx.wait()
    console.log("add rusdc wrbtc")
    tx = await router.addLiquidity(rusdc.address, wrbtc.address, 1000000, 1000000, 0, 0, wallet.address, maxInt)
    await tx.wait()
    console.log("add rif wrbtc")
    tx = await router.addLiquidity(rif.address, wrbtc.address, 1000000, 1000000, 0, 0, wallet.address, maxInt)
    await tx.wait()
    console.log("add sov wrbtc")
    tx = await router.addLiquidity(sov.address, wrbtc.address, 1000000, 1000000, 0, 0, wallet.address, maxInt)
    await tx.wait()
    */

    // Get the factory
    const factoryContractFactory = await ethers.getContractFactory("HelixFactory")
    const factory = factoryContractFactory.attach(factoryAddress).connect(wallet)

    // Get the pair addresses
    const pair0Address = await factory.getPair(rhelix.address, wrbtc.address)
    const pair1Address = await factory.getPair(rhelix.address, rusdc.address)
    const pair2Address = await factory.getPair(rusdc.address, wrbtc.address)
    const pair3Address = await factory.getPair(rif.address, wrbtc.address)
    const pair4Address = await factory.getPair(sov.address, wrbtc.address)

    console.log(`rhelix wrbtc pair: ${pair0Address}`)
    console.log(`rhelix rusdc pair: ${pair1Address}`)
    console.log(`rusdc wrbtc pair:  ${pair2Address}`)
    console.log(`rif wrbtc pair:    ${pair3Address}`)
    console.log(`sov wrbtc pair:    ${pair4Address}`)

    /*
    // Approve the masterChef to spend the tokens
    console.log("rhelix approve masterChef")
    tx = await rhelix.approve(masterChefAddress, maxInt)
    await tx.wait()
    console.log("wrbtc approve masterChef")
    tx = await wrbtc.approve(masterChefAddress, maxInt)
    await tx.wait()
    console.log("rusdc approve masterChef")
    tx = await rusdc.approve(masterChefAddress, maxInt)
    await tx.wait()
    console.log("rif approve masterChef")
    tx = await rif.approve(masterChefAddress, maxInt)
    await tx.wait()
    console.log("sov approve masterChef")
    tx = await sov.approve(masterChefAddress, maxInt)
    await tx.wait()
    */
 
    // Get the masterChef
    const masterChefContractFactory = await ethers.getContractFactory("MasterChef")
    const masterChef = masterChefContractFactory.attach(masterChefAddress).connect(wallet)

    // Stake each pair
    /*
    console.log("stake pair 0")
    tx = await masterChef.add(1000, pair0Address, false)
    await tx.wait()
    console.log("stake pair 1")
    tx = await masterChef.add(1000, pair1Address, false)
    await tx.wait()
    console.log("stake pair 2")
    tx = await masterChef.add(1000, pair2Address, false)
    await tx.wait()
    console.log("stake pair 3")
    tx = await masterChef.add(1000, pair3Address, false)
    await tx.wait()
    console.log("stake pair 4")
    tx = await masterChef.add(1000, pair4Address, false)
    await tx.wait()
    */
    
    console.log("done")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error);
        process.exit(1);
    });
