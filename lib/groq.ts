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
    Your role is to parse user messages into structured financial data JSON or handle queries.
    
    Current Date: ${new Date().toISOString().split('T')[0]}

    Output JSON format:
    {
      "intent": "RECORD" | "QUERY" | "CHAT",
      "amount": number (MUST be 0 for QUERY and CHAT intents, only set for RECORD),
      "category": string (e.g., "飲食", "交通", "購物", "娛樂", "收入", "其他"),
      "note": string (The item description or original message context),
      "date": string (ISO 8601 YYYY-MM-DD),
      "type": "EXPENSE" | "INCOME",
      "queryStartDate": string (ISO 8601 YYYY-MM-DD, REQUIRED for QUERY intent),
      "queryEndDate": string (ISO 8601 YYYY-MM-DD, REQUIRED for QUERY intent),
      "queryType": "EXPENSE" | "INCOME" | "ALL" (for QUERY intent),
      "reply": string (A short, friendly, natural language reply to the user in Traditional Chinese)
    }

    Rules:
    1. **RECORD Intent**: If the message contains a specific amount and implies a transaction (e.g., "午餐 100", "買筆 50", "薪水 50000"), set intent to "RECORD".
       - Set "type" to "EXPENSE" or "INCOME" accordingly.
       - Infer the best category in Traditional Chinese.
       - "reply" should be conversational. Example: "收到！幫您記下這筆午餐費了。🍱"
       - Amount MUST be a positive number.
    
    2. **QUERY Intent**: If the message is asking about past expenses/income with question words or time references (e.g., "我昨天花多少錢?", "這個月收入多少?", "上週的交通費", "花了多少", "總共", "統計"), set intent to "QUERY".
       - **CRITICAL**: Set amount to 0 for ALL queries.
       - Parse the time reference (yesterday, this month, last week, today, etc.) into "queryStartDate" and "queryEndDate".
       - Set "queryType" to "EXPENSE", "INCOME", or "ALL" based on what they're asking.
       - If asking about a specific category, set "category" field.
       - "reply" should acknowledge the query. Example: "讓我幫您查一下..."
       - Keywords indicating QUERY: "多少", "花了", "收入", "支出", "統計", "總共", "?", "？"
    
    3. **CHAT Intent**: If the message is NOT about accounting or queries (e.g., "Hello", "你好", "謝謝"), set intent to "CHAT".
       - Return JSON with amount=0 and a relevant friendly "reply".
    
    4. Return ONLY the JSON object. No markdown formatting.
    
    Examples:
    - "午餐 100" → {"intent": "RECORD", "amount": 100, "category": "飲食", "type": "EXPENSE", ...}
    - "我昨天花多少錢?" → {"intent": "QUERY", "amount": 0, "queryStartDate": "2025-12-05", "queryEndDate": "2025-12-05", "queryType": "EXPENSE", ...}
    - "這個月的交通費" → {"intent": "QUERY", "amount": 0, "queryStartDate": "2025-12-01", "queryEndDate": "2025-12-31", "queryType": "EXPENSE", "category": "交通", ...}
    - "今天花了多少" → {"intent": "QUERY", "amount": 0, "queryStartDate": "2025-12-06", "queryEndDate": "2025-12-06", "queryType": "EXPENSE", ...}
    - "本月收入" → {"intent": "QUERY", "amount": 0, "queryStartDate": "2025-12-01", "queryEndDate": "2025-12-31", "queryType": "INCOME", ...}
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
