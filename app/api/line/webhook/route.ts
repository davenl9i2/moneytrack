import { NextRequest, NextResponse } from 'next/server';
import { validateSignature, WebhookEvent } from '@line/bot-sdk';
import { lineClient } from '@/lib/line';
import { prisma } from '@/lib/prisma';
import { parseMessageWithGroq } from '@/lib/groq';

const channelSecret = process.env.LINE_CHANNEL_SECRET || '';

// For testing - LINE will use POST, but GET helps verify the endpoint is reachable
export async function GET() {
    console.log('✅ GET request received - Webhook endpoint is reachable');
    return NextResponse.json({
        status: 'ok',
        message: 'LINE Webhook endpoint is active',
        timestamp: new Date().toISOString()
    });
}

export async function POST(req: NextRequest) {
    console.log('🔔 Webhook POST received at:', new Date().toISOString());
    const body = await req.text();
    const signature = req.headers.get('x-line-signature') || '';
    console.log('📦 Body length:', body.length, 'Signature present:', !!signature);

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

        // Debug: Log parsed data
        console.log('📋 Parsed Data:', JSON.stringify(parsedData, null, 2));

        if (parsedData) {
            const { intent, category, amount, description, date, type, reply, queryStartDate, queryEndDate, queryType } = parsedData;

            console.log(`🎯 Intent detected: ${intent}`);

            // Handle based on intent
            if (intent === 'QUERY') {
                console.log('🔍 Processing QUERY intent...');

                // Query historical data
                const where: any = { userId: user.lineUserId };

                if (queryStartDate || queryEndDate) {
                    where.date = {};
                    if (queryStartDate) {
                        where.date.gte = new Date(queryStartDate);
                        console.log(`📅 Query start date: ${queryStartDate}`);
                    }
                    if (queryEndDate) {
                        // Set to end of day to include all records on that day
                        const endDate = new Date(queryEndDate);
                        endDate.setHours(23, 59, 59, 999);
                        where.date.lte = endDate;
                        console.log(`📅 Query end date: ${queryEndDate} (adjusted to end of day)`);
                    }
                }

                if (queryType && queryType !== 'ALL') {
                    where.type = queryType;
                    console.log(`📊 Query type: ${queryType}`);
                }

                if (category && category !== '其他') {
                    where.category = category;
                    console.log(`🏷️ Query category: ${category}`);
                }

                console.log('🔎 Query where clause:', JSON.stringify(where, null, 2));

                const expenses = await prisma.expense.findMany({
                    where,
                    select: {
                        amount: true,
                        category: true,
                        type: true,
                        date: true,
                        description: true,
                    },
                    orderBy: { date: 'desc' },
                });

                console.log(`✅ Found ${expenses.length} records`);

                const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
                const count = expenses.length;

                // Group by category
                const byCategory: Record<string, number> = {};
                expenses.forEach((exp) => {
                    byCategory[exp.category] = (byCategory[exp.category] || 0) + exp.amount;
                });

                const topCategories = Object.entries(byCategory)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 3)
                    .map(([cat, amt]) => `${cat}: $${amt}`)
                    .join('\n');

                const queryTypeText = queryType === 'INCOME' ? '收入' : queryType === 'EXPENSE' ? '支出' : '收支';
                const replyText = `📊 查詢結果\n\n${queryTypeText}總額: $${total}\n筆數: ${count}\n\n${topCategories ? '主要分類:\n' + topCategories : '無資料'}`;

                console.log('💬 Sending reply:', replyText);

                try {
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

            } else if (intent === 'RECORD') {
                console.log('💾 Processing RECORD intent...');

                // Validate amount exists and is not 0
                if (!amount || amount === 0) {
                    console.warn('⚠️ Invalid amount for RECORD intent:', amount);
                    try {
                        await lineClient.replyMessage({
                            replyToken,
                            messages: [
                                {
                                    type: 'text',
                                    text: '請提供有效的金額。例如：「午餐 100」',
                                },
                            ],
                        });
                    } catch (lineError) {
                        console.warn("LINE Reply Failed:", lineError);
                    }
                    return; // Don't save 0 amount records
                }

                // 3. Save Expense (original logic)
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

            } else if (intent === 'CHAT') {
                console.log('💬 Processing CHAT intent...');

                // Just reply with the LLM's response
                try {
                    await lineClient.replyMessage({
                        replyToken,
                        messages: [
                            {
                                type: 'text',
                                text: reply || '您好！我是您的記帳小幫手 😊',
                            },
                        ],
                    });
                } catch (lineError) {
                    console.warn("LINE Reply Failed:", lineError);
                }
            } else {
                console.warn('⚠️ Unknown intent:', intent);
                try {
                    await lineClient.replyMessage({
                        replyToken,
                        messages: [
                            {
                                type: 'text',
                                text: '抱歉，我不太理解您的意思。\n請嘗試：\n• 記帳：「午餐 100」\n• 查詢：「我昨天花多少錢?」',
                            },
                        ],
                    });
                } catch (lineError) {
                    console.warn("LINE Reply Failed:", lineError);
                }
            }
        } else {
            // 4. Fallback / Help
            try {
                await lineClient.replyMessage({
                    replyToken,
                    messages: [
                        {
                            type: 'text',
                            text: `無法理解您的訊息。\n請嘗試輸入像是：\n• 記帳：「午餐 100」、「薪水 50000」\n• 查詢：「我昨天花多少錢?」、「這個月的交通費」`,
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

