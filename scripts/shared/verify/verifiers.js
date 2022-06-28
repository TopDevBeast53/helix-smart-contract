// This script exports the "verify" functions in this directory

const { verifyOwnerMultiSig } = require("./ownerMultiSig")
const { verifyTreasuryMultiSig } = require("./treasuryMultiSig")
const { verifyDevTeamMultiSig } = require("./devTeamMultiSig")
const { verifyTimelock } = require("./timelock")
const { verifyHelixToken } = require("./helixToken")
const { verifyHelixNft } = require("./helixNft")
const { verifyFeeMinter } = require("./feeMinter")
const { verifyHelixNftBridge } = require("./helixNftBridge")
const { verifyHelixChefNft } = require("./helixChefNft")
const { verifyFeeHandler } = require("./feeHandler")
const { verifyReferralRegister } = require("./referralRegister")
const { verifyHelixVault } = require("./helixVault")
const { verifyFactory } = require("./factory")
const { verifyOracleFactory } = require("./oracleFactory")
const { verifyRouter } = require("./router")
const { verifyMigrator } = require("./migrator")
const { verifySwapRewards } = require("./swapRewards")
const { verifyMasterChef } = require("./masterChef")
const { verifyAutoHelix } = require("./autoHelix")
const { verifyMulticall } = require("./multicall")
/*
const { verifyYieldSwap } = require("./yieldSwap")
const { verifyLpSwap } = require("./lpSwap")
const { verifyAirDrop } = require("./airDrop")
const { verifyTestToken } = require("./testToken")
*/

module.exports = {
    verifyOwnerMultiSig,
    verifyTreasuryMultiSig,
    verifyDevTeamMultiSig,
    verifyTimelock,
    verifyHelixToken,
    verifyHelixNft,
    verifyFeeMinter,
    verifyHelixNftBridge,
    verifyHelixChefNft,
    verifyFeeHandler,
    verifyReferralRegister,
    verifyHelixVault,
    verifyFactory,
    verifyOracleFactory,
    verifyRouter,
    verifyMigrator,
    verifySwapRewards,
    verifyMasterChef,
    verifyAutoHelix,
    verifyMulticall,
    /*
    verifyYieldSwap,
    verifyLpSwap,
    verifyAirDrop,
    verifyTestToken,
    */
}
