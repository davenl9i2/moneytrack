import { NextRequest, NextResponse } from 'next/server';
import { validateSignature, WebhookEvent } from '@line/bot-sdk';
import { lineClient } from '@/lib/line';
import { parseMessageWithGroq } from '@/lib/groq';
import { getUserOrInviteRegister } from '@/lib/services/user';
import { ExpenseService } from '@/lib/services/expense';

const channelSecret = process.env.LINE_CHANNEL_SECRET || '';

export async function POST(req: NextRequest) {
    // 1. Validate Signature
    const body = await req.text();
    const signature = req.headers.get('x-line-signature') as string;

    if (!validateSignature(body, channelSecret, signature)) {
        return NextResponse.json({ message: 'Invalid signature' }, { status: 403 });
    }

    // 2. Process Events
    const events: WebhookEvent[] = JSON.parse(body).events;

    for (const event of events) {
        if (event.type === 'message' && event.message.type === 'text') {
            await handleTextMessage(event);
        }
    }

    return NextResponse.json({ message: 'OK' });
}

async function handleTextMessage(event: any) {
    const { userId } = event.source;
    const { text } = event.message;
    const replyToken = event.replyToken;

    if (!userId) return;

    // A. User Check / Registration Logic
    // Using extracted service to handle registration flow
    const { user, shouldStop } = await getUserOrInviteRegister(userId, replyToken);
    if (shouldStop) return;

    try {
        // B. Context & LLM Parsing
        const recentRecordsStr = await ExpenseService.getRecentExpensesContext(userId);
        const parsedData = await parseMessageWithGroq(text, recentRecordsStr);

        console.log('📋 Parsed Data:', JSON.stringify(parsedData, null, 2));

        if (parsedData) {
            const { intent, category, amount, description, date, type, reply, queryStartDate, queryEndDate, queryType, targetId, note } = parsedData;

            // Allow 'note' from LLM to override description if available, otherwise use original description or note
            const finalDescription = note || description || '';

            let replyText = reply || '收到！';

            // C. Intent Handling
            // 1. RECORD
            if (intent === 'RECORD') {
                await ExpenseService.createExpense(userId, {
                    amount,
                    category,
                    description: finalDescription,
                    date: new Date(date),
                    type
                });
                console.log('✅ Expense recorded');
            }

            // 2. QUERY
            else if (intent === 'QUERY') {
                const queryResult = await ExpenseService.queryExpenses(userId, {
                    startDate: queryStartDate,
                    endDate: queryEndDate,
                    queryType,
                    category
                });
                replyText = queryResult; // Override default reply
            }

            // 3. MODIFY
            else if (intent === 'MODIFY') {
                const result = await ExpenseService.modifyExpense(userId, targetId, {
                    amount,
                    category,
                    description: note, // Map 'note' from LLM to 'description'
                    date: date ? new Date(date) : undefined
                });

                if (result.success) {
                    replyText = result.message!;
                } else {
                    replyText = result.message!;
                }
            }

            // 4. DELETE
            else if (intent === 'DELETE') {
                const result = await ExpenseService.deleteExpense(userId, targetId);
                replyText = result.message!;
            }

            // 4. CHAT (Default fallthrough)
            // Just uses the generated 'replyText' from LLM

            // D. Send Reply
            await lineClient.replyMessage({
                replyToken,
                messages: [{
                    type: 'text',
                    text: replyText,
                }]
            });

        } else {
            // Fallback if LLM fails
            await lineClient.replyMessage({
                replyToken,
                messages: [{
                    type: 'text',
                    text: '抱歉，我現在有點累，請稍後再試一次！😓',
                }]
            });
        }

    } catch (error) {
        console.error('Error handling message:', error);
        await lineClient.replyMessage({
            replyToken,
            messages: [{
                type: 'text',
                text: '系統發生錯誤，請稍後再試。',
            }]
        });
    }
}
