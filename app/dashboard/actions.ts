'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function addExpense(formData: FormData) {
    const amount = Number(formData.get('amount'));
    const category = formData.get('category') as string;
    const description = formData.get('description') as string;
    const type = formData.get('type') as string || 'EXPENSE';
    // Hardcoded user for now, in real app use auth
    const userId = "USER_ID_PLACEHOLDER";

    // Find actual user if needed, or assume we have one for demo
    // distinct user selection might be needed if multiple users
    const user = await prisma.user.findFirst();
    if (!user) throw new Error("No user found");

    await prisma.expense.create({
        data: {
            amount: Math.abs(amount),
            category,
            description,
            type,
            date: new Date(),
            userId: user.lineUserId,
        },
    });

    revalidatePath('/dashboard');
}

export async function deleteExpense(id: number) {
    await prisma.expense.delete({
        where: { id },
    });
    revalidatePath('/dashboard');
}
