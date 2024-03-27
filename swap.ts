import {CurrentConfig} from "./config";
import {getProvider} from "./libs/providers";
import {fromReadableAmount, toReadableAmount} from "./libs/utils";
import {fromQuoteV1} from "./libs/quote";
import {fromSwapQuoter} from "./libs/swap-quoter";
import {USDC_TOKEN, WETH_TOKEN} from "./libs/constants";
import {BigNumber, ethers} from "ethers";



async function simulateSwap(amount: number) {

    let provider = getProvider()
    if (!provider) {
        throw new Error('Provider required to get pool state')
    }
    let currentBlockNumber = await provider?.getBlockNumber()
    if (currentBlockNumber == undefined) {
        console.log("Get block number failed.")
        return
    }

    let blockNumber = currentBlockNumber
    console.log(`Block number ${blockNumber}\n`)
    console.log(`Pool fee: ${CurrentConfig.tokens.poolFee / 1e4}%\n`)

    let tokenIn = USDC_TOKEN
    let tokenOut = WETH_TOKEN

    let swapQuoteramountOut = await fromSwapQuoter(blockNumber, amount, tokenIn, tokenOut)
    console.log(swapQuoteramountOut.toString())

    console.log(`SwapQuoter: amount in: ${amount} ${tokenIn.symbol}`)
    console.log(`SwapQuoter: amount out: ${ethers.utils.formatUnits(swapQuoteramountOut.toString(), tokenOut.decimals)} ${tokenOut.symbol}`)


}

simulateSwap(1000).then()