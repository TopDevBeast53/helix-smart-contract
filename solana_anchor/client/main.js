const { 
    Connection, 
    PublicKey, 
    clusterApiUrl, 
  } = require('@solana/web3.js');
const TOKEN_PROGRAM_ID = require('@solana/spl-token');
const {
  Program,
  Provider,
  Wallet
} = require('@project-serum/anchor') 
const Contract = require('web3-eth-contract');
const dotenv = require('dotenv');
const { getOrCreateAssociatedTokenAccount, createKeypairFromFile } = require('./util.js'); 
const idl = require('../target/idl/solana_anchor.json');

async function main() {
  const network = 'devnet';
  const endpoint = () => clusterApiUrl(network);
  const opts = {
    preflightCommitment: "recent",
  };
  const defaultOpts = {
    preflightCommitment: "processed",
    commitment: "processed",
  };

  console.debug('info', dotenv)
  const getClusterURL = endpoint;
  const programID = new PublicKey("A7nCafiWF1mDUHYJxfXGaBX3vJm7XvzkUtgSe9R1kK9D");
  
  const connection = new Connection(getClusterURL(), opts.preflightCommitment);
  
  const keyPair = await createKeypairFromFile('target/deploy/solana_anchor-keypair.json');
  const wallet = new Wallet(keyPair);
  
  const provider = new Provider(connection, wallet, defaultOpts);
  const program = new Program(idl, programID, provider);

  const contract = new Contract()
  
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

