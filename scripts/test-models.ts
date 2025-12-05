import { GoogleGenerativeAI } from "@google/generative-ai";
import 'dotenv/config';

async function main() {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
    console.log("Using Key:", process.env.GOOGLE_API_KEY ? "Present" : "Missing");

    try {
        // Note: older SDKs might not have listModels, but 0.21+ should? 
        // Actually, usually it's not on the main client but via model manager or similar?
        // Let's try to just use valid model or handle error.
        // There isn't a direct listModels on the simple client in some versions, 
        // but let's try a direct fetch if needed or just try another model.

        // Actually, let's try 'gemini-1.0-pro' just in case.
        const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
        const result = await model.generateContent("Hi");
        console.log("gemini-1.0-pro Success:", result.response.text());
    } catch (error) {
        console.log("gemini-1.0-pro Failed:", error.message);
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Hi");
        console.log("gemini-1.5-flash Success:", result.response.text());
    } catch (error) {
        console.log("gemini-1.5-flash Failed:", error.message);
    }
}

main();
