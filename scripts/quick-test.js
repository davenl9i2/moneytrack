/**
 * Quick test to verify query intent detection
 * Run with: node scripts/quick-test.js
 */

require('dotenv').config();

async function quickTest() {
    console.log('🧪 Quick Query Intent Test\n');

    // Import the Groq parser
    const { parseMessageWithGroq } = require('../lib/groq.ts');

    const testCases = [
        {
            input: "我今天花多少錢?",
            expectedIntent: "QUERY",
            expectedAmount: 0,
            description: "Today's expense query"
        },
        {
            input: "午餐 100",
            expectedIntent: "RECORD",
            expectedAmount: 100,
            description: "Record lunch expense"
        },
        {
            input: "這個月的交通費",
            expectedIntent: "QUERY",
            expectedAmount: 0,
            description: "Monthly transport query"
        },
        {
            input: "昨天花了多少",
            expectedIntent: "QUERY",
            expectedAmount: 0,
            description: "Yesterday's expense query"
        },
    ];

    let passed = 0;
    let failed = 0;

    for (const test of testCases) {
        console.log(`\n📝 Test: ${test.description}`);
        console.log(`   Input: "${test.input}"`);

        try {
            const result = await parseMessageWithGroq(test.input);

            if (!result) {
                console.log('   ❌ FAILED: No result returned');
                failed++;
                continue;
            }

            const { intent, amount, queryStartDate, queryEndDate, queryType } = result;

            // Check intent
            const intentMatch = intent === test.expectedIntent;
            const amountMatch = amount === test.expectedAmount;

            if (intentMatch && amountMatch) {
                console.log(`   ✅ PASSED`);
                console.log(`      Intent: ${intent} ✓`);
                console.log(`      Amount: ${amount} ✓`);

                if (intent === 'QUERY') {
                    console.log(`      Query: ${queryStartDate} to ${queryEndDate} (${queryType})`);
                }

                passed++;
            } else {
                console.log(`   ❌ FAILED`);
                if (!intentMatch) {
                    console.log(`      Intent: Expected "${test.expectedIntent}", got "${intent}"`);
                }
                if (!amountMatch) {
                    console.log(`      Amount: Expected ${test.expectedAmount}, got ${amount}`);
                }
                failed++;
            }

        } catch (error) {
            console.log(`   ❌ ERROR: ${error.message}`);
            failed++;
        }
    }

    console.log(`\n\n📊 Results: ${passed} passed, ${failed} failed`);

    if (failed === 0) {
        console.log('🎉 All tests passed!');
    } else {
        console.log('⚠️ Some tests failed. Check the LLM prompt or API.');
    }
}

// Run if called directly
if (require.main === module) {
    quickTest().catch(console.error);
}

module.exports = { quickTest };
