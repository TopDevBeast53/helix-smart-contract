task("submitDevTeamTransfer", "Submit and confirm a transfer of dev team funds")
    .setAction(async () => {
        const { getChainId, loadContractNoVerbose } = require("../scripts/shared/utilities")
        const contracts = require("../constants/contracts")

        const chainId = await getChainId()

        // Withdraw devTeam funds to devTeamMultiSig
        console.log("Withdraw devTeam funds from masterChef to devTeamMultoSig")
        const masterChefAddress = contracts.masterChef[chainId]
        const masterChef = await loadContractNoVerbose(masterChefAddress)

        let tx = await masterChef.withdrawDevAndRefFee()
        await tx.wait()

        // Submit a transfer of devTeamMultiSig balance to paymentSplitter
        console.log("Submit a transfer of devTeamMultiSig helixToken balance to paymentSplitter")
        const devTeamMultiSigAddress = contracts.devTeamMultiSig[chainId]
        const devTeamMultiSig = await loadContractNoVerbose(devTeamMultiSigAddress)

        const helixTokenAddress = contracts.helixToken[chainId]
        const helixTokenBalance = await devTeamMultiSig.getBalance(helixTokenAddress)

        const paymentSplitterAddress = contracts.paymentSplitter[chainId]

        tx = await devTeamMultiSig.submitTransfer(
            helixTokenAddress, 
            paymentSplitterAddress, 
            helixTokenBalance
        )
        await tx.wait()

        // Log the created transaction index
        const txIndex = (await devTeamMultiSig.getTransactionCount()) - 1
        console.log(`Submitted a transfer with txIndex: ${txIndex}`)

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
        console.log(`\tadmin: ${adminConfirmationsRemaining}`)
        console.log(`\towner: ${ownerConfirmationsRemaining}`)

        console.log("Done")
    })

task("executeDevTeamTransfer", "Execute a transfer of dev team funds")
    .addPositionalParam("txIndex")
    .setAction(async (args) => {
        const { getChainId, loadContractNoVerbose } = require("../scripts/shared/utilities")
        const contracts = require("../constants/contracts")

        const chainId = await getChainId()
        const txIndex = args.txIndex

        // load multiSigWallet contract
        const devTeamMultiSigAddress = contracts.devTeamMultiSig[chainId]
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
            console.log("Required confirmations remaining:")
            console.log(`\tadmin: ${adminConfirmationsRemaining}`)
            console.log(`\towner: ${ownerConfirmationsRemaining}`)
            return
        }

        // Execute the transaction to transfer funds
        console.log("Execute the transaction to transfer funds from devTeamMultiSig to paymentSplitter")
        let tx = await devTeamMultiSig.executeTransaction(txIndex)
        await tx.wait()

        // load paymentSplitter contract
        const paymentSplitterAddress = contracts.paymentSplitter[chainId]
        const paymentSplitter = await loadContractNoVerbose(paymentSplitterAddress)

        const helixTokenAddress = contracts.helixToken[chainId]

        // Distribute paymentSplitter funds to payees
        console.log("Release all helixToken from paymentSplitter to payees")
        tx = await paymentSplitter.releaseAllErc20(helixTokenAddress)
        await tx.wait()

        console.log("Done")
    })
