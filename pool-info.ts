import {getPoolInfo} from "./libs/pool";
import {getProvider} from "./libs/providers";
import {USDC_TOKEN, WETH_TOKEN} from "./libs/constants";


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


}



displayPool().then()