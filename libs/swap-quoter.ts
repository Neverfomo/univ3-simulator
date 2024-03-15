import {getPoolInfo} from "./pool";
import {Pool, Route, SwapQuoter} from "@uniswap/v3-sdk";
import {CurrentConfig} from "../config";
import {Currency, CurrencyAmount, TradeType} from "@uniswap/sdk-core";
import {getProvider} from "./providers";
import {fromReadableAmount} from "./utils";
import {QUOTER_CONTRACT_ADDRESS} from "./constants";
import {ethers} from "ethers";


// Interact with the SwapQuoter contract
async function getOutputQuote(route: Route<Currency, Currency>, amountIn: number, blockNumber: number) {
    const provider = getProvider()

    if (!provider) {
        throw new Error('Provider required to get pool state')
    }

    const { calldata } = SwapQuoter.quoteCallParameters(
        route,
        CurrencyAmount.fromRawAmount(
            CurrentConfig.tokens.in,
            fromReadableAmount(
                amountIn,
                CurrentConfig.tokens.in.decimals
            ).toString()
        ),
        TradeType.EXACT_INPUT,
        {
            useQuoterV2: true,
        }
    )

    const quoteCallReturnData = await provider.call({
        to: QUOTER_CONTRACT_ADDRESS,
        data: calldata,
    }, blockNumber)

    return ethers.utils.defaultAbiCoder.decode(['uint256'], quoteCallReturnData)
}

export async function fromSwapQuoter(blockNumber: number, amount: number) {
    const poolInfo = await getPoolInfo(blockNumber)

    const pool = new Pool(
        CurrentConfig.tokens.in,
        CurrentConfig.tokens.out,
        CurrentConfig.tokens.poolFee,
        poolInfo.sqrtPriceX96.toString(),
        poolInfo.liquidity.toString(),
        poolInfo.tick
    )

    const swapRoute = new Route(
        [pool],
        CurrentConfig.tokens.in,
        CurrentConfig.tokens.out
    )

    return await getOutputQuote(swapRoute, amount, blockNumber)
}