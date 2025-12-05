import { parseMessageWithGroq } from '../lib/groq';
import 'dotenv/config';

async function main() {
    const input = "今天午餐吃拉麵 320元";
    console.log(`Testing Groq with input: "${input}"`);

    if (!process.env.GROQ_API_KEY) {
        console.error("Error: GROQ_API_KEY is missing in .env");
        return;
    }

    const result = await parseMessageWithGroq(input);

    console.log("\n--- Result ---");
    console.log(JSON.stringify(result, null, 2));
    console.log("--------------");
}

main();
