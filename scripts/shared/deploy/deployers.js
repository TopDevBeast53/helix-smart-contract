// This script exports "deploy" functions which are used to deploy contracts

const { deployOwnerMultiSig } = require("./ownerMultiSig")
const { deployTreasuryMultiSig } = require("./treasuryMultiSig")
const { deployDevTeamMultiSig } = require("./devTeamMultiSig")
const { deployTimelock } = require("./timelock")
const { deployHelixToken } = require("./helixToken")
const { deployHelixNft } = require("./helixNft")
const { deployFeeMinter } = require("./feeMinter")
const { deployHelixNftBridge } = require("./helixNftBridge")

module.exports = {
    deployOwnerMultiSig,
    deployTreasuryMultiSig,
    deployDevTeamMultiSig,
    deployTimelock,
    deployHelixToken,
    deployHelixNft,
    deployFeeMinter,
    deployHelixNftBridge,
}
