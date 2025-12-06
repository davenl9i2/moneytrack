/**
 * Test script for query functionality
 * Run with: node scripts/test-query.js
 */

const testMessages = [
    // RECORD intents
    { text: "午餐 100", expectedIntent: "RECORD" },
    { text: "薪水 50000", expectedIntent: "RECORD" },

    // QUERY intents
    { text: "我昨天花多少錢?", expectedIntent: "QUERY" },
    { text: "這個月的支出", expectedIntent: "QUERY" },
    { text: "上週的交通費", expectedIntent: "QUERY" },
    { text: "本月收入多少?", expectedIntent: "QUERY" },

    // CHAT intents
    { text: "你好", expectedIntent: "CHAT" },
    { text: "謝謝", expectedIntent: "CHAT" },
];

async function testGroqParsing() {
    console.log("🧪 Testing Groq LLM Query Feature\n");

    const { parseMessageWithGroq } = require('../lib/groq.ts');

    for (const test of testMessages) {
        console.log(`📝 Testing: "${test.text}"`);

        try {
            const result = await parseMessageWithGroq(test.text);

            if (!result) {
                console.log("❌ No result returned\n");
                continue;
            }

            const { intent, amount, category, queryStartDate, queryEndDate, queryType, reply } = result;

            console.log(`✅ Intent: ${intent} (expected: ${test.expectedIntent})`);

            if (intent === 'RECORD') {
                console.log(`   Amount: ${amount}, Category: ${category}`);
            } else if (intent === 'QUERY') {
                console.log(`   Query Type: ${queryType}`);
                console.log(`   Date Range: ${queryStartDate} to ${queryEndDate}`);
                if (category) console.log(`   Category: ${category}`);
            }

            console.log(`   Reply: ${reply}`);
            console.log();

        } catch (error) {
            console.error(`❌ Error:`, error.message);
            console.log();
        }
    }
}

// Run if called directly
if (require.main === module) {
    testGroqParsing().catch(console.error);
}

module.exports = { testGroqParsing };
