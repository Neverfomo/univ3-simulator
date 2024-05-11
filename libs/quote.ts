import { ethers } from 'ethers'
import { CurrentConfig } from '../config'
import { computePoolAddress } from '@uniswap/v3-sdk'
import Quoter from '@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json'
import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json'
import {
  POOL_FACTORY_CONTRACT_ADDRESS,
  QUOTER_CONTRACT_ADDRESS, QUOTER_V1_CONTRACT_ADDRESS,
} from '../libs/constants'
import { getProvider } from './providers'
import { toReadableAmount, fromReadableAmount } from './conversion'
import {Token} from "@uniswap/sdk-core";



// Interact with the Quoter contract
export async function fromQuoteV1(blockNumber: number, amountIn: number, tokenIn: Token, tokenOut: Token) {
  let provider = getProvider()
  if (!provider) {
    throw new Error("Get provider error.")
  }

  const quoterContract = new ethers.Contract(
      QUOTER_V1_CONTRACT_ADDRESS,
      Quoter.abi,
      provider
  )
  const poolConstants = await getPoolConstants(tokenIn, tokenOut)
  // console.log(poolConstants)
  let params = {
    tokenIn: tokenIn.address,
    tokenOut: tokenOut.address,
    fee: poolConstants.fee,
    amountIn: fromReadableAmount(
        amountIn,
        tokenIn.decimals
    ).toString(),
    sqrtPriceLimitX96: 0
  }

  let data = [params.tokenIn, params.tokenOut, params.fee, params.amountIn, params.sqrtPriceLimitX96]
  const iface = new ethers.utils.Interface(Quoter.abi);
  const callData = iface.encodeFunctionData("quoteExactInputSingle", data);

  const quotedAmountOut = await provider.call({
    data: callData,
    to: QUOTER_V1_CONTRACT_ADDRESS
  }, blockNumber)


  // return toReadableAmount(quotedAmountOut, CurrentConfig.tokens.out.decimals)
  return ethers.utils.defaultAbiCoder.decode(['uint256'], quotedAmountOut)
}

async function getPoolConstants(tokenIn: Token, tokenOut: Token): Promise<{
  token0: string
  token1: string
  fee: number
}> {
  const currentPoolAddress = computePoolAddress({
    factoryAddress: POOL_FACTORY_CONTRACT_ADDRESS,
    tokenA: tokenIn,
    tokenB: tokenOut,
    fee: CurrentConfig.tokens.poolFee,
  })

  let provider = getProvider()
  if (!provider) {
    throw new Error("Get provider error.")
  }

  const poolContract = new ethers.Contract(
      currentPoolAddress,
      IUniswapV3PoolABI.abi,
      provider
  )
  const [token0, token1, fee] = await Promise.all([
    poolContract.token0(),
    poolContract.token1(),
    poolContract.fee(),
  ])

  return {
    token0,
    token1,
    fee,
  }
}
