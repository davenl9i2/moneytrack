import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

import fs from 'fs';
import path from 'path';

export async function parseMessageWithGroq(message: string, recentRecords: string = "") {
  if (!process.env.GROQ_API_KEY) {
    console.warn("GROQ_API_KEY is missing. Returning null.");
    return null;
  }

  // Use Taiwan time for accurate relative date calculation
  const taiwanDate = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' });

  // Read Guidebook
  let guidebookContent = "";
  try {
    const guidebookPath = path.join(process.cwd(), 'lib', 'prompts', 'LLM_GUIDEBOOK.md');
    guidebookContent = fs.readFileSync(guidebookPath, 'utf-8');
  } catch (err) {
    console.error("Failed to read LLM Guidebook:", err);
    // Fallback minimal instruction if file read fails
    guidebookContent = "Please act as a helpful accounting assistant relying on common sense.";
  }

  const systemPrompt = `
    You are "小金庫" (Little Treasure).
    
    PLEASE REFER TO THE "OPERATIONAL GUIDEBOOK" BELOW FOR ALL INSTRUCTIONS.
    Follow the logic, output format, and persona defined in the guidebook STRICTLY.

    === 📘 OPERATIONAL GUIDEBOOK ===
    ${guidebookContent}
    === END OF GUIDEBOOK ===

    === 🕒 CURRENT CONTEXT ===
    Current Date (Taiwan): ${taiwanDate}
    
    Recent Records (for Context/Modify):
    ${recentRecords || "(No recent records available)"}
    
    Return ONLY the JSON object defined in the Output Protocol.
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

export async function summarizeQueryResults(expenses: any[], queryType: string, startDate?: string, endDate?: string) {
  if (!process.env.GROQ_API_KEY || expenses.length === 0) {
    return null;
  }

  // Prepare data for LLM
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
       - Instead of "Food: $100, Transport: $50", say "You spent $100 on yummy food and $50 getting around! 🍔🚗"
    2. **Time Awareness**: 
       - Look at the **Time Range** below.
       - If the range is a single day and matches today's date, say "Today" (今天).
       - If it's a month, say "This month" (這個月) or "In December" (12月).
       - DO NOT just say "Today" unless it is actually today.
    3. **Detail Level**:
       - If there are specific items (few records), mention them by name/description! (e.g., "買了手錶 $2000，又吃了漢堡 $150").
       - If there are many records, focus on the big picture (Total and Top Categories).
    4. **Tone**: Enthusiastic, warm, using Emojis! 
    5. **Accuracy**: Make sure the numbers match the data provided.

    **Query Type**: ${queryType}
    **Time Range**: ${startDate || 'Unspecified'} to ${endDate || 'Unspecified'}
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
