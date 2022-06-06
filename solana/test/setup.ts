import {
  Connection,
  Keypair,
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
  { publicKey, secretKey }: Signer,
  mintAuthority: PublicKey
) => {
  return Token.createMint(
    connection,
    {
      publicKey,
      secretKey,
    },
    mintAuthority,
    null,
    0,
    TOKEN_PROGRAM_ID
  );
};

const setupMint = async (
  name: string,
  connection: Connection,
  senderPubKey: PublicKey,
  programPublicKey: PublicKey,
  clientKeypair: Signer,
  mintAuthority: Keypair
): Promise<[Token, PublicKey, PublicKey]> => {
  const mint = await createMint(connection, clientKeypair, mintAuthority.publicKey)
  const senderTokenAccount = await mint.createAccount(senderPubKey)
  const programTokenAccount = await mint.createAccount(programPublicKey)

  console.log(`${name} case created successfully!`)

  return [mint, senderTokenAccount, programTokenAccount]
}

const setup = async () => {
  const WrapNFTs = 14;

  // const connection = new Connection("http://localhost:8899", "confirmed");
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  // const connection = new Connection("https://api.testnet.solana.com", "confirmed");

  const clientKeypair = getKeypair('id')
  const programId = getPublicKey('program')
  const sender = getPublicKey('sender')

  // airdrop some sols for test
  // await connection.requestAirdrop(sender, LAMPORTS_PER_SOL * 100)
  // await connection.requestAirdrop(clientKeypair.publicKey, LAMPORTS_PER_SOL * 100)

  let keysInfo = []

  for (let i = 0; i < WrapNFTs; i++) {
    const mintAuthority = Keypair.generate()
    const [mint, senderTokenAccount, programTokenAccount] = await setupMint(`Test ${i}`, connection, sender, programId, clientKeypair, mintAuthority)
    await mint.mintTo(senderTokenAccount, mintAuthority, [], 1)

    keysInfo.push({ pubkey: senderTokenAccount, isSigner: false, isWritable: true })
    keysInfo.push({ pubkey: programTokenAccount, isSigner: false, isWritable: true })
  }

  const initProgramIx = new TransactionInstruction({
    programId,
    keys: [
      { pubkey: clientKeypair.publicKey, isSigner: true, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      ...keysInfo,
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
    ],
    data: Buffer.from(
      Uint8Array.of(
        0,
        ...new BN(WrapNFTs).toArray("le", 8)
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