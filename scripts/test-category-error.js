// Test with detailed error logging
async function testWithDetails() {
    const userId = "U9999999999999999999999999999999";

    console.log('測試新使用者:', userId);

    try {
        const response = await fetch(`http://localhost:3000/api/categories?userId=${userId}`);
        const text = await response.text();

        console.log('Status:', response.status);
        console.log('Response:', text);

        if (response.ok) {
            const data = JSON.parse(text);
            console.log('Categories:', data);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

testWithDetails();
