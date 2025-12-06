import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, displayName } = body;

        if (!userId) {
            return NextResponse.json({ error: 'UserId is required' }, { status: 400 });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { lineUserId: userId },
        });

        if (existingUser) {
            return NextResponse.json({
                message: 'User already exists',
                user: existingUser
            });
        }

        // Create new user
        const newUser = await prisma.user.create({
            data: {
                lineUserId: userId,
                displayName: displayName || 'User',
            },
        });

        console.log(`✅ New user registered: ${userId}`);

        return NextResponse.json({
            message: 'User registered successfully',
            user: newUser
        });
    } catch (error) {
        console.error('User registration error:', error);
        return NextResponse.json({ error: 'Failed to register user' }, { status: 500 });
    }
}
