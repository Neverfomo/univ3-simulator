import {getPoolInfo} from "./libs/pool";
import {getProvider} from "./libs/providers";
import {USDC_TOKEN, WETH_TOKEN} from "./libs/constants";
import {BigNumber} from "ethers";
import {sqrt} from "@uniswap/sdk-core";
import {formatUnits} from "ethers/lib/utils";

function sqrtPriceX96ToPrice(sqrtPriceX96: BigNumber): string {
    // 定义 2^96 和 2^192
    const Q96 = BigNumber.from(2).pow(96);
    const Q192 = Q96.mul(Q96);

    // 计算 price
    const priceUSDC = sqrtPriceX96.mul(sqrtPriceX96).div(Q192);
    const priceWETH = BigNumber.from(1).mul(BigNumber.from(10).pow(18 - 6)).div(priceUSDC)
    // 返回格式化后的价格
    return priceWETH.toString();
}


async function displayPool() {
    let provider = getProvider()
    let currentBlockNumber = await provider?.getBlockNumber()
    if (currentBlockNumber == undefined) {
        console.log("Get block number failed.")
        return
    }
    let blockNumber = currentBlockNumber
    console.log(`Block number: ${blockNumber}`)
    let poolInfo = await getPoolInfo(blockNumber, USDC_TOKEN, WETH_TOKEN)
    console.log(poolInfo)

    const price = sqrtPriceX96ToPrice(poolInfo.sqrtPriceX96)
    console.log(`price ${price}`)

    // 1598895973845634339914979559406558
    // 1598895973845634339914979559406558
}



displayPool().then()