const { expect } = require("chai")
const { waffle } = require("hardhat")
const { fullExchangeFixture } = require("./shared/fixtures")

const { loadFixture } = waffle

describe("HelixToken", () => {
    let helixToken 
    let wallet0

    beforeEach(async () => {
        [deployer, wallet0] = await ethers.getSigners()

        const fixture = await loadFixture(fullExchangeFixture)
        const helixToken = fixture.helixToken
    })

    /*
    it("Prints wallets", async () => {
        console.log(`wallet0 ${deployer.address}`)
        console.log(`wallet1 ${wallet0.address}`)
    })
    */

})
