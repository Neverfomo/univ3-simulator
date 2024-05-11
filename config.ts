import { Token } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'

import { USDC_TOKEN, WETH_TOKEN } from './libs/constants'

// Sets if the example should run locally or on chain
export enum Environment {
  LOCAL,
  MAINNET,
  WALLET_EXTENSION,
}

// Inputs that configure this example to run
export interface Config {
  env: Environment
  rpc: {
    local: string
    mainnet: string
  }
  tokens: {
    in: Token
    amountIn: number
    out: Token
    poolFee: number
  }
}

// Example Configuration

export const CurrentConfig: Config = {
  env: Environment.MAINNET,
  rpc: {
    local: 'http://localhost:8545',
    // mainnet: 'https://eth.llamarpc.com'
    mainnet: 'https://eth-mainnet.g.alchemy.com/v2/gmt0k2JiwMqSvXsMG7bP98DcrPhfilE1'
  },
  tokens: {
    in: WETH_TOKEN,
    amountIn: 1,
    out: USDC_TOKEN,
    poolFee: FeeAmount.LOW,
  },
}
