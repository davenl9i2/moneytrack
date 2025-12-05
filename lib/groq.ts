import Groq from "groq-sdk";



export async function parseMessageWithGroq(message: string) {
    if (!process.env.GROQ_API_KEY) {
        console.warn("GROQ_API_KEY is missing. Using fallback/regex logic if implemented elsewhere, or returning null.");
        // We could implement Regex fallback HERE if we wanted parsing to be robust within this function
        // But for now, let's return null so the caller can handle fallback.
        return null;
    }

    const systemPrompt = `
    You are an AI assistant for a personal accounting bot. 
    Your role is to parse user messages into structured financial data JSON.
    
    Current Date: ${new Date().toISOString().split('T')[0]}

    Output JSON format:
    {
      "amount": number,
      "category": string, (e.g., "飲食", "交通", "購物", "娛樂", "收入", "其他")
      "note": string, (The item description or original message context)
      "date": string (ISO 8601 YYYY-MM-DD),
      "type": "EXPENSE" | "INCOME",
      "reply": string (A short, friendly, natural language reply to the user in Traditional Chinese)
    }

    Rules:
    1. If the message implies spending (e.g., "lunch 100", "bought a pen"), type is "EXPENSE".
    2. If the message implies receiving money (e.g., "salary 50000"), type is "INCOME".
    3. Infer the best category in Traditional Chinese.
    4. "reply" should be conversational. Example: "收到！幫您記下這筆午餐費了。🍱"
    5. If the message is NOT about accounting (e.g., "Hello", "Who are you?"), return JSON with amount=0 and a relevant "reply".
    6. Return ONLY the JSON object. No markdown formatting.
  `;

    const groq = new Groq({
        apiKey: process.env.GROQ_API_KEY,
    });

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: message },
            ],
            model: "llama-3.3-70b-versatile", // Fast and efficient
            temperature: 0.5,
            response_format: { type: "json_object" },
        });

        const content = chatCompletion.choices[0]?.message?.content;
        if (!content) return null;

        return JSON.parse(content);
    } catch (error) {
        console.error("Groq parsing error:", error);
        return null;
    }
}
