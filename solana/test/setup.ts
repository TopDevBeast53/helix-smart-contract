import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  Signer,
  SystemProgram,
  Transaction,
  TransactionInstruction
} from "@solana/web3.js";

import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { getKeypair, getPublicKey } from "./utils";
import { BN } from "bn.js";

const createMint = (
  connection: Connection,
  { publicKey, secretKey }: Signer
) => {
  return Token.createMint(
    connection,
    {
      publicKey,
      secretKey,
    },
    publicKey,
    null,
    0,
    TOKEN_PROGRAM_ID
  );
};

const setupMint = async(
  name: string,
  connection: Connection,
  senderPubKey: PublicKey,
  programPublicKey: PublicKey,
  clientKeypair: Signer
): Promise<[Token, PublicKey, PublicKey]> => {
  console.log(`Creating Mint ${name}`)
  const mint = await createMint(connection, clientKeypair)

  console.log(`Creating sender Token account`)
  const senderTokenAccount = await mint.createAccount(senderPubKey)

  console.log(`Creating program Token account`)
  const programTokenAccount = await mint.createAccount(programPublicKey)

  return [mint, senderTokenAccount, programTokenAccount]
}

const setup = async() => {
    const connection = new Connection("http://localhost:8899", "confirmed");
    // const connection = new Connection("https://api.devnet.solana.com", "confirmed");
    // const connection = new Connection("https://api.testnet.solana.com", "confirmed");

    const clientKeypair = getKeypair('id')
    const programId = getPublicKey('program')
    const sender = getPublicKey('sender')

    // airdrop some sols for test
    await connection.requestAirdrop(sender, LAMPORTS_PER_SOL * 100)
    await connection.requestAirdrop(clientKeypair.publicKey, LAMPORTS_PER_SOL * 100)

    const [mint, senderTokenAccount, programTokenAccount] = await setupMint('single', connection, sender, programId, clientKeypair)
    
    await mint.mintTo(senderTokenAccount, clientKeypair, [], 1)

    const initProgramIx = new TransactionInstruction({
      programId,
      keys: [     
        { pubkey: clientKeypair.publicKey, isSigner: true, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: senderTokenAccount, isSigner: false, isWritable: true },
        { pubkey: programTokenAccount, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner:false, isWritable:false }
      ],
      data: Buffer.from(
        Uint8Array.of(
          0,
          ...new BN(1).toArray("le", 8)
        )
      )
    })

    const tx = new Transaction().add(
      initProgramIx
    )
    
    await connection.sendTransaction(
      tx,
      [clientKeypair],
      { skipPreflight: false, preflightCommitment: "confirmed" }
    )
}

setup()