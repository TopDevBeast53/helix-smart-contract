// npx hardhat submitDevTeamTransfer --network [network]
task("submitDevTeamTransfer", "Submit and confirm a transfer of dev team funds")
    .setAction(async () => {
        const { getChainId, loadContractNoVerbose } = require("../scripts/shared/utilities")
        const contracts = require("../constants/contracts")

        const chainId = await getChainId()
        console.log(`chainId:\t\t\t\t${chainId}`)
        console.log("\n")

        // Withdraw devTeam funds to devTeamMultiSig
        console.log("Withdraw devTeam funds from masterChef to devTeamMultoSig")
        const masterChefAddress = contracts.masterChef[chainId]
        console.log(`masterChef address:\t\t\t${masterChefAddress}`)
        const masterChef = await loadContractNoVerbose(masterChefAddress)

        let tx = await masterChef.withdrawDevAndRefFee()
        await tx.wait()
        console.log("\n")

        // Submit a transfer of devTeamMultiSig balance to paymentSplitter
        console.log("Submit a transfer of devTeamMultiSig helixToken balance to paymentSplitter")
        const devTeamMultiSigAddress = contracts.devTeamMultiSig[chainId]
        console.log(`devTeamMultiSig address:\t\t${devTeamMultiSigAddress}`)
        const devTeamMultiSig = await loadContractNoVerbose(devTeamMultiSigAddress)

        const helixTokenAddress = contracts.helixToken[chainId]
        console.log(`helixToken address:\t\t\t${helixTokenAddress}`)
        const helixTokenBalance = await devTeamMultiSig.getBalance(helixTokenAddress)

        const paymentSplitterAddress = contracts.paymentSplitter[chainId]
        console.log(`paymentSplitter address:\t\t${paymentSplitterAddress}`)

        tx = await devTeamMultiSig.submitTransfer(
            helixTokenAddress, 
            paymentSplitterAddress, 
            helixTokenBalance
        )
        await tx.wait()

        // Log the created transaction index
        const txIndex = (await devTeamMultiSig.getTransactionCount()) - 1
        console.log(`Submitted a transfer with txIndex:\t${txIndex}`)
        console.log("\n")

        // Confirm the transfer
        console.log("Confirm the transfer")
        tx = await devTeamMultiSig.confirmTransaction(txIndex)
        await tx.wait()

        // Log the required confirmations remaining
        const adminConfirmationsRequired = await devTeamMultiSig.adminConfirmationsRequired()
        const ownerConfirmationsRequired = await devTeamMultiSig.ownerConfirmationsRequired()

        const transaction = await devTeamMultiSig.getTransaction(txIndex)
        const adminConfirmations = transaction.adminConfirmations
        const ownerConfirmations = transaction.ownerConfirmations

        const adminConfirmationsRemaining = adminConfirmationsRequired - adminConfirmations
        const ownerConfirmationsRemaining = ownerConfirmationsRequired - ownerConfirmations

        console.log("Required confirmations remaining:")
        console.log(`\tadmin:\t\t\t\t${adminConfirmationsRemaining}`)
        console.log(`\towner:\t\t\t\t${ownerConfirmationsRemaining}`)

        console.log("\n")
        console.log("Done")
    })

// npx hardhat executeDevTeamTransfer [txIndex] --network [network]
task("executeDevTeamTransfer", "Execute a transfer of dev team funds")
    .addPositionalParam("txIndex")
    .setAction(async (args) => {
        const { getChainId, loadContractNoVerbose } = require("../scripts/shared/utilities")
        const contracts = require("../constants/contracts")

        const chainId = await getChainId()
        console.log(`chainId:\t\t\t\t${chainId}`)
        console.log("\n")

        const txIndex = args.txIndex

        // Execute the transaction to transfer funds
        console.log("Execute the transaction to transfer all helixToken from devTeamMultiSig to paymentSplitter")

        // load multiSigWallet contract
        const devTeamMultiSigAddress = contracts.devTeamMultiSig[chainId]
        console.log(`devTeamMultiSig address:\t\t${devTeamMultiSigAddress}`)
        const devTeamMultiSig = await loadContractNoVerbose(devTeamMultiSigAddress)

        // Compute the required confirmations remaining
        // and quit if either is > 0
        const adminConfirmationsRequired = await devTeamMultiSig.adminConfirmationsRequired()
        const ownerConfirmationsRequired = await devTeamMultiSig.ownerConfirmationsRequired()

        const transaction = await devTeamMultiSig.getTransaction(txIndex)
        const adminConfirmations = transaction.adminConfirmations
        const ownerConfirmations = transaction.ownerConfirmations

        const adminConfirmationsRemaining = adminConfirmationsRequired - adminConfirmations
        const ownerConfirmationsRemaining = ownerConfirmationsRequired - ownerConfirmations

        if (adminConfirmationsRemaining > 0 || ownerConfirmationsRemaining > 0) {
            console.log("\n")
            console.log("UNABLE TO EXECUTE")
            console.log("Required confirmations remaining:")
            console.log(`\tadmin:\t\t\t\t${adminConfirmationsRemaining}`)
            console.log(`\towner:\t\t\t\t${ownerConfirmationsRemaining}`)
            console.log("\n")
            console.log("Done")
            return
        }

        let tx = await devTeamMultiSig.executeTransaction(txIndex)
        await tx.wait()

        // load paymentSplitter contract
        const helixTokenAddress = contracts.helixToken[chainId]
        console.log(`helixToken address:\t\t\t${helixTokenAddress}`)

        const paymentSplitterAddress = contracts.paymentSplitter[chainId]
        console.log(`paymentSplitter address:\t\t${paymentSplitterAddress}`)
        const paymentSplitter = await loadContractNoVerbose(paymentSplitterAddress)
        console.log("\n")

        // Distribute paymentSplitter funds to payees
        console.log("Release all helixToken from paymentSplitter to payees")
        tx = await paymentSplitter.releaseAllErc20(helixTokenAddress)
        await tx.wait()

        console.log("\n")
        console.log("Done")
    })
