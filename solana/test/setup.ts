import {
  Connection,
  Keypair,
  PublicKey,
  Signer,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  sendAndConfirmRawTransaction
} from "@solana/web3.js";

import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { getKeypair, getPublicKey } from "./utils";
import { BN } from "bn.js";
import * as nacl from "tweetnacl";

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
  receiverPubKey: PublicKey,
  clientKeypair: Signer,
  mintAuthority: Keypair
): Promise<[Token, PublicKey, PublicKey]> => {
  const mint = await createMint(connection, clientKeypair, mintAuthority.publicKey)
  const senderTokenAccount = await mint.createAccount(senderPubKey)
  const receiverTokenAccount = await mint.createAccount(receiverPubKey)

  console.log(`${name} case created successfully!`)

  return [mint, senderTokenAccount, receiverTokenAccount]
}

const setup = () => {
  const WrapNFTs = 2;

  // const connection = new Connection("http://localhost:8899", "confirmed");
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  // const connection = new Connection("https://api.testnet.solana.com", "recent");

  const clientKeypair = getKeypair('id')
  const programKeypair = getKeypair('program')
  const sender = getPublicKey('sender')

  // airdrop some sols for test
  // await connection.requestAirdrop(sender, LAMPORTS_PER_SOL * 100)
  // await connection.requestAirdrop(clientKeypair.publicKey, LAMPORTS_PER_SOL * 100)

  return { WrapNFTs, connection, clientKeypair, programKeypair, sender }
}

const test_wrapper_in = async () => {
  const { WrapNFTs, connection, clientKeypair, programKeypair, sender } = setup()

  let keysInfo = []

  for (let i = 0; i < WrapNFTs; i++) {
    const mintAuthority = Keypair.generate()
    const [mint, senderTokenAccount, programTokenAccount] = await setupMint(`Test ${i}`, connection, sender, programKeypair.publicKey, clientKeypair, mintAuthority)
    await mint.mintTo(senderTokenAccount, mintAuthority, [], 1)

    keysInfo.push({ pubkey: senderTokenAccount, isSigner: false, isWritable: true })
    keysInfo.push({ pubkey: programTokenAccount, isSigner: false, isWritable: true })
  }

  const initProgramIx = new TransactionInstruction({
    programId: programKeypair.publicKey,
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

const test_wrapper_out = async () => {
  const { WrapNFTs, connection, clientKeypair, programKeypair, sender } = setup()

  let keysInfo = []

  for (let i = 0; i < WrapNFTs; i++) {
    const mintAuthority = Keypair.generate()
    const [mint, programTokenAccount, receiverTokenAccount] = await setupMint(`Test ${i}`, connection, programKeypair.publicKey, clientKeypair.publicKey, clientKeypair, mintAuthority)
    await mint.mintTo(programTokenAccount, mintAuthority, [], 1)

    keysInfo.push({ pubkey: programTokenAccount, isSigner: false, isWritable: true })
    keysInfo.push({ pubkey: receiverTokenAccount, isSigner: false, isWritable: true })
  }

  const initProgramIx = new TransactionInstruction({
    programId: programKeypair.publicKey,
    keys: [
      { pubkey: clientKeypair.publicKey, isSigner: true, isWritable: false },
      { pubkey: programKeypair.publicKey, isSigner: true, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      ...keysInfo,
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
    ],
    data: Buffer.from(
      Uint8Array.of(
        1,
        ...new BN(WrapNFTs).toArray("le", 8)
      )
    )
  })

  try {
    let recentBlockhash = await connection.getRecentBlockhash();
    let manualTransaction = new Transaction({
      recentBlockhash: recentBlockhash.blockhash,
      feePayer: clientKeypair.publicKey,
    });
    manualTransaction.add(initProgramIx);

    let transactionBuffer = manualTransaction.serializeMessage();
    let signature1 = nacl.sign.detached(
      transactionBuffer,
      programKeypair.secretKey
    );
    let signature2 = nacl.sign.detached(
      transactionBuffer,
      clientKeypair.secretKey
    );

    manualTransaction.addSignature(programKeypair.publicKey, Buffer.from(signature1));
    manualTransaction.addSignature(clientKeypair.publicKey, Buffer.from(signature2));

    let isVerifiedSignature = manualTransaction.verifySignatures();
    console.debug(
      `The signatures were verifed: ${isVerifiedSignature}`,
      programKeypair.publicKey.toString(),
      clientKeypair.publicKey.toString()
    );

    let rawTransaction = manualTransaction.serialize();

    await sendAndConfirmRawTransaction(connection, rawTransaction);
  } catch (err) {
    console.error("Transaction error: ", err);
  }
}

// test_wrapper_in()

test_wrapper_out()