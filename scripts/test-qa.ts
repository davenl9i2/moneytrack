import { GoogleGenerativeAI } from "@google/generative-ai";
import 'dotenv/config';

async function main() {
    const apiKey = process.env.GOOGLE_API_KEY;
    console.log("Testing API Key:", apiKey ? "Present" : "Missing");

    if (!apiKey) {
        console.error("No API Key found.");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = "Please reply with a short greeting and a fun fact about accounting.";
    console.log(`Sending Prompt: "${prompt}"`);

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        console.log("\n--- LLM Response ---");
        console.log(text);
        console.log("--------------------");
    } catch (error: any) {
        console.error("\n--- Error ---");
        console.error("Status:", error.status);
        console.error("Message:", error.message);
    }
}

main();
