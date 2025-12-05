// Test script to verify categories are seeded
const TEST_USER_ID = "U1234567890abcdef1234567890abcdef";

async function testCategories() {
    console.log('=== 測試類別 API ===\n');

    // Test all categories
    const allResponse = await fetch(`http://localhost:3000/api/categories?userId=${TEST_USER_ID}`);
    const allData = await allResponse.json();
    console.log('所有類別:', allData.length, '個');

    // Test expense categories
    const expenseResponse = await fetch(`http://localhost:3000/api/categories?userId=${TEST_USER_ID}&type=EXPENSE`);
    const expenseData = await expenseResponse.json();
    console.log('\n支出類別:');
    expenseData.forEach(c => console.log(`  - ${c.name}`));

    // Test income categories
    const incomeResponse = await fetch(`http://localhost:3000/api/categories?userId=${TEST_USER_ID}&type=INCOME`);
    const incomeData = await incomeResponse.json();
    console.log('\n收入類別:');
    incomeData.forEach(c => console.log(`  - ${c.name}`));
}

testCategories();
