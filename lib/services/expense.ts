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
        const totalExpense = expenses.filter(e => e.type === 'EXPENSE').reduce((sum, e) => sum + e.amount, 0);
        const totalIncome = expenses.filter(e => e.type === 'INCOME').reduce((sum, e) => sum + e.amount, 0);
        const balance = totalIncome - totalExpense;

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

            let header = `📊 查詢結果 (${queryTypeText})`;
            let body = "";
            if (criteria.queryType === 'INCOME') {
                body = `總收入: $${totalIncome}`;
            } else if (criteria.queryType === 'EXPENSE') {
                body = `總支出: $${totalExpense}`;
            } else {
                body = `總收入: $${totalIncome}\n總支出: $${totalExpense}\n淨收支: $${balance}`;
            }

            replyText = `${header}\n\n${body}\n筆數: ${count}\n\n${topCategories ? '主要分類:\n' + topCategories : '無資料'}`;
        }

        return replyText;
    },

    /**
     * Modify an existing expense
     */
    async modifyExpense(userId: string, targetId: number | null, updates: { amount?: number, category?: string, description?: string, date?: Date }) {
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

        // Build update data
        const dataToUpdate: any = {};
        if (updates.amount !== undefined && updates.amount !== 0) dataToUpdate.amount = updates.amount;
        if (updates.category) dataToUpdate.category = updates.category;
        // 'description' in DB is 'note' in user language
        if (updates.description) dataToUpdate.description = updates.description;
        if (updates.date) dataToUpdate.date = updates.date;

        if (Object.keys(dataToUpdate).length === 0) {
            return { success: false, message: '❓ 沒有偵測到需要修改的內容喔！' };
        }

        // Perform update
        const updatedRecord = await prisma.expense.update({
            where: { id: targetRecord.id },
            data: dataToUpdate,
        });

        // Construct intuitive message
        const changes = [];
        if (dataToUpdate.amount) changes.push(`金額 $${dataToUpdate.amount}`);
        if (dataToUpdate.category) changes.push(`分類 [${dataToUpdate.category}]`);
        if (dataToUpdate.description) changes.push(`備註 (${dataToUpdate.description})`);
        if (dataToUpdate.date) changes.push(`日期 ${dataToUpdate.date.toISOString().split('T')[0]}`);

        return {
            success: true,
            record: updatedRecord,
            message: `此筆紀錄已更新：${changes.join('、')} 囉！✅`
        };
    },

    /**
     * Delete an existing expense
     */
    async deleteExpense(userId: string, targetId: number | null) {
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
            return { success: false, message: '⚠️ 找不到可以刪除的紀錄喔！' };
        }

        // Perform deletion
        await prisma.expense.delete({
            where: { id: targetRecord.id },
        });

        // Format date for the message
        const dateStr = targetRecord.date.toISOString().split('T')[0];

        return {
            success: true,
            record: targetRecord,
            message: `已刪除 [${dateStr}] 的 [${targetRecord.category}] $${targetRecord.amount} (${targetRecord.description || '無備註'}) 紀錄囉！🗑️`
        };
    },
};
