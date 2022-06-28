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
}
