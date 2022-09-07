// This script exports the "initialize" functions with restore the contracts to their 
// default states

const { initializeFactory } = require("./factory")
const { initializeHelixChefNft } = require("./helixChefNft")
const { initializeHelixNft } = require("./helixNft")
const { initializeHelixToken } = require("./helixToken")
const { initializeReferralRegister } = require("./referralRegister")
const { initializeRouter } = require("./router")
const { initializeFeeMinter } = require("./feeMinter")
const { initializeFeeHandler } = require("./feeHandler")

module.exports = {
    initializeFactory,
    initializeHelixChefNft,
    initializeHelixNft,
    initializeHelixToken,
    initializeReferralRegister,
    initializeRouter,
    initializeFeeMinter,
    initializeFeeHandler,
}
