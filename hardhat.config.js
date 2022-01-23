require("@nomiclabs/hardhat-waffle");
require('@nomiclabs/hardhat-ethers');
require("@nomiclabs/hardhat-etherscan");
require('@openzeppelin/hardhat-upgrades');
require("dotenv").config();

const mnemonic = process.env.MNEMONIC;
const bscScanApiKey = process.env.BSCSCANAPIKEY;
const privateKey = process.env["PRIVATE_KEY"];

task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

function resolveTestNetBSCAccounts() {
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
    testnetBSC: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      chainId: 97,
      gasPrice: 20000000000,
      accounts: resolveTestNetBSCAccounts(),
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
  etherscan: {
    apiKey: bscScanApiKey
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
};