const { 
    bigNumberify, 
    solidityPack, 
    keccak256, 
    defaultAbiCoder,
    toUtf8Bytes
} = require("legacy-ethers/utils")
const { ethers } = require("hardhat")

module.exports.expandTo18Decimals = (n) => {
  return bigNumberify(n).mul(bigNumberify(10).pow(18))
}

module.exports.getCreate2Address = (factoryAddress, [tokenA, tokenB], bytecode) => {
    const [token0, token1] = tokenA < tokenB ? [tokenA, tokenB] : [tokenB, tokenA]
    const create2Inputs = [
        '0xff',
        factoryAddress,
        keccak256(solidityPack(['address', 'address'], [token0, token1])),
        keccak256(bytecode)
    ]
    const sanitizedInputs = `0x${create2Inputs.map(i => i.slice(2)).join('')}`
    return getAddress(`0x${keccak256(sanitizedInputs).slice(-40)}`)
}

module.exports.createAndGetPair = async (factory, tokenA, tokenB) => {
    await factory.createPair(tokenA.address, tokenB.address)

    const pairAddress = await factory.getPair(tokenA.address, tokenB.address)
    const pairContractFactory = await ethers.getContractFactory("HelixPair")
    const pair = pairContractFactory.attach(pairAddress)

    const token0Address = (await pair.token0()).address
    const token0 = tokenA.address === token0Address ? tokenA : tokenB
    const token1 = tokenA.address === token0Address ? tokenB : tokenA

    return { factory, token0, token1, pair }
}

module.exports.getApprovalDigest = async (token, approve, nonce, deadline) => {
  const name = await token.name()
  const DOMAIN_SEPARATOR = module.exports.getDomainSeparator(name, token.address)
  return keccak256(
    solidityPack(
      ['bytes1', 'bytes1', 'bytes32', 'bytes32'],
      [
        '0x19',
        '0x01',
        DOMAIN_SEPARATOR,
        keccak256(
          defaultAbiCoder.encode(
            ['bytes32', 'address', 'address', 'uint256', 'uint256', 'uint256'],
            [PERMIT_TYPEHASH, approve.owner, approve.spender, approve.value, nonce, deadline]
          )
        )
      ]
    )
  )
}

module.exports.getDomainSeparator = (name, tokenAddress) => {
  return keccak256(
    defaultAbiCoder.encode(
      ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
      [
        keccak256(toUtf8Bytes('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)')),
        keccak256(toUtf8Bytes(name)),
        keccak256(toUtf8Bytes('1')),
        1,
        tokenAddress
      ]
    )
  )
}

const PERMIT_TYPEHASH = keccak256(
  toUtf8Bytes('Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)')
)

/*
import { Wallet, Contract } from 'legacy-ethers'
import { Web3Provider } from 'legacy-ethers/providers'
import {
  BigNumber,
  bigNumberify,
  getAddress,
  keccak256,
  defaultAbiCoder,
  toUtf8Bytes,
  solidityPack
} from 'legacy-ethers/utils'
import HelixPair from '../../build/contracts/HelixPair.json'

const overrides = {
    gasLimit: 99999999999
}

const PERMIT_TYPEHASH = keccak256(
  toUtf8Bytes('Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)')
)

export const MINIMUM_LIQUIDITY = bigNumberify(10).pow(3)

export function expandTo18Decimals(n: number): BigNumber {
  return bigNumberify(n).mul(bigNumberify(10).pow(18))
}



export function getCreate2Address(
  factoryAddress: string,
  [tokenA, tokenB]: [string, string],
  bytecode: string
): string {
  const [token0, token1] = tokenA < tokenB ? [tokenA, tokenB] : [tokenB, tokenA]
  const create2Inputs = [
    '0xff',
    factoryAddress,
    keccak256(solidityPack(['address', 'address'], [token0, token1])),
    keccak256(bytecode)
  ]
  const sanitizedInputs = `0x${create2Inputs.map(i => i.slice(2)).join('')}`
  return getAddress(`0x${keccak256(sanitizedInputs).slice(-40)}`)
}

export async function mineBlock(provider: Web3Provider, timestamp: number): Promise<void> {
  await new Promise(async (resolve, reject) => {
    ;(provider._web3Provider.sendAsync as any)(
      { jsonrpc: '2.0', method: 'evm_mine', params: [timestamp] },
      (error: any, result: any): void => {
        if (error) {
          reject(error)
        } else {
          resolve(result)
        }
      }
    )
  })
}

export async function mineBlocks(blocks: number, provider: Web3Provider): Promise<void> {
    for (let i = 0; i < blocks; i++) {
        await mineBlock(provider, (await provider.getBlock('latest')).timestamp + 1);
    }
}

export function encodePrice(reserve0: BigNumber, reserve1: BigNumber) {
  return [reserve1.mul(bigNumberify(2).pow(112)).div(reserve0), reserve0.mul(bigNumberify(2).pow(112)).div(reserve1)]
}


*/
