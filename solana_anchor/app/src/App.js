import "./App.css";
import { useState, useEffect } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import { Program, Provider, web3 } from "@project-serum/anchor";
import Contract from "web3-eth-contract";
import {
  getOrCreateAssociatedTokenAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import idl from "./solana_anchor.json";
import compiledBridge from "./AuraNFTBridge.json";

import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import {
  useWallet,
  WalletProvider,
  ConnectionProvider,
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
require("@solana/wallet-adapter-react-ui/styles.css");

const wallets = [
  /* view list of available wallets at https://github.com/solana-labs/wallet-adapter#wallets */
  new PhantomWalletAdapter(),
];

const { SystemProgram, Keypair } = web3;
/* create an account  */
const baseAccount = Keypair.generate();
const opts = {
  preflightCommitment: "processed",
};

const programID = new PublicKey(process.env.REACT_APP_PROGRAM_ID);
const NETWORK = process.env.REACT_APP_SOLANA_NETWORK;

function App() {
  const [value, setValue] = useState(null);
  const [connection, setConnection] = useState(null);
  const [nfts, setNfts] = useState([]);
  const [events, setEvents] = useState([]);
  const wallet = useWallet();
  const secretKeyString = process.env.REACT_APP_PRIVATE_KEY;
  async function getProvider() {
    /* create the provider and return it to the caller */
    setConnection(new Connection(NETWORK, opts.preflightCommitment));

    const provider = new Provider(connection, wallet, opts.preflightCommitment);
    return provider;
  }

  useEffect(() => {
    async function loadInit() {
      await getProvider();
      setNfts(await getProgramOwnedNfts());
      setEvents(await getQueuedEvents());
    }

    loadInit();
  }, [wallet]);

  function deserializeAccountInfo(buffer) {
    if (!buffer) {
      console.error("empty account data!");
      return [];
    }

    const len = buffer.length;
    let result = [];
    // 10 means the start index of data, 96 means 3 Pubkeys
    for (let i = 15; i < len; i += 104) {
      if (buffer[i] === 0) {
        break;
      }

      result.push({
        bsc: new TextDecoder().decode(buffer.slice(i, i + 40)),
        user: new PublicKey(buffer.slice(i + 40, i + 72)),
        token: new PublicKey(buffer.slice(i + 72, i + 104)),
      });
    }

    return result;
  }

  async function getProgramOwnedNfts() {
    const [statePDA, stateBump] = await PublicKey.findProgramAddress(
      [Buffer.from(process.env.REACT_APP_ACCOUNT_KEY)],
      programID
    );
    const stateAccount = await connection.getAccountInfo(statePDA);
    return deserializeAccountInfo(stateAccount.data);
  }

  async function getQueuedEvents() {
    Contract.setProvider(process.env.REACT_APP_BINANCE_NETWORK);
    const contract = new Contract(
      compiledBridge.abi,
      process.env.REACT_APP_BINANCE_PROGRAM_ADDRESS
    );
    return await contract.methods.getBridgeToSolanaEvents().call();
  }

  async function createCounter() {
    const provider = await getProvider();
    const program = new Program(idl, programID, provider);
    const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
    const programKeyPair = Keypair.fromSecretKey(secretKey);

    const [statePDA, stateBump] = await PublicKey.findProgramAddress(
      [Buffer.from(process.env.REACT_APP_ACCOUNT_KEY)],
      programID
    );

    // just for test
    const mint = new PublicKey("2yXkQJxQp7MuhvGVUxgZUfNbzYy47yqfTEXT6AxxPhZQ");
    const destination = new PublicKey(
      "6WF3wdGj4ht6Jmn8AYpeBXNsqAfBrBWwk4B1os4UBTVY"
    );
    // const bsc = "59201fb8cb2D61118B280c8542127331DD141654";
    const senderATA = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet,
      mint,
      programKeyPair.publicKey
    );

    const receiverATA = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet,
      mint,
      destination
    );

    try {
      /* interact with the program via rpc */
      const tx = program.transaction.transferOut({
        accounts: {
          stateAccount: statePDA,
          from: senderATA.address,
          to: receiverATA.address,
          mint,
          owner: programKeyPair.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
        signers: [programKeyPair],
      });

      tx.feePayer = wallet.publicKey;
      tx.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
      await wallet.sendTransaction(tx, connection, {
        signers: [programKeyPair],
      });

      const account = await program.account.baseAccount.fetch(
        baseAccount.publicKey
      );
      console.debug("account: ", account);
      setValue(account.count.toString());
    } catch (err) {
      console.debug("Transaction error: ", err);
    }
  }

  if (!wallet.connected) {
    /* If the user's wallet is not connected, display connect wallet button. */
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: "100px",
        }}
      >
        <WalletMultiButton />
      </div>
    );
  } else {
    return (
      <div className="App">
        <div>
          {!value && <button onClick={createCounter}>Bridge To Solana</button>}

          <h2>Data from Solana</h2>
          {nfts != null &&
            nfts.map((n, i) => {
              return (
                <h3 key={i}>
                  binance: {n.bsc}, token: {n.token.toString()}
                </h3>
              );
            })}

          <h2>Data from Binance</h2>
          {events != null &&
            events.map((n, i) => {
              return (
                <h3 key={i}>
                  token: {n[0]}, owner: {n[1]}
                </h3>
              );
            })}
        </div>
      </div>
    );
  }
}

/* wallet configuration as specified here: https://github.com/solana-labs/wallet-adapter#setup */
const AppWithProvider = () => (
  <ConnectionProvider endpoint={NETWORK}>
    <WalletProvider wallets={wallets} autoConnect>
      <WalletModalProvider>
        <App />
      </WalletModalProvider>
    </WalletProvider>
  </ConnectionProvider>
);

export default AppWithProvider;
