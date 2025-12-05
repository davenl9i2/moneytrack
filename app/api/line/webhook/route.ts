import { NextRequest, NextResponse } from 'next/server';
import { validateSignature, WebhookEvent } from '@line/bot-sdk';
import { lineClient } from '@/lib/line';
import { prisma } from '@/lib/prisma';
import { parseMessageWithGroq } from '@/lib/groq';

const channelSecret = process.env.LINE_CHANNEL_SECRET || '';

export async function POST(req: NextRequest) {
    const body = await req.text();
    const signature = req.headers.get('x-line-signature') || '';

    if (channelSecret && !validateSignature(body, channelSecret, signature)) {
        return NextResponse.json({ message: 'Invalid signature' }, { status: 401 });
    }

    const events: WebhookEvent[] = JSON.parse(body).events;

    await Promise.all(
        events.map(async (event) => {
            if (event.type === 'message' && event.message.type === 'text') {
                await handleTextMessage(event);
            }
        })
    );

    return NextResponse.json({ message: 'OK' });
}

async function handleTextMessage(event: any) {
    const { replyToken, source } = event;
    const { text } = event.message;
    const lineUserId = source.userId;

    console.log(`Received message from ${lineUserId}: ${text}`);

    try {
        // 1. Find or Create User
        let user = await prisma.user.findUnique({
            where: { lineUserId },
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    lineUserId,
                    displayName: 'User', // Default
                },
            });
        }



        // 2. Parse Message using Groq (Llama 3)
        const parsedData = await parseMessageWithGroq(text);

        if (parsedData) {
            const { category, amount, description, date, type, reply } = parsedData;

            // 3. Save Expense
            await prisma.expense.create({
                data: {
                    userId: user.lineUserId,
                    category: category || '其他',
                    amount: Math.abs(amount), // Store as positive, type determines sign
                    type: type || 'EXPENSE',
                    description: description || '',
                    date: date ? new Date(date) : new Date(),
                },
            });

            console.log("✅ Expense saved to DB");

            try {
                const amountDisplay = type === 'INCOME' ? `+${amount}` : `-${amount}`;
                const replyText = reply || `✅ 記帳成功！\n類型: ${type === 'INCOME' ? '收入' : '支出'}\n項目: ${category}\n金額: ${amountDisplay}\n備註: ${description || '無'}`;

                await lineClient.replyMessage({
                    replyToken,
                    messages: [
                        {
                            type: 'text',
                            text: replyText,
                        },
                    ],
                });
            } catch (lineError) {
                console.warn("LINE Reply Failed (Expected in Test Mode/Dummy Token):", lineError);
            }
        } else {
            // 4. Fallback / Help
            try {
                await lineClient.replyMessage({
                    replyToken,
                    messages: [
                        {
                            type: 'text',
                            text: `無法理解您的訊息。\n請嘗試輸入像是：「午餐 100」、「薪水 50000」`,
                        },
                    ],
                });
            } catch (lineError) {
                console.warn("LINE Fallback Reply Failed:", lineError);
            }
        }
    } catch (error: any) {
        console.error('Error handling message:', error);
        // Log stack trace
        console.error(error.stack);
        await lineClient.replyMessage({
            replyToken,
            messages: [
                {
                    type: 'text',
                    text: `發生錯誤，請稍後再試。`,
                },
            ],
        });
    }
}

