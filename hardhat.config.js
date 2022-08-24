require("@nomiclabs/hardhat-waffle");
require('@nomiclabs/hardhat-ethers');
require("@nomiclabs/hardhat-etherscan");
require("hardhat-gas-reporter")
require('@openzeppelin/hardhat-upgrades');
require("dotenv").config();

require("./tasks/approveLp")
require("./tasks/devTeamTransfer")

require("./tasks/call")
require("./tasks/subtasks/ownerMultiSig")
require("./tasks/subtasks/devTeamMultiSig")
require("./tasks/subtasks/treasuryMultiSig")
require("./tasks/subtasks/timelock")
require("./tasks/subtasks/helixToken")
require("./tasks/subtasks/feeHandler")
require("./tasks/subtasks/feeMinter")
require("./tasks/subtasks/referralRegister")
require("./tasks/subtasks/helixVault")
require("./tasks/subtasks/factory")
require("./tasks/subtasks/oracleFactory")
require("./tasks/subtasks/router")
require("./tasks/subtasks/migrator")
require("./tasks/subtasks/swapRewards")
require("./tasks/subtasks/masterChef")
require("./tasks/subtasks/autoHelix")
require("./tasks/subtasks/multicall")
require("./tasks/subtasks/paymentSplitter")
require("./tasks/subtasks/helixChefNft")
require("./tasks/subtasks/helixNft")
require("./tasks/subtasks/helixNftBridge")
require("./tasks/subtasks/lpSwap")


const mnemonic = process.env.MNEMONIC;
const bscScanApiKey = process.env.BSCSCANAPIKEY;
const etherscanApiKey = process.env.ETHERSCANAPIKEY;
const mainnetApiKey = process.env.MAINNETAPIKEY;
const ropstenURL = process.env.ROPSTEN_URL;
const rinkebyURL = process.env.RINKEBY_URL;
const goerliURL = process.env.GOERLI_URL;
const alchemyURL = process.env.ALCHEMY_URL;
const privateKey = process.env["PRIVATE_KEY"];

task("accounts", "Prints the list of accounts", async () => {
    const accounts = await ethers.getSigners();

    for (const account of accounts) {
        console.log(account.address);
    }
});

function getAccounts() {
    if (mnemonic != null) {
        return { mnemonic };
    }
    if (privateKey != null) {
        return [ privateKey ];
    }
    return [];
}

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        localhost: {
            url: "http://127.0.0.1:8545"
        },
        hardhat: {
            blockGasLimit: 99999999
        },
        frame: {
            url: 'http://localhost:1248'
        },
        testnetBSC: {
            url: "https://data-seed-prebsc-1-s1.binance.org:8545",
            chainId: 97,
            gasPrice: 20000000000,
            gas: 2100000,
            accounts: getAccounts(),
        },
        mainnetBSC: {
            url: "https://bsc-dataseed1.binance.org",
            chainId: 56,
            gasPrice: 20000000000,
            gas: 2100000,
            accounts: getAccounts(),
        },
        rinkeby: {
            url: rinkebyURL || "",
            chainId: 4,
            gasPrice: 5000000000,
            accounts: getAccounts(),
        },
        goerli: {
            url: goerliURL || "",
            chainId: 5,
            gasPrice: 5000000000,
            accounts: getAccounts(),
        },
        ropsten: {
            url: ropstenURL || "",
            chainId: 3,
            gasPrice: 5000000000,
            accounts: getAccounts(),
        },
        mainnetETH: {
            url: alchemyURL || "",
            chainId: 1,
            gasPrice: 15000000000,
            accounts: getAccounts(),
        },
        rskMainnet: {
            chainId: 30,
            url: 'https://public-node.rsk.co',
            gasPrice: 5000000000,
            accounts: getAccounts(),
        },
        rskTestnet: {
            chainId: 31,
            url: 'https://public-node.testnet.rsk.co/',
            gasPrice: 5000000000,
            accounts: getAccounts(),
        },
        okcMainnet: {
            chainId: 66,
            url: 'https://exchainrpc.okex.org/',
            gasPrice: 100000000,
            accounts: getAccounts(),
        },
    },
    solidity: {
        compilers:[
            {
                version: "0.8.10",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    }
                }
            }
        ]
    },
    gasReporter: {
        enabled: true,
        currency: "USD",
    },
    etherscan: {
        apiKey: etherscanApiKey
    },
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts"
    },
    mocha: {
        timeout: 200000
    }
}
