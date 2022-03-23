const { Connection, PublicKey, clusterApiUrl } = require("@solana/web3.js");
const TOKEN_PROGRAM_ID = require("@solana/spl-token");
const { Program, Provider, Wallet } = require("@project-serum/anchor");
const Contract = require("web3-eth-contract");
const dotenv = require("dotenv").config();
const {
  getOrCreateAssociatedTokenAccount,
  createKeypairFromFile,
} = require("./util.js");
const idl = require("../target/idl/solana_anchor.json");
const compiledBridge = require("../target/idl/AuraNFTBridge.json");

async function main() {
  const network = dotenv.parsed.NETWORK;
  const endpoint = () => clusterApiUrl(network);
  const opts = {
    preflightCommitment: "recent",
  };
  const defaultOpts = {
    preflightCommitment: "processed",
    commitment: "processed",
  };

  const getClusterURL = endpoint;
  const programID = new PublicKey(dotenv.parsed.PROGRAM_ID);

  const connection = new Connection(getClusterURL(), opts.preflightCommitment);

  const keyPair = await createKeypairFromFile(
    "target/deploy/solana_anchor-keypair.json"
  );
  const wallet = new Wallet(keyPair);

  const provider = new Provider(connection, wallet, defaultOpts);
  const program = new Program(idl, programID, provider);
  Contract.setProvider(dotenv.parsed.RPC);
  const contract = new Contract(
    compiledBridge.abi,
    dotenv.parsed.CONTRACT_ADDRESS
  );
    
  bridged_events = await contract.methods.getBridgeToSolanaEvents().call();
  console.debug("okay", bridged_events);
  // const senderATA = await getOrCreateAssociatedTokenAccount(wallet.publicKey, mint, wallet.publicKey, wallet.signTransaction)
  // const receiverATA = await getOrCreateAssociatedTokenAccount(wallet.publicKey, mint, programID, wallet.signTransaction);

  // await program.rpc.transferOut(
  //     uint8array,
  //     {
  //       accounts: {
  //         stateAccount: statePDA,
  //         from: senderATA.address,
  //         to: receiverATA.address,
  //         owner: wallet.publicKey,
  //         tokenProgram: TOKEN_PROGRAM_ID,
  //       },
  //       signers: [],
  //     }
  // )
}

main();
