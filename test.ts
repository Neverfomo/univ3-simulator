import {fromSwapQuoter} from "./libs/swap-quoter";
import {USDC_TOKEN, WETH_TOKEN} from "./libs/constants";
import {fromQuoteV1} from "./libs/quote";
import {toReadableAmount} from "./libs/utils";
import {ethers} from "ethers";


// fromSwapQuoter(13003492, 40.1985, USDC_TOKEN, WETH_TOKEN).then()
async function run() {
    // let output = await fromQuoteV1(13049799, 5, WETH_TOKEN, USDC_TOKEN)
    let output = await fromQuoteV1(13003716, 0.874256059, WETH_TOKEN, USDC_TOKEN)
    console.log(ethers.utils.formatUnits(output.toString(), USDC_TOKEN.decimals))
}

run().then()