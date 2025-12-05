
import { GoogleGenerativeAI } from "@google/generative-ai";
import 'dotenv/config';

async function main() {
    const key = process.env.GOOGLE_API_KEY;
    if (!key) { console.error("No API Key"); return; }

    // Test: gemini-pro
    const modelName = "gemini-pro";
    console.log(`Testing model: ${modelName} with key: ${key.substring(0, 10)}...`);

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: modelName });

    try {
        const result = await model.generateContent("Say hello");
        const response = await result.response;
        console.log("Success! Response:", response.text());
    } catch (e: any) {
        console.error("Failed!", e.status, e.statusText);
    }
}

main();
