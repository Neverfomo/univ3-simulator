import {getPoolInfo} from "./pool";
import {Pool, Route, SwapQuoter} from "@uniswap/v3-sdk";
import {CurrentConfig} from "../config";
import {Currency, CurrencyAmount, Token, TradeType} from "@uniswap/sdk-core";
import {getProvider} from "./providers";
import {fromReadableAmount} from "./utils";
import {QUOTER_CONTRACT_ADDRESS} from "./constants";
import {ethers} from "ethers";


// Interact with the SwapQuoter contract
async function getOutputQuote(route: Route<Currency, Currency>, amountIn: number, blockNumber: number, tokenIn: Token) {
    // 1. get an ethers.js JsonRpcProvider
    const provider = getProvider()

    if (!provider) {
        throw new Error('Provider required to get pool state')
    }

    // 2. Prepare callDate to construct a transaction to call the Quoter contract.
    const { calldata } = SwapQuoter.quoteCallParameters(
        route,
        CurrencyAmount.fromRawAmount(
            tokenIn,
            fromReadableAmount(
                amountIn,
                tokenIn.decimals
            ).toString()
        ),
        TradeType.EXACT_INPUT,
        {
            useQuoterV2: true,
        }
    )

    // 3. Call the Quoter contract
    const quoteCallReturnData = await provider.call({
        to: QUOTER_CONTRACT_ADDRESS,
        data: calldata,
    }, blockNumber)

    return ethers.utils.defaultAbiCoder.decode(['uint256'], quoteCallReturnData)
}

export async function fromSwapQuoter(blockNumber: number, amount: number, tokenIn: Token, tokenOut: Token) {
    // 1. fetch pool info by (block number, input token, output token)
    const poolInfo = await getPoolInfo(blockNumber, tokenIn, tokenOut)
    console.log(amount, tokenIn.symbol)
    const pool = new Pool(
        tokenIn,
        tokenOut,
        CurrentConfig.tokens.poolFee,
        poolInfo.sqrtPriceX96.toString(),
        poolInfo.liquidity.toString(),
        poolInfo.tick
    )

    // 2. construct a swap route for calling SwapQuoter
    const swapRoute = new Route(
        [pool],
        tokenIn,
        tokenOut
    )

    return await getOutputQuote(swapRoute, amount, blockNumber, tokenIn)
}