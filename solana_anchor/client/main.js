const { Connection, PublicKey, clusterApiUrl } = require("@solana/web3.js");
const TOKEN_PROGRAM_ID = require("@solana/spl-token");
const { Program, Provider, Wallet } = require("@project-serum/anchor");
const {
  establishConnection,
  establishPayer,
  getQueuedEvents,
  getProgramOwnedNfts,
} = require("./helper.js");

async function main() {
  // make connection to solana network
  const connection = establishConnection();
  // get information for transaction payer
  const [program, wallet] = await establishPayer(connection);
  // get bridged events from binance network
  const bridged_events = await getQueuedEvents();
  // get solana nfts owned by program
  const program_nfts = await getProgramOwnedNfts(connection);

  console.debug("okay", program_nfts);
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
