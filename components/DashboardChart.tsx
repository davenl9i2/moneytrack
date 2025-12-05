"use client";

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

type DashboardChartProps = {
    type: 'EXPENSE' | 'INCOME';
    data: any[]; // Expense objects
};

export default function DashboardChart({ type, data }: DashboardChartProps) {
    // Filter data by type
    const filteredData = data.filter(d => (d.type || 'EXPENSE') === type);
    const totalAmount = filteredData.reduce((sum, item) => sum + item.amount, 0);

    // Aggregate by Category
    const categoryTotals: Record<string, number> = {};
    filteredData.forEach(item => {
        categoryTotals[item.category] = (categoryTotals[item.category] || 0) + item.amount;
    });

    // Calculate stats for list
    const categoryStats = Object.entries(categoryTotals)
        .map(([name, amount]) => ({
            name,
            amount,
            percentage: totalAmount > 0 ? ((amount / totalAmount) * 100).toFixed(1) : '0.0'
        }))
        .sort((a, b) => b.amount - a.amount);

    const labels = categoryStats.map(s => s.name);
    const values = categoryStats.map(s => s.amount);

    // Cute Pastel Colors
    const expenseColors = [
        '#FFB7B2', // Pink
        '#FFDAC1', // Peach
        '#FFFFD1', // Pale Yellow
        '#FF9AA2', // Salmon
        '#E2F0CB', // Pale Green (minor)
    ];

    const incomeColors = [
        '#B5EAD7', // Mint
        '#C7CEEA', // Lavender
        '#E2F0CB', // Pale Green
        '#A0E7E5', // Cyan
        '#FFDAC1', // Peach (minor)
    ];

    const colors = type === 'EXPENSE' ? expenseColors : incomeColors;

    const chartData = {
        labels,
        datasets: [
            {
                label: type === 'EXPENSE' ? '支出' : '收入',
                data: values,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#ffffff',
                hoverOffset: 4
            },
        ],
    };

    const options = {
        responsive: true,
        cutout: '60%',
        plugins: {
            legend: {
                display: false, // Hide default legend
            },
            title: {
                display: false,
            },
        },
    };

    return (
        <div style={{ width: '100%' }}>
            {/* Chart */}
            <div style={{ maxHeight: '220px', display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                <Doughnut data={chartData} options={options} />
            </div>

            {/* Details List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {categoryStats.map((stat, index) => (
                    <div key={stat.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: colors[index % colors.length] }}></div>
                            <span style={{ fontWeight: '600', color: '#5A4A42' }}>{stat.name}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', color: '#9E9E9E' }}>
                            <span>{stat.percentage}%</span>
                            <span style={{ fontWeight: 'bold', color: '#5A4A42', minWidth: '60px', textAlign: 'right' }}>${stat.amount.toLocaleString()}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
