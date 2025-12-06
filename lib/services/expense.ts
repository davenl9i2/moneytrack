import { prisma } from '@/lib/prisma';
import { summarizeQueryResults } from '@/lib/groq';

export interface ExpenseRecord {
    amount: number;
    category: string;
    description: string;
    date: Date;
    type: 'EXPENSE' | 'INCOME';
}

export const ExpenseService = {
    /**
     * Get recent expenses for LLM context
     */
    async getRecentExpensesContext(userId: string): Promise<string> {
        const recentExpenses = await prisma.expense.findMany({
            where: { userId },
            orderBy: { id: 'desc' },
            take: 5,
        });

        return recentExpenses.map(e =>
            `[ID:${e.id}] ${e.date.toISOString().split('T')[0]} ${e.category} $${e.amount} (${e.description || '無備註'})`
        ).join('\n');
    },

    /**
     * Create a new expense record
     */
    async createExpense(userId: string, data: ExpenseRecord) {
        return await prisma.expense.create({
            data: {
                userId,
                amount: data.amount,
                category: data.category,
                description: data.description,
                date: data.date,
                type: data.type,
            },
        });
    },

    /**
     * Query expenses based on criteria and generate a summary
     */
    async queryExpenses(userId: string, criteria: {
        startDate?: string;
        endDate?: string;
        queryType?: string;
        category?: string;
    }) {
        const where: any = { userId };

        // Date filter
        if (criteria.startDate || criteria.endDate) {
            where.date = {};
            if (criteria.startDate) {
                const [y, m, d] = criteria.startDate.split('-').map(Number);
                where.date.gte = new Date(y, m - 1, d);
            }
            if (criteria.endDate) {
                const [y, m, d] = criteria.endDate.split('-').map(Number);
                const endDate = new Date(y, m - 1, d);
                endDate.setHours(23, 59, 59, 999);
                where.date.lte = endDate;
            }
        }

        // Type filter
        if (criteria.queryType && criteria.queryType !== 'ALL') {
            where.type = criteria.queryType;
        }

        // Category filter
        if (criteria.category && criteria.category !== '其他') {
            where.category = criteria.category;
        }

        const expenses = await prisma.expense.findMany({
            where,
            select: {
                id: true,
                amount: true,
                category: true,
                type: true,
                date: true,
                description: true,
            },
            orderBy: { date: 'desc' },
        });

        // Generate Reply Text
        const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const count = expenses.length;
        const queryTypeText = criteria.queryType === 'INCOME' ? '收入' : criteria.queryType === 'EXPENSE' ? '支出' : '收支';

        // 1. Try conversational summary
        let replyText = '';
        try {
            const summary = await summarizeQueryResults(expenses, queryTypeText, criteria.startDate, criteria.endDate);
            if (summary) replyText = summary;
        } catch (err) {
            console.warn('Conversational summary failed, using template.');
        }

        // 2. Fallback template
        if (!replyText) {
            const byCategory: Record<string, number> = {};
            expenses.forEach((exp) => {
                byCategory[exp.category] = (byCategory[exp.category] || 0) + exp.amount;
            });
            const topCategories = Object.entries(byCategory)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([cat, amt]) => `${cat}: $${amt}`)
                .join('\n');

            replyText = `📊 查詢結果\n\n${queryTypeText}總額: $${total}\n筆數: ${count}\n\n${topCategories ? '主要分類:\n' + topCategories : '無資料'}`;
        }

        return replyText;
    },

    /**
     * Modify an existing expense
     */
    async modifyExpense(userId: string, targetId: number | null, newAmount: number) {
        let targetRecord = null;

        // A. Try using the ID identified by LLM
        if (targetId) {
            targetRecord = await prisma.expense.findUnique({
                where: { id: targetId },
            });
            // Security check
            if (targetRecord && targetRecord.userId !== userId) {
                targetRecord = null;
            }
        }

        // B. Fallback: Find the last record
        if (!targetRecord) {
            targetRecord = await prisma.expense.findFirst({
                where: { userId },
                orderBy: { id: 'desc' },
            });
        }

        if (!targetRecord) {
            return { success: false, message: '⚠️ 找不到可以修改的紀錄喔！' };
        }

        // 执行更新
        const updatedRecord = await prisma.expense.update({
            where: { id: targetRecord.id },
            data: { amount: newAmount },
        });

        return {
            success: true,
            record: updatedRecord,
            message: `此筆 [${updatedRecord.category}] 金額已更新為 $${newAmount} 囉！✅`
        };
    }
};
