import fs from 'fs';
import csvParser from 'csv-parser';
import { createObjectCsvWriter as createCsvWriter } from 'csv-writer';
import e, {raw} from "express";
import {Token} from "@uniswap/sdk-core";
import {USDC_TOKEN, WETH_TOKEN} from "./libs/constants";
import {fromSwapQuoter} from "./libs/swap-quoter";
import {ethers} from "ethers";


let cnt = 0

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
        if (!isNaN(Number(row.simulated_output_amount_v3))) {
            console.log(`${cnt}/${data.length} block_no: ${blockNo + 1}, ${row.input_amount} ${tokenIn.symbol} => ${row.simulated_output_amount_v3} ${tokenOut.symbol}, skip.`)
            continue
        }
        let amountIn = Number(row.input_amount)
        let amountOutStr: string
        try {
            // Call SwapQuoter to get the output amount
            let amountOut = await fromSwapQuoter(blockNo, amountIn, tokenIn, tokenOut)
            amountOutStr = ethers.utils.formatUnits(amountOut.toString(), tokenOut.decimals)
            amountOutStr = String(Number(amountOutStr).toFixed(6))
        } catch (error) {
            console.log(error)
            amountOutStr = 'ERROR'
        }
        row.simulated_output_amount_v3 = amountOutStr
        console.log(`${cnt}/${data.length} block_no: ${blockNo + 1}, ${amountIn} ${tokenIn.symbol} => ${amountOutStr} ${tokenOut.symbol}`)
    }
    return data;
}

async function processCsv() {
    const rawdataPath = 'rawdata.csv';
    const newCsv = 'rawdata_v3.csv';
    const data: any[] = [];

    // load the csv file
    fs.createReadStream(rawdataPath)
        .pipe(csvParser())
        .on('data', (row: any) => {
            data.push(row);
        })
        .on('end', async () => {
            // process data by batches
            const batchSize = 10; // 10 rows per batch
            for (let i = 0; i < data.length; i += batchSize) {
                const batch = data.slice(i, i + batchSize);
                await processBatch(batch);
            }

            // create a csv writer and write content to it
            const csvWriter = createCsvWriter({
                path: newCsv,
                header: [
                    { id: 'tx_hash', title: 'tx_hash' },
                    { id: 'block_no', title: 'block_no' },
                    { id: 'taker_address', title: 'taker_address' },
                    { id: 'maker_address', title: 'maker_address' },
                    { id: 'recipient_address', title: 'recipient_address' },
                    { id: 'input_asset', title: 'input_asset' },
                    { id: 'output_asset', title: 'output_asset' },
                    { id: 'input_amount', title: 'input_amount' },
                    { id: 'output_amount', title: 'output_amount' },
                    { id: 'simulated_output_amount', title: 'simulated_output_amount' },
                    { id: 'rfq_welfare', title: 'rfq_welfare' },
                    { id: 'direction', title: 'direction' },
                    { id: 'different_recipient', title: 'different_recipient' },
                    { id: 'eth_volume', title: 'eth_volume' },
                    { id: 'simulated_output_amount_v3', title: 'simulated_output_amount_v3' }
                ]
            });

            await csvWriter.writeRecords(data);
            console.log('The CSV file was written successfully');
        });
}

processCsv().catch(console.error)
