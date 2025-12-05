
import 'dotenv/config';
import crypto from 'crypto';

async function main() {
    const channelSecret = process.env.LINE_CHANNEL_SECRET;
    if (!channelSecret) {
        console.error("Error: LINE_CHANNEL_SECRET missing.");
        return;
    }

    const message = {
        type: 'text',
        text: '今天晚餐吃牛肉麵 250元'
    };

    const body = JSON.stringify({
        events: [
            {
                type: 'message',
                replyToken: 'dummy_token',
                source: { userId: 'U123456dummy', type: 'user' },
                timestamp: Date.now(),
                message: { ...message, id: 'msg_123' }
            }
        ]
    });

    // Calculate Signature
    const signature = crypto
        .createHmac('SHA256', channelSecret)
        .update(body)
        .digest('base64');

    console.log("Simulating LINE Webhook...");
    console.log(`Sending: "${message.text}"`);

    try {
        const res = await fetch('http://localhost:3000/api/line/webhook', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-line-signature': signature
            },
            body: body
        });

        if (res.ok) {
            console.log("\n✅ Webhook Success (200 OK)");
            console.log("Check your database or server logs for Groq processing output.");
        } else {
            console.error("\n❌ Webhook Failed:", res.status, res.statusText);
            const text = await res.text();
            console.error("Response:", text);
        }
    } catch (e: any) {
        console.error("Connection Error:", e.message);
        console.log("Ensure 'npm run dev' is running on localhost:3000");
    }
}

main();
