// This script exports the "initialize" functions with restore the contracts to their 
// default states

const { initializeFactory } = require("./factory")
const { initializeHelixChefNft } = require("./helixChefNft")
const { initializeHelixNft } = require("./helixNft")
const { initializeHelixToken } = require("./helixToken")
const { initializeMasterChef } = require("./masterChef")
const { initializeReferralRegister } = require("./referralRegister")
const { initializeRouter } = require("./router")
const { initFeeMinter } = require("./feeMinter")
const { initializeFeeHandler } = require("./feeHandler")

module.exports = {
    initializeFactory,
    initializeHelixChefNft,
    initializeHelixNft,
    initializeHelixToken,
    initializeMasterChef,
    initializeReferralRegister,
    initializeRouter,
    initializeFeeMinter,
    initializeFeeHandler,
}
