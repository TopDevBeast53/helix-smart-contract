# Solana NFT bridge

Solana NFT bridge system enables users to bridge NFTs on solana to binance network and vice versa.

## Main Functions

- Initialize: Admin can initialize the state  variable by calling this function.
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

## Admin Panel
Admin can check the program owned NFTs and transfer the ownership back to the user.

### Functionality
- Admin can initialize the state by clicking <code>Initialize</code> button.
- Admin can check the list of NFTs bridged by users.
- Admin can transfer NFTs back to the user which are bridged by clicking <code>Bridge To Solana</code> button.

### Install & Run
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
After installing a program, you can use the anchor CLI to build.:

```sh
anchor build
```

Once built, we can deploy the program by running:

```sh
anchor deploy
```
