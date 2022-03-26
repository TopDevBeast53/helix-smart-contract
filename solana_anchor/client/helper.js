const { Connection, PublicKey, clusterApiUrl } = require("@solana/web3.js");
const { Program, Provider, Wallet } = require("@project-serum/anchor");
const Contract = require("web3-eth-contract");
const dotenv = require("dotenv").config().parsed;
const {
  getOrCreateAssociatedTokenAccount,
  createKeypairFromFile,
  deserializeAccountInfo,
} = require("./util.js");

const idl = require("../target/idl/solana_anchor.json");
const compiledBridge = require("../target/idl/AuraNFTBridge.json");
const programID = new PublicKey(dotenv.PROGRAM_ID);

function establishConnection() {
  const network = dotenv.NETWORK;
  const opts = {
    preflightCommitment: "recent",
  };

  const connection = new Connection(
    clusterApiUrl(network),
    opts.preflightCommitment
  );

  return connection;
}

async function establishPayer(connection) {
  const keyPair = await createKeypairFromFile(
    "target/deploy/solana_anchor-keypair.json"
  );

  const defaultOpts = {
    preflightCommitment: "processed",
    commitment: "processed",
  };

  const wallet = new Wallet(keyPair);
  const provider = new Provider(connection, wallet, defaultOpts);
  const program = new Program(idl, programID, provider);

  return [program, wallet];
}

async function getQueuedEvents() {
  Contract.setProvider(dotenv.RPC);
  const contract = new Contract(compiledBridge.abi, dotenv.CONTRACT_ADDRESS);
  return await contract.methods.getBridgeToSolanaEvents().call();
}

async function getProgramOwnedNfts(connection) {
  const [statePDA, stateBump] = await PublicKey.findProgramAddress(
    [Buffer.from("test6")],
    programID
  );
  const stateAccount = await connection.getAccountInfo(statePDA);
  return deserializeAccountInfo(stateAccount.data);
}

module.exports = {
  establishConnection,
  establishPayer,
  getQueuedEvents,
  getProgramOwnedNfts,
};
