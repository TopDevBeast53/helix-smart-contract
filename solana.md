# Solana NFT bridge

Solana NFT bridge system enables users to bridge NFTs on solana to binance network and vice versa.

## Main Functions

- TransferIn: User can bridge owned NFT from Solana to Binance network so the ownership of the NFT changed from user to program.
- TransferOut: Admin will transfer NFTs ownership back to the user which are bridged from Binance

## Installation

Please install [Anchor](https://project-serum.github.io/anchor/getting-started/installation.html) to run the bridge system.

To get started, change directory to solana_anchor:

```sh
cd solana_anchor
```

And install any additional JavaScript dependencies:

```sh
yarn install
```

## Deployment
Open the `solana_anchor` folder in new terminal.

If you're running solana for the first time, generate a wallet.
```sh
solana-keygen new
```
After installing a program, you can use the anchor CLI to build.

```sh
anchor clean
anchor build
```
After build finished, get the address of the program.
 ```sh
solana address -k ./target/deploy/solana_anchor-keypair.json
```
Copy that address and replace it in `Anchor.toml` & `programs/src/lib.rs`

Once finished, we can deploy the program by running:

```sh
anchor build
solana program deploy ./target/deploy/solana_anchor.so
```
