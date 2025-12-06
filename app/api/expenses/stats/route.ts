import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const type = searchParams.get('type'); // 'EXPENSE' or 'INCOME'

    if (!userId) {
        return NextResponse.json({ error: 'UserId is required' }, { status: 400 });
    }

    try {
        // Build where clause
        const where: any = { userId };

        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date.gte = new Date(startDate);
            if (endDate) where.date.lte = new Date(endDate);
        }

        if (type) {
            where.type = type;
        }

        // Get total amount
        const expenses = await prisma.expense.findMany({
            where,
            select: {
                amount: true,
                category: true,
                type: true,
                date: true,
            },
        });

        const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const count = expenses.length;

        // Group by category
        const byCategory: Record<string, number> = {};
        expenses.forEach((exp) => {
            byCategory[exp.category] = (byCategory[exp.category] || 0) + exp.amount;
        });

        return NextResponse.json({
            total,
            count,
            byCategory,
            expenses: expenses.slice(0, 10), // Return latest 10 for context
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
