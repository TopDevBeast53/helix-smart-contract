const { Connection, PublicKey, clusterApiUrl } = require("@solana/web3.js");
const TOKEN_PROGRAM_ID = require("@solana/spl-token");
const { Program, Provider, Wallet } = require("@project-serum/anchor");
const {
  establishConnection, establishPayer, getQueuedEvents
} = require("./helper.js");

async function main() {
  
  const connection = establishConnection();
  const [program, wallet] = await establishPayer(connection);
  const bridged_events = await getQueuedEvents();
  

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
