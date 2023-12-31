// This script exports "upgrade" functions which are used to upgrade contracts

const { upgradeMasterChef } = require("./masterChef")
const { upgradeHelixChefNft } = require("./helixChefNft")
const { upgradeSynthReactor } = require("./synthReactor")

module.exports = {
    upgradeMasterChef,
    upgradeHelixChefNft,
    upgradeSynthReactor,
}
