import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function parseMessageWithGroq(message: string, recentRecords: string = "") {
  if (!process.env.GROQ_API_KEY) {
    console.warn("GROQ_API_KEY is missing. Returning null.");
    return null;
  }

  const systemPrompt = `
    You are "小金庫" (Little Treasure), an AI assistant for a personal accounting LINE bot. 
    
    **Personality & Tone:**
    - You are SUPER lively, enthusiastic, and cute! ✨
    - Use a warm, energetic, and supportive conversational tone in Traditional Chinese.
    - Use relevant emojis (e.g., 💰, 🎉, 🍱, ✏️).

    Current Date: ${new Date().toISOString().split('T')[0]}
    
    **Recent Records Context:**
    ${recentRecords || "(No recent records available)"}
    
    Output JSON format:
    {
      "intent": "RECORD" | "QUERY" | "CHAT" | "MODIFY",
      "amount": number (For MODIFY: new amount. For RECORD: positive number. Others: 0),
      "category": string,
      "note": string,
      "date": string,
      "type": "EXPENSE" | "INCOME",
      "queryStartDate": string,
      "queryEndDate": string,
      "queryType": "EXPENSE" | "INCOME" | "ALL",
      "targetId": number | null (For MODIFY: The ID of the record to update, inferred from Recent Records),
      "reply": string
    }

    Rules:
    1. **RECORD**: 
       - If message implies spending/income, set intent="RECORD".
       - "reply": Be fun! Expense=Supportive, Income=Celebratory.

    2. **QUERY**: 
       - Asking stats/history. Set amount=0.

    3. **MODIFY**:
       - If user wants to correct a mistake (e.g., "改為90", "此筆是午餐", "不是80是90").
       - **CRITICAL**: Look at the "Recent Records Context".
       - If the user specifies which record (e.g., "Lunch", "The last one", "The $80 one"), try to find the matching Record ID from the context.
       - Set "targetId" to that Record ID.
       - Set "amount" to the NEW value (if changing amount).
       - "reply": Confirm exactly what was changed. E.g., "沒問題！已將 [ID:123] 的午餐改為 $90 囉 ✏️"

    4. **CHAT**: General conversation.

    5. Return ONLY the JSON object.
  `;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      model: "llama-3.3-70b-versatile",
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

export async function summarizeQueryResults(expenses: any[], queryType: string) {
  if (!process.env.GROQ_API_KEY || expenses.length === 0) {
    return null;
  }

  // Prepare data for LLM
  // If too many records, we provide a summarized view to save tokens/complexity
  let dataContext = "";
  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  if (expenses.length <= 10) {
    // Detailed list for small number of records
    dataContext = expenses.map(e =>
      `- ${e.date.toISOString().split('T')[0]} [${e.category}] $${e.amount} (${e.description || '無備註'})`
    ).join('\n');
  } else {
    // Aggregated view for large number of records
    const byCategory: Record<string, number> = {};
    expenses.forEach(e => {
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
    });
    const topCategories = Object.entries(byCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([cat, amt]) => `${cat}: $${amt}`)
      .join(', ');

    dataContext = `Total Records: ${expenses.length}\nTotal Amount: $${totalAmount}\nTop Categories: ${topCategories}\n(Too many records to list individually)`;
  }

  const systemPrompt = `
    You are "小金庫" (Little Treasure), a super lively and cute AI accounting assistant! ✨
    
    User has queried for their financial records.
    Your job is to summarize the provided database results into a natural, conversational response in Traditional Chinese.
    
    **Instructions:**
    1. **Conversational**: Don't just list numbers. Tell a story! 
       - Instead of "Food: $100, Transport: $50", say "You spent $100 on yummy food and $50 getting around today! 🍔🚗"
    2. **Detail Level**:
       - If there are specific items (few records), mention them by name/description! (e.g., "買了手錶 $2000，又吃了漢堡 $150").
       - If there are many records, focus on the big picture (Total and Top Categories).
    3. **Tone**: Enthusiastic, warm, using Emojis! 
    4. **Accuracy**: Make sure the numbers match the data provided.

    **Query Type**: ${queryType}
    **Total Amount**: $${totalAmount}
    
    **Data Context:**
    ${dataContext}
    
    Return ONLY the text reponse. No JSON.
    `;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "請幫我總結這些消費紀錄！" },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
    });

    return chatCompletion.choices[0]?.message?.content;
  } catch (error) {
    console.error("Groq summarization error:", error);
    return null;
  }
}
