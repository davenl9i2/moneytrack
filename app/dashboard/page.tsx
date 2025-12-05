"use client";

import { useState, useEffect, TouchEvent } from 'react';
import DashboardChart from '@/components/DashboardChart';
import ExpenseForm from '@/components/ExpenseForm';
import { initializeLiff, isLoggedIn, getUserProfile, logout } from '@/lib/liff';

type Expense = {
    id: number;
    amount: number;
    category: string;
    description: string;
    date: string;
    type: 'EXPENSE' | 'INCOME';
};

export default function Dashboard() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [viewMode, setViewMode] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    // Modal State
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | undefined>(undefined);

    // LIFF State
    const [userId, setUserId] = useState<string>('');
    const [displayName, setDisplayName] = useState<string>('');
    const [isLiffReady, setIsLiffReady] = useState(false);
    const [liffError, setLiffError] = useState<string>('');

    useEffect(() => {
        initLiff();
    }, []);

    const initLiff = async () => {
        try {
            const initialized = await initializeLiff();

            if (!initialized) {
                setLiffError('無法初始化 LINE 登入，請從 LINE 應用程式開啟此頁面');
                return;
            }

            if (!isLoggedIn()) {
                setLiffError('請先登入 LINE 帳號');
                return;
            }

            const profile = await getUserProfile();
            if (profile) {
                setUserId(profile.userId);
                setDisplayName(profile.displayName);
                setIsLiffReady(true);
            } else {
                setLiffError('無法取得使用者資訊');
            }
        } catch (error) {
            console.error('LIFF Error:', error);
            setLiffError('LINE 登入發生錯誤，請重新整理頁面');
        }
    };

    useEffect(() => {
        if (userId) {
            fetchExpenses();
        }
    }, [userId]);

    const fetchExpenses = async () => {
        if (!userId) return;

        try {
            const res = await fetch(`/api/expenses?userId=${userId}`);
            if (res.ok) {
                const data = await res.json();
                setExpenses(data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleSwipe = (direction: 'LEFT' | 'RIGHT') => {
        if (direction === 'LEFT' && viewMode === 'EXPENSE') setViewMode('INCOME');
        if (direction === 'RIGHT' && viewMode === 'INCOME') setViewMode('EXPENSE');
    };

    // Swipe Handlers
    const minSwipeDistance = 50;
    const onTouchStart = (e: TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };
    const onTouchMove = (e: TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);
    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;

        if (distance > minSwipeDistance) handleSwipe('LEFT');
        if (distance < -minSwipeDistance) handleSwipe('RIGHT');
    };

    const handleSave = async (data: any) => {
        try {
            await fetch('/api/expenses', {
                method: 'POST',
                body: JSON.stringify({ ...data, userId })
            });
            setIsFormOpen(false);
            setEditingExpense(undefined);
            fetchExpenses();
        } catch (err) {
            console.error(err);
            alert('儲存失敗');
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        if (!confirm('確定要刪除嗎？')) return;
        try {
            await fetch(`/api/expenses?id=${id}`, { method: 'DELETE' });
            fetchExpenses();
        } catch (err) {
            console.error(err);
            alert('刪除失敗');
        }
    };

    const currentTotal = expenses
        .filter(e => (e.type || 'EXPENSE') === viewMode)
        .reduce((sum, e) => sum + e.amount, 0);

    const filteredExpenses = expenses.filter(e => (e.type || 'EXPENSE') === viewMode);

    // Calculate Net Balance (Income - Expense)
    const totalIncome = expenses.filter(e => e.type === 'INCOME').reduce((s, e) => s + e.amount, 0);
    const totalExpense = expenses.filter(e => (e.type || 'EXPENSE') === 'EXPENSE').reduce((s, e) => s + e.amount, 0);
    const netBalance = totalIncome - totalExpense;

    // Show error if LIFF failed
    if (liffError) {
        return (
            <main className="container fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <div className="card" style={{ textAlign: 'center', padding: '40px', maxWidth: '400px' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '20px' }}>⚠️</div>
                    <h2 style={{ marginBottom: '16px', color: '#FF5C5C' }}>登入失敗</h2>
                    <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '24px' }}>{liffError}</p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <button className="btn btn-primary" onClick={() => window.location.reload()}>
                            重新整理
                        </button>

                        <a
                            href="https://line.me/R/ti/p/@253gxwuc"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn"
                            style={{
                                background: '#06C755',
                                color: 'white',
                                textDecoration: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                padding: '12px 24px',
                                borderRadius: '12px',
                                fontWeight: '600'
                            }}
                        >
                            <span>📱</span>
                            加入 LINE 好友
                        </a>

                        <p style={{ fontSize: '0.8rem', color: '#999', marginTop: '8px' }}>
                            加入好友後，請從 LINE 聊天室開啟此連結
                        </p>
                    </div>
                </div>
            </main>
        );
    }

    // Show loading while initializing
    if (!isLiffReady) {
        return (
            <main className="container fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '16px' }}>💰</div>
                    <p style={{ color: '#999' }}>載入中...</p>
                </div>
            </main>
        );
    }

    return (
        <main className="container fade-in" style={{ paddingBottom: '100px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 className="title" style={{ color: '#5A4A42' }}>我的小金庫</h1>
                    <div style={{ fontSize: '0.8rem', color: '#9E9E9E' }}>好好記帳，天天向上</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.8rem', color: '#9E9E9E' }}>剩餘金額</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#5A4A42' }}>
                        ${netBalance.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#C4C4C4', marginTop: '4px' }}>{displayName}</div>
                </div>
            </div>

            {/* Swipe Area */}
            <div
                className="card"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                style={{ marginBottom: '24px', position: 'relative', overflow: 'hidden', paddingBottom: '32px' }}
            >
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    {/* Toggle Pills */}
                    <div style={{ display: 'inline-flex', background: '#F0F0F0', borderRadius: '20px', padding: '4px', marginBottom: '16px' }}>
                        <div onClick={() => setViewMode('EXPENSE')} style={{
                            padding: '6px 16px', borderRadius: '16px', fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer',
                            background: viewMode === 'EXPENSE' ? '#FFB7B2' : 'transparent',
                            color: viewMode === 'EXPENSE' ? 'white' : '#9E9E9E',
                            transition: 'all 0.2s'
                        }}>支出</div>
                        <div onClick={() => setViewMode('INCOME')} style={{
                            padding: '6px 16px', borderRadius: '16px', fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer',
                            background: viewMode === 'INCOME' ? '#B5EAD7' : 'transparent',
                            color: viewMode === 'INCOME' ? 'white' : '#9E9E9E',
                            transition: 'all 0.2s'
                        }}>收入</div>
                    </div>

                    <h2 style={{ fontSize: '3rem', fontWeight: '800', margin: '0', color: '#5A4A42' }}>
                        ${currentTotal.toLocaleString()}
                    </h2>
                </div>

                <DashboardChart type={viewMode} data={expenses} />

                <div style={{ textAlign: 'center', marginTop: '20px', color: '#C7CEEA', fontSize: '0.8rem' }}>
                    {viewMode === 'EXPENSE' ? '← 向左滑動查看收入' : '向右滑動查看支出 →'}
                </div>
            </div>

            <div className="card">
                <h3 style={{ marginBottom: '20px', fontWeight: 'bold', color: '#5A4A42', fontSize: '1.1rem' }}>近期紀錄</h3>
                {filteredExpenses.length === 0 ? (
                    <p style={{ color: '#ccc', textAlign: 'center', padding: '20px' }}>還沒有紀錄哦，按 + 新增一筆吧！</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {filteredExpenses.map(expense => (
                            <div key={expense.id}
                                onClick={() => { setEditingExpense(expense); setIsFormOpen(true); }}
                                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', paddingBottom: '16px', borderBottom: '1px dashed #F3EFE0' }}>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <div style={{ fontWeight: '700', color: '#5A4A42', fontSize: '1rem' }}>
                                        {expense.category}
                                        {expense.description && <span style={{ fontWeight: '400', fontSize: '0.9rem', marginLeft: '6px', color: '#9E9E9E' }}>{expense.description}</span>}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#C4C4C4' }}>
                                        {new Date(expense.date).toLocaleDateString()}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        fontWeight: '800',
                                        fontSize: '1.1rem',
                                        color: (expense.type || 'EXPENSE') === 'EXPENSE' ? '#FFB7B2' : '#B5EAD7',
                                    }}>
                                        {(expense.type || 'EXPENSE') === 'EXPENSE' ? '-' : '+'}${expense.amount}
                                    </div>
                                    <button onClick={(e) => handleDelete(e, expense.id)} style={{ width: '24px', height: '24px', borderRadius: '50%', border: 'none', background: '#F9F9F9', color: '#E0E0E0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Floating Action Button - Cute Style */}
            <button
                onClick={() => { setEditingExpense(undefined); setIsFormOpen(true); }}
                style={{
                    position: 'fixed',
                    bottom: '32px',
                    right: '24px',
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    fontSize: '32px',
                    boxShadow: '0 8px 20px rgba(255, 183, 178, 0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 100,
                    transition: 'transform 0.2s'
                }}
                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
                +
            </button>

            <ExpenseForm
                key={editingExpense?.id || 'new'}
                isOpen={isFormOpen}
                initialData={editingExpense}
                onSubmit={handleSave}
                onCancel={() => { setIsFormOpen(false); setEditingExpense(undefined); }}
            />
        </main>
    );
}
