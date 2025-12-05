// Test category seeding for different users
const TEST_USERS = [
    "U1234567890abcdef1234567890abcdef", // User 1
    "U9999999999999999999999999999999", // User 2
    "Uabcdefabcdefabcdefabcdefabcdefab"  // User 3
];

async function testCategorySeeding() {
    console.log('=== 測試不同使用者的類別自動建立 ===\n');

    for (const userId of TEST_USERS) {
        console.log(`\n測試使用者: ${userId}`);

        // Fetch categories (should auto-seed if empty)
        const response = await fetch(`http://localhost:3000/api/categories?userId=${userId}`);
        const categories = await response.json();

        if (categories.error) {
            console.log('  ❌ 錯誤:', categories.error);
            continue;
        }

        console.log(`  ✅ 總類別數: ${categories.length}`);

        // Group by type
        const expenses = categories.filter(c => c.type === 'EXPENSE');
        const incomes = categories.filter(c => c.type === 'INCOME');

        console.log(`  支出類別 (${expenses.length}):`, expenses.map(c => c.name).join(', '));
        console.log(`  收入類別 (${incomes.length}):`, incomes.map(c => c.name).join(', '));
    }

    console.log('\n=== 測試完成 ===');
}

testCategorySeeding();
