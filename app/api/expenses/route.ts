import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ error: 'UserId is required' }, { status: 400 });
    }

    try {
        const expenses = await prisma.expense.findMany({
            where: { userId: userId },
            orderBy: { date: 'desc' },
            take: 50, // Limit for performance
        });
        return NextResponse.json(expenses);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { amount, category, description, date, userId, type } = body;

        // Simple validation
        if (!amount || !userId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Ensure user exists (Mock or real)
        // For now, upsert user to ensure FK validity
        await prisma.user.upsert({
            where: { lineUserId: userId },
            update: {},
            create: { lineUserId: userId, displayName: 'User' },
        });

        const expense = await prisma.expense.create({
            data: {
                amount: Number(amount),
                category: category || 'Uncategorized',
                description: description || '',
                date: new Date(date || Date.now()),
                userId: userId,
                type: type || 'EXPENSE',
            },
        });

        return NextResponse.json(expense);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    try {
        await prisma.expense.delete({ where: { id: Number(id) } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
}
