# Solana NFT bridge

Solana NFT bridge system enables users to bridge NFTs on solana to binance network and vice versa.

## Functionality

- A manager can initialize bridge system by calling initialize method
- A user can bridge his NFT holding on solana to binance network 
- Contribute a UI for admin to manage the program owned NFTs 

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

To run the admin page:

```sh
cd app
npm install && npm start
```

## Deployment

In a separate terminal, start a local network. If you're running solana for the first time, generate a wallet.
```sh
solana-keygen new
```
After installing a program, you can use the anchor CLI to build and emit an IDL, from which clients can be generated.:

```sh
anchor build
```

Once built, we can deploy the program by running:

```sh
anchor deploy
```
