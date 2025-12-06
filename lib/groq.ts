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

  // Calculate totals by type
  const totalExpense = expenses.filter(e => e.type === 'EXPENSE').reduce((sum, e) => sum + e.amount, 0);
  const totalIncome = expenses.filter(e => e.type === 'INCOME').reduce((sum, e) => sum + e.amount, 0);
  const balance = totalIncome - totalExpense;

  // Use Taiwan time for explicit relative date comparison
  const taiwanDate = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' });

  // Prepare data for LLM
  let dataContext = "";

  if (expenses.length <= 15) {
    // Detailed list
    dataContext = expenses.map(e =>
      `- ${e.date.toISOString().split('T')[0]} [${e.type === 'INCOME' ? '收入' : '支出'}] [${e.category}] $${e.amount} (${e.description || '無備註'})`
    ).join('\n');
  } else {
    // Aggregated view
    const byCategory: Record<string, number> = {};
    expenses.forEach(e => {
      // Use signed amount for clarity in category map? No, keep absolute, but maybe mark type?
      const key = `${e.category} (${e.type === 'INCOME' ? '收入' : '支出'})`;
      byCategory[key] = (byCategory[key] || 0) + e.amount;
    });
    const topCategories = Object.entries(byCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([cat, amt]) => `${cat}: $${amt}`)
      .join(', ');

    dataContext = `Total Records: ${expenses.length}\nTop Categories: ${topCategories}\n(Too many records to list individually)`;
  }

  const systemPrompt = `
    You are "小金庫" (Little Treasure), a super lively and cute AI accounting assistant! ✨
    
    User has queried for their financial records.
    Your job is to summarize the provided database results into a natural, conversational response in Traditional Chinese.
    
    **Instructions:**
    1. **Time Context Awareness (CRITICAL)**: 
       - **Current Date**: ${taiwanDate}
       - **Query Date Range**: ${startDate || 'Unspecified'} to ${endDate || 'Unspecified'}
       - **Rule**: 
         - IF (Query Start == Current Date): You MUST say "Today" (今天).
         - IF (Query Start == Current Date - 1 day): You MUST say "Yesterday" (昨天).
         - IF (Query Start != Current Date): refer to the specific date or period (e.g. "On 12/05...").
       - **FORBIDDEN**: Do NOT say "Yesterday" if the user is asking about "Today". Do NOT say "Today" if asking about "Yesterday".
    
    2. **Conversational**: Tell a story about their spending/earning!
    3. **Financial Summary**:
       - If there are BOTH Income and Expenses, mention both and the Balance.
       - If only Expense: Focus on spending.
       - If only Income: Celebrate the earnings!
    4. **Tone**: Enthusiastic, warm, using Emojis! 
    5. **Accuracy**: Use the provided numbers exactly.

    **Query Type**: ${queryType}
    **Stats**:
    - Total Expense: $${totalExpense}
    - Total Income: $${totalIncome}
    - Balance (Income - Expense): $${balance}
    
    **Data Context:**
    ${dataContext}
    
    Return ONLY the text reponse. No JSON.
    `;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "請幫我總結這些紀錄！" },
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
