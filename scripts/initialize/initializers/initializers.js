// This script exports the "connect" functions which are used to (re)build the connections between
// contracts

const { connectFactory } = require("./factory")
const { connectHelixChefNft } = require("./helixChefNft")
const { connectHelixNft } = require("./helixNft")
const { connectHelixToken } = require("./helixToken")
const { connectMasterChef } = require("./masterChef")
const { connectReferralRegister } = require("./referralRegister")
const { connectRouter } = require("./router")
const { initFeeMinter } = require("./feeMinter")
const { initializeFeeHandler } = require("./feeHandler")

module.exports = {
    connectFactory,
    connectHelixChefNft,
    connectHelixNft,
    connectHelixToken,
    connectMasterChef,
    connectReferralRegister,
    connectRouter,
    initFeeMinter,
    initializeFeeHandler,
}
