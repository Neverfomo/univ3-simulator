import {getPoolInfo} from "./libs/pool";
import {getProvider} from "./libs/providers";


async function displayPool() {
    let provider = getProvider()
    let currentBlockNumber = await provider?.getBlockNumber()
    if (currentBlockNumber == undefined) {
        console.log("Get block number failed.")
        return
    }
    let blockNumber = currentBlockNumber
    console.log(`Block number: ${blockNumber}`)
    let poolInfo = await getPoolInfo(blockNumber)
    console.log(poolInfo)


}



displayPool().then()