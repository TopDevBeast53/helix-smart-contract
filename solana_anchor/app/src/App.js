import "./App.css";
import { useState, useEffect } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import { Program, Provider, web3 } from "@project-serum/anchor";
import Contract from "web3-eth-contract";
import {
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
  TOKEN_PROGRAM_ID,
  closeAccount
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

const programID = new PublicKey("A7nCafiWF1mDUHYJxfXGaBX3vJm7XvzkUtgSe9R1kK9D");

function App() {
  const [value, setValue] = useState(null);
  const [connection, setConnection] = useState(null);
  const [nfts, setNfts] = useState([]);
  const [events, setEvents] = useState([]);
  const wallet = useWallet();
  const secretKeyString =
    "[193,53,54,156,26,231,111,92,37,45,201,126,105,131,237,132,33,87,190,19,58,156,137,40,192,147,60,178,4,96,54,104,135,117,198,77,24,204,99,100,96,203,128,209,55,14,193,131,244,159,26,218,228,129,90,158,208,8,145,253,109,7,147,156]";
  async function getProvider() {
    /* create the provider and return it to the caller */
    /* network set to local network for now */
    const network = "https://api.devnet.solana.com";
    setConnection(new Connection(network, opts.preflightCommitment));

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
      [Buffer.from("test7")],
      programID
    );
    const stateAccount = await connection.getAccountInfo(statePDA);
    console.debug('what', stateAccount)
    return deserializeAccountInfo(stateAccount.data);
  }

  async function getQueuedEvents() {
    Contract.setProvider("https://data-seed-prebsc-1-s1.binance.org:8545/");
    const contract = new Contract(
      compiledBridge.abi,
      "0x4F807c0f58e88A2fEee50bC9dd80db0923e46002"
    );
    return await contract.methods.getBridgeToSolanaEvents().call();
  }

  async function createCounter() {
    const provider = await getProvider();
    const program = new Program(idl, programID, provider);
    const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
    const programKeyPair = Keypair.fromSecretKey(secretKey);

    const [statePDA, stateBump] = await PublicKey.findProgramAddress(
      [Buffer.from("test7")],
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
    // const uint8array = new TextEncoder().encode(bsc);

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
  <ConnectionProvider endpoint="https://api.devnet.solana.com">
    <WalletProvider wallets={wallets} autoConnect>
      <WalletModalProvider>
        <App />
      </WalletModalProvider>
    </WalletProvider>
  </ConnectionProvider>
);

export default AppWithProvider;
