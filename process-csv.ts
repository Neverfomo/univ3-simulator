import fs from 'fs';
import csvParser from 'csv-parser';
import { createObjectCsvWriter as createCsvWriter } from 'csv-writer';
import e, {raw} from "express";
import {Token} from "@uniswap/sdk-core";
import {USDC_TOKEN, WETH_TOKEN} from "./libs/constants";
import {fromSwapQuoter} from "./libs/swap-quoter";
import {ethers} from "ethers";
import {fromQuoteV1} from "./libs/quote";


let cnt = 0
let total = 0

async function processBatch(data: any[]): Promise<any[]> {
    for (let row of data) {
        cnt += 1
        let blockNo = Number(row.block_no) - 1
        let tokenIn: Token
        let tokenOut: Token
        if (row.input_asset == '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2') {
            tokenIn = WETH_TOKEN
            tokenOut = USDC_TOKEN
        } else if (row.input_asset == '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48') {
            tokenIn = USDC_TOKEN
            tokenOut = WETH_TOKEN
        } else {
            console.log(`Unknown token address: ${row.input_asset}`)
            continue
        }
        // if (row.simulated_output_amount_v3 != 'ERROR' && row.simulated_output_amount_v3 != '') {
        //     console.log(row.simulated_output_amount_v3)
        //     console.log(`${cnt}/${total} block_no: ${blockNo + 1}, ${row.input_amount} ${tokenIn.symbol} => ${row.simulated_output_amount_v3} ${tokenOut.symbol}, skip.`)
        //     continue
        // }
        let amountIn = Number(ethers.utils.formatUnits(row.input_amount, tokenIn.decimals))
        let amountOutStr: string
        try {
            // Call SwapQuoter to get the output amount
            // let amountOut = await fromSwapQuoter(blockNo, Number(amountIn.toFixed(6)), tokenIn, tokenOut)
            let amountOut = await fromQuoteV1(blockNo, amountIn, tokenIn, tokenOut)
            amountOutStr = ethers.utils.formatUnits(amountOut.toString(), tokenOut.decimals)
            amountOutStr = String(Number(amountOutStr).toFixed(6))
        } catch (error) {
            console.log(`Block: ${blockNo}, amountIn: ${amountIn}`)
            console.log(error)
            amountOutStr = 'ERROR'
        }
        row.simulated_output_amount_v3 = amountOutStr
        console.log(`${cnt}/${total} block_no: ${blockNo + 1}  ${amountIn.toFixed(6)} ${tokenIn.symbol} => ${amountOutStr} ${tokenOut.symbol}`)
    }
    return data;
}

async function processCsv() {
    const rawdataPath = 'rawdata_latest.csv';
    const newCsv = 'newdata/rawdata_latest_v3.csv';
    const data: any[] = [];

    // load the csv file
    fs.createReadStream(rawdataPath)
        .pipe(csvParser())
        .on('data', (row: any) => {
            data.push(row);
        })
        .on('end', async () => {
            total = data.length
            // process data by batches
            const batchSize = 5000;
            for (let i = 0; i < data.length; i += batchSize) {
                const batch = data.slice(i, i + batchSize);
                await processBatch(batch);
                let checkpointFilePath = `newdata/rawdata_latest_v3_${i+batchSize}.csv`
                await saveData(checkpointFilePath, data)
            }
            await saveData(newCsv, data)
            // create a csv writer and write content to it
            console.log('The CSV file was written successfully');
        });
}

async function saveData(newCsv: string, data: any) {
    const csvWriter = createCsvWriter({
        path: newCsv,
        header: [
            { id: 'tx_hash', title: 'tx_hash' },
            { id: 'block_no', title: 'block_no' },
            { id: 'venue', title: 'venue' },
            { id: 'input_asset', title: 'input_asset' },
            { id: 'output_asset', title: 'output_asset' },
            { id: 'input_amount', title: 'input_amount' },
            { id: 'output_amount', title: 'output_amount' },
            { id: 'reserve0', title: 'reserve0' },
            { id: 'reserve1', title: 'reserve1' },
            { id: 'min_gas', title: 'min_gas' },
            { id: 'v2_unit', title: 'v2_unit' },
            { id: 'v3_unit', title: 'v3_unit' },
            { id: 'simulated_output_amount_v3', title: 'simulated_output_amount_v3' }
        ]
    });

    await csvWriter.writeRecords(data);
    console.log(`Saved to ${newCsv}`)
}

function trimFloatString(floatStr: string, numDigits: number): string {
    // 找到第一个非零数字的位置
    const firstNonZeroIndex = floatStr.search(/[1-9]/);

    // 如果没有找到非零数字，直接返回原字符串
    if (firstNonZeroIndex === -1) {
        return floatStr;
    }

    // 找到小数点的位置
    const decimalPointIndex = floatStr.indexOf('.');

    // 如果小数点在第一个非零数字之前或没有小数点，直接从第一个非零数字开始截取后续6位
    if (decimalPointIndex === -1 || decimalPointIndex > firstNonZeroIndex) {
        const start = firstNonZeroIndex;
        const end = Math.min(floatStr.length, start + 6); // 确保不超过字符串长度
        return floatStr.substring(0, end);
    }

    // 如果小数点存在且在第一个非零数字之前
    // 计算从第一个非零数字开始的总长度，包括小数点
    let totalLength = firstNonZeroIndex + numDigits + 1; // +1 是为了包含小数点

    // 根据实际字符串长度调整截取长度
    totalLength = Math.min(floatStr.length, totalLength);

    // 从字符串开始截取到计算出的总长度
    return floatStr.substring(0, totalLength);
}

processCsv().catch(console.error)
