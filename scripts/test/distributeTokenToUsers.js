// npx hardhat run scripts/distributeTokenToUsers.js --network rinkeby

const { ethers, upgrades } = require("hardhat")
const contracts = require("./constants/contracts")
const env = require("./constants/env")

const helixToken = contracts.helixToken[env.network];
const usdtToken = "0x2a4a8B7555bDbBfef4a50E4E5c4Ed42C7A504Ce5";

const addresses = ['0x983268d0047121Af20a054Cdf91808fCc79D2396','0xA8e770D5976A2E54F9D5c3A16c41a1aACa0244D6','0x775FADF9611D40503191f0972CA20d07934e9dfA','0xc1Bd1C842F713134C6C40D3300E2B3aF44bE010C','0x673b1e8cD62C67989972C6bf2bD176738E1E8c5E','0xc84B9Eb01921843ea53C6314fBf7f4051A8Ee012','0x00ea890138fC0a6B06aF15b420353c3d12841dF7','0xFD7926c365132Caad149cC1fF030e5461bBf3a2d','0xCdC9Ee92c4DBe054b84ffea9757d47dc8A00E5f9','0xD30907f5470Ed15215201346C8D5e02A327e34db','0x010a041197306B8aE721C2af4a51c4DdB3874208','0x20f7F9b7C1AEF55106b9c4cF66fB316346B73B41','0x7452faFF02a9678061220445Ad59c9E869baf2A9','0x0c5D1220b0dFaEd89707E11328d29b3202FfcD5e','0x07064128Ef444f07cDa9707764CFCf93eB2c1857','0x0c442623B6B99C967d897077EA500E9aCddc8ab9','0x48757C39360b6cC542F51C698B1436bE4c5160c2','0xF3C3f536A70C09E7Eaf1E000809d5B6463c20573','0xAAb2eACC08690BDbE4A11F43498cA0b9D37D16c2','0xD73E9Ba2d2806807C5bb82D9B0D73462c70718d8','0x0161B77b0bBac3b3647BE2a95eFDfb2b0acB3F6c','0x6Bf5EE5390E49AE8C0Fa1E4aDa41B7e69d6C4c9B','0x20f634dB547e9E64802F53E95565a82C0D26B031','0xAef38c960b1059ABE7A7af8d906CDb7bcCdbb581','0x35f35479Aca3fbB197766C19fe099A05a9c1C7D9','0x9de2b52bF7a17593B75450aEFCE337A2B6434444','0x048E0F19C82263c32298cE05a1f8804bE227CEec','0x4fa268ff1EE3F33fcd14504E4e6377989341b7e2','0xBab925367D4DD8A2ba9F620fF254BF8D1684Bbb3','0xdaf8cC464Cb337f1f9Ca44331D602Ee3A1cc9ca9','0x6310d25AD2aC1456CFF02B70baC18A1A4e49e107','0x68a8875A9E8F11BD0618369DfAda8f28c9a48549','0xB2069a5506b15B98284d2f249716d38FC5B9bbbD','0x59d24846Fe1D286AB8E5c711a488c76A7d800448','0xDb4090D72134F820c863c022CF1F2E66a75fC0b0','0x746efa363E67cb64E07B2B2E27C0ee719C1e894f','0xCC8b0d940F3C450593b06e92e74C96b7908765f1','0xf50Fee3A8196e49bfb6501e86411936EcB03E952','0xe952AF3ceB8df334A0Dc5919C819da95F1d439f7','0x60E67d916eeD437D5939e0F962EE7F12a2257494','0x8B883C6d8d675d833Ec74F226f34a608320D971a','0x6b90F95ee88A5452728c3903C42732466e8fa3a7','0x4F9099d1C393bFB576f6E541E4BdC42d5050366f']

async function main() {
    const [deployer] = await ethers.getSigners()
    console.log(`Setter address: ${deployer.address}`)
    
    const rpc =  new ethers.providers.JsonRpcProvider(env.rpcURL) ;
    const admin = new ethers.Wallet( process.env.PRIVATE_KEY, rpc);

    const HelixTokenName = "HelixToken"
    const IHelixToken = await getContract(HelixTokenName, helixToken, admin)
    await transferToken(
        HelixTokenName, 
        IHelixToken, 
        '10000000000000000000000'
    )

    const testTokenName = "TestToken"
    const ITestToken = await getContract(testTokenName, usdtToken, admin)
    await transferToken(
        testTokenName, 
        ITestToken, 
        '1000000000'
    )
}    

async function getContract(name, address, admin) {
    console.log(`Get contract ${name} from address ${address}`)
    const contractFactory = await ethers.getContractFactory(name)
    const contract = contractFactory.attach(address).connect(admin);
    return contract
}

async function transferToken(name, contract, amount) {
    console.log(`Send ${name} ${amount} to Users `)
    for (let i = 0; i < addresses.length; i++) {
        const address = addresses[i]
        const tx = await contract.transfer(address, amount)
        await tx.wait()
        console.log(`index:${i} sent to ${address} `)
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
 
