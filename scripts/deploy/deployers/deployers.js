// This script exports "deploy" functions which are used to deploy contracts

const { deployOwnerMultiSig } = require("./ownerMultiSig")
const { deployTreasuryMultiSig } = require("./treasuryMultiSig")
const { deployDevTeamMultiSig } = require("./devTeamMultiSig")
const { deployTimelock } = require("./timelock")
const { deployHelixToken } = require("./helixToken")
const { deployHelixNft } = require("./helixNft")
const { deployFeeMinter } = require("./feeMinter")
const { deployHelixNftBridge } = require("./helixNftBridge")
const { deployHelixChefNft } = require("./helixChefNft")
const { deployFeeHandler } = require("./feeHandler")
const { deployReferralRegister } = require("./referralRegister")
const { deployHelixVault } = require("./helixVault")
const { deployFactory } = require("./factory")
const { deployOracleFactory } = require("./oracleFactory")
const { deployRouter } = require("./router")
const { deployMigrator } = require("./migrator")
const { deploySwapRewards } = require("./swapRewards")
const { deployMasterChef } = require("./masterChef")
const { deployAutoHelix } = require("./autoHelix")
const { deployMulticall } = require("./multicall")
const { deployYieldSwap } = require("./yieldSwap")
const { deployLpSwap } = require("./lpSwap")
const { deployAirDrop } = require("./airDrop")
const { deployTestToken } = require("./testToken")
const { deployAdvisorRewards } = require("./advisorRewards")

module.exports = {
    deployOwnerMultiSig,
    deployTreasuryMultiSig,
    deployDevTeamMultiSig,
    deployTimelock,
    deployHelixToken,
    deployHelixNft,
    deployFeeMinter,
    deployHelixNftBridge,
    deployHelixChefNft,
    deployFeeHandler,
    deployReferralRegister,
    deployHelixVault,
    deployFactory,
    deployOracleFactory,
    deployRouter,
    deployMigrator,
    deploySwapRewards,
    deployMasterChef,
    deployAutoHelix,
    deployMulticall,
    deployYieldSwap,
    deployLpSwap,
    deployAirDrop,
    deployTestToken,
    deployAdvisorRewards,
}
