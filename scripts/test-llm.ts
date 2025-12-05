import 'dotenv/config';
// @ts-ignore
import { parseExpenseMessage } from '../lib/llm.js';

async function main() {
    const input = "今天午餐吃60元便當";
    console.log(`Testing input: "${input}"`);
    console.log("GOOGLE_API_KEY present:", !!process.env.GOOGLE_API_KEY);

    try {
        const result = await parseExpenseMessage(input);
        console.log("Result:", JSON.stringify(result, null, 2));
    } catch (e) {
        console.error("Test failed:", e);
    }
}

main();
