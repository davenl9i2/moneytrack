'use client';

import { deleteExpense } from './actions';
import { useTransition } from 'react';

export default function TransactionItem({ transaction }: { transaction: any }) {
    const [isPending, startTransition] = useTransition();

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this?')) {
            startTransition(() => {
                deleteExpense(transaction.id);
            });
        }
    };

    return (
        <div className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${transaction.type === 'INCOME' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                    }`}>
                    {transaction.type === 'INCOME' ? '💰' : '💸'}
                </div>
                <div>
                    <div className="font-semibold text-slate-900">{transaction.category}</div>
                    <div className="text-xs text-slate-500">
                        {new Date(transaction.date).toLocaleDateString()}
                        {transaction.description && ` • ${transaction.description}`}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className={`font-bold ${transaction.type === 'INCOME' ? 'text-emerald-600' : 'text-slate-900'
                    }`}>
                    {transaction.type === 'INCOME' ? '+' : '-'}${transaction.amount}
                </div>
                <button
                    onClick={handleDelete}
                    disabled={isPending}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition-opacity p-2"
                >
                    🗑️
                </button>
            </div>
        </div>
    );
}
