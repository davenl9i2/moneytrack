import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type'); // Optional filter

    if (!userId) {
        return NextResponse.json({ error: 'UserId is required' }, { status: 400 });
    }

    try {
        // Ensure user exists first (upsert)
        await prisma.user.upsert({
            where: { lineUserId: userId },
            update: {},
            create: { lineUserId: userId, displayName: 'User' },
        });

        // Check if user has any categories
        const count = await prisma.category.count({ where: { userId } });

        // Seed defaults if empty
        if (count === 0) {
            const defaultExpenses = ['飲食', '交通', '娛樂', '購物', '其他'];
            const defaultIncome = ['薪水', '獎金', '投資', '其他'];

            const session = [];
            for (const name of defaultExpenses) {
                session.push({ name, type: 'EXPENSE', userId });
            }
            for (const name of defaultIncome) {
                session.push({ name, type: 'INCOME', userId });
            }

            await prisma.category.createMany({ data: session });
        }

        const where: any = { userId };
        if (type) where.type = type;

        const categories = await prisma.category.findMany({
            where,
            orderBy: { id: 'asc' }
        });

        return NextResponse.json(categories);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, type, userId } = body;

        if (!name || !type || !userId) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        const category = await prisma.category.create({
            data: { name, type, userId }
        });

        return NextResponse.json(category);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    try {
        await prisma.category.delete({ where: { id: Number(id) } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
}
