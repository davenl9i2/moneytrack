'use client';

import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { useMemo } from 'react';

ChartJS.register(ArcElement, Tooltip, Legend);

interface Expense {
    category: string;
    amount: number;
    type: string;
}

export default function CategoryChart({ expenses }: { expenses: Expense[] }) {
    const data = useMemo(() => {
        const expenseOnly = expenses.filter(e => e.type === 'EXPENSE');
        const categories: Record<string, number> = {};

        expenseOnly.forEach((t) => {
            categories[t.category] = (categories[t.category] || 0) + t.amount;
        });

        const labels = Object.keys(categories);
        const values = Object.values(categories);

        // Premium Palette
        const backgroundColors = [
            '#f43f5e', // Rose
            '#f59e0b', // Amber
            '#10b981', // Emerald
            '#3b82f6', // Blue
            '#8b5cf6', // Violet
            '#ec4899', // Pink
            '#64748b', // Slate
        ];

        return {
            labels,
            datasets: [
                {
                    data: values,
                    backgroundColor: backgroundColors,
                    borderWidth: 0,
                    hoverOffset: 4,
                },
            ],
        };
    }, [expenses]);

    const options = {
        cutout: '70%',
        plugins: {
            legend: {
                position: 'right' as const,
                labels: {
                    usePointStyle: true,
                    padding: 20,
                    font: {
                        family: 'inherit',
                    }
                }
            },
        },
        maintainAspectRatio: false,
    };

    return (
        <div className="h-[300px] w-full flex items-center justify-center">
            {expenses.length > 0 ? (
                <Doughnut data={data} options={options} />
            ) : (
                <div className="text-slate-400 text-sm">No expenses to show</div>
            )}
        </div>
    );
}
