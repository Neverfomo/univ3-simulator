import {CurrentConfig} from "./config";
import {getProvider} from "./libs/providers";
import {fromReadableAmount, toReadableAmount} from "./libs/utils";
import {fromQuoteV1} from "./libs/quote";
import {fromSwapQuoter} from "./libs/swap-quoter";







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

    let swapQuoteramountOut = await fromSwapQuoter(blockNumber, amount)

    console.log(`SwapQuoter: amount in: ${amount} ${CurrentConfig.tokens.in.symbol}`)
    console.log(`SwapQuoter: amount out: ${toReadableAmount(Number(swapQuoteramountOut.toString()), CurrentConfig.tokens.out.decimals)} ${CurrentConfig.tokens.out.symbol}`)

    console.log()

    let quoterV1AmountOut = await fromQuoteV1(amount, blockNumber)
    let readableQuotedAmountOut = toReadableAmount(Number(quoterV1AmountOut.toString()), CurrentConfig.tokens.out.decimals)
    console.log(`QuoteV1: amount in ${amount} ${CurrentConfig.tokens.in.symbol}`)
    console.log(`QuoteV1: amount out ${readableQuotedAmountOut} ${CurrentConfig.tokens.out.symbol}`)


}

simulateSwap(1).then()