const { loadContract } = require("./utilities")

const env = require("../constants/env")
const contracts = require("../constants/contracts")

const name = "AutoHelix"
const address = contracts.autoHelix[env.network]

const contract = async () => await hre.run("loadContract", { name: name, address: address })


// READ


// MAX_CALL_FEE

// MAX_PERFORMANCE_FEE

// MAX_WITHDRAW_FEE

// MAX_WITHDRAW_FEE_PERIOD

// available

task("autoHelix.balanceOf")
    .setAction(async () => {
        const result = await (await contract()).balanceOf()
        console.log(result.toString())
    })

// calculateHarvestRewards

// calculateTotalPendingHelixRewards

// callFee

// getPricePerFullShare

// lastHarvestedTime

// masterChef

// owner

// paused

// performaceFee

// timelockOwner

// token

// totalShares

// treasury

// userInfo

// withdrawFee

// withdrawFeePeriod


// WRITE


// deposit

// emergencyWithdraw

// harvest

// inCaseTokensGetStuck

// initialize

// pause

// renounceOwnership

// renounceTimelockOwnership

// setCallFee

// setMasterChef

// setPerformanceFee

// setTreasury

// setWithdrawFee

// setWithdrawFeePeriod

// transferOwnership

// transferTimelockOwnership

// unpause

// withdraw

// withdrawAll
