task("approveLp", "Approve spender to spend amount of lpToken")
    .addPositionalParam("lpToken")
    .addPositionalParam("spender")
    .addPositionalParam("amount")
    .setAction(async (args) => {
        const lpTokenContractFactory = await hre.ethers.getContractFactory("HelixLP")

        const [wallet] = await hre.ethers.getSigners()
        const lpToken = lpTokenContractFactory.attach(args.lpToken).connect(wallet)

        const tx = await lpToken.approve(args.spender, args.amount)
        await tx.wait()
    })
