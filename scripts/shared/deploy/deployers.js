// This script exports "deploy" functions which are used to deploy contracts

const { deployOwnerMultiSig } = require("./ownerMultiSig")
const { deployTreasuryMultiSig } = require("./treasuryMultiSig")

module.exports = {
    deployOwnerMultiSig,
    deployTreasuryMultiSig,
}
