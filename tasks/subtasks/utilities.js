subtask("loadContract", "Return instance of contract with name and address")  .addParam("name", "Contract name") 
    .addParam("address", "Contract deployed address")
    .setAction(async (args) => {      
        const [wallet] = await hre.ethers.getSigners() 
        const contractFactory = await hre.ethers.getContractFactory(args.name)
        return contractFactory.attach(args.address).connect(wallet) 
    })
