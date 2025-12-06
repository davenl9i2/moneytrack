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

type SortOption = 'date-asc' | 'date-desc' | 'amount-asc' | 'amount-desc';

export default function Dashboard() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [viewMode, setViewMode] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    // Modal State
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | undefined>(undefined);

    // Sort State
    const [sortBy, setSortBy] = useState<SortOption>('date-desc');
    const [showSortMenu, setShowSortMenu] = useState(false);

    // Month Filter State
    const [selectedMonth, setSelectedMonth] = useState<string>(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    // LIFF State
    const [userId, setUserId] = useState<string>('');
    const [displayName, setDisplayName] = useState<string>('');
    const [isLiffReady, setIsLiffReady] = useState(false);
    const [liffError, setLiffError] = useState<string>('');

    useEffect(() => {
        initLiff();
    }, []);

    // Close sort menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (showSortMenu && !target.closest('.sort-menu-container')) {
                setShowSortMenu(false);
            }
        };

        if (showSortMenu) {
            document.addEventListener('click', handleClickOutside);
        }

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [showSortMenu]);

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

    // Month Navigation
    const changeMonth = (offset: number) => {
        const [year, month] = selectedMonth.split('-').map(Number);
        const date = new Date(year, month - 1 + offset, 1);
        const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        setSelectedMonth(newMonth);
    };

    const handleSwipe = (direction: 'LEFT' | 'RIGHT') => {
        if (direction === 'LEFT') changeMonth(1);  // Next month
        if (direction === 'RIGHT') changeMonth(-1); // Previous month
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
            const isEditing = !!editingExpense?.id;
            const method = isEditing ? 'PUT' : 'POST';
            const body = isEditing ? data : { ...data, userId };

            await fetch('/api/expenses', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
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

    // Filter expenses by selected month
    const monthlyExpenses = expenses.filter(e => {
        const expenseMonth = new Date(e.date).toISOString().slice(0, 7);
        return expenseMonth === selectedMonth;
    });

    const currentTotal = monthlyExpenses
        .filter(e => (e.type || 'EXPENSE') === viewMode)
        .reduce((sum, e) => sum + e.amount, 0);

    const filteredExpenses = expenses.filter(e => (e.type || 'EXPENSE') === viewMode);

    // Sort expenses based on sortBy
    const sortedExpenses = [...filteredExpenses].sort((a, b) => {
        switch (sortBy) {
            case 'date-asc':
                return new Date(a.date).getTime() - new Date(b.date).getTime();
            case 'date-desc':
                return new Date(b.date).getTime() - new Date(a.date).getTime();
            case 'amount-asc':
                return a.amount - b.amount;
            case 'amount-desc':
                return b.amount - a.amount;
            default:
                return 0;
        }
    });

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
                    {/* Month Display */}
                    <div style={{ fontSize: '0.9rem', color: '#9E9E9E', marginBottom: '12px' }}>
                        {selectedMonth.split('-')[0]}年 {parseInt(selectedMonth.split('-')[1])}月
                    </div>

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

                <DashboardChart
                    type={viewMode}
                    data={monthlyExpenses}
                    selectedMonth={selectedMonth}
                    onMonthClick={() => alert('月份選擇器功能開發中...')}
                />

                <div style={{ textAlign: 'center', marginTop: '20px', color: '#C7CEEA', fontSize: '0.8rem' }}>
                    ← 滑動切換月份 →
                </div>
            </div>

            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ fontWeight: 'bold', color: '#5A4A42', fontSize: '1.1rem', margin: 0 }}>近期紀錄</h3>

                    {/* Sort Button */}
                    <div className="sort-menu-container" style={{ position: 'relative' }}>
                        <button
                            onClick={() => setShowSortMenu(!showSortMenu)}
                            style={{
                                background: '#F0F0F0',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '8px 12px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '0.9rem',
                                color: '#5A4A42',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#E0E0E0'}
                            onMouseLeave={(e) => e.currentTarget.style.background = '#F0F0F0'}
                        >
                            <span style={{ fontSize: '1.1rem' }}>⇅</span>
                            <span style={{ fontSize: '0.85rem' }}>排序</span>
                        </button>

                        {/* Sort Menu */}
                        {showSortMenu && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                right: 0,
                                marginTop: '8px',
                                background: 'white',
                                borderRadius: '12px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                padding: '8px',
                                minWidth: '160px',
                                zIndex: 1000
                            }}>
                                {[
                                    { value: 'date-asc' as SortOption, label: '日期 舊→新' },
                                    { value: 'date-desc' as SortOption, label: '日期 新→舊' },
                                    { value: 'amount-asc' as SortOption, label: '金額 小→大' },
                                    { value: 'amount-desc' as SortOption, label: '金額 大→小' },
                                ].map(option => (
                                    <div
                                        key={option.value}
                                        onClick={() => {
                                            setSortBy(option.value);
                                            setShowSortMenu(false);
                                        }}
                                        style={{
                                            padding: '10px 12px',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            background: sortBy === option.value ? '#FFB7B2' : 'transparent',
                                            color: sortBy === option.value ? 'white' : '#5A4A42',
                                            fontWeight: sortBy === option.value ? 'bold' : 'normal',
                                            fontSize: '0.9rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            transition: 'all 0.2s',
                                            marginBottom: '4px'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (sortBy !== option.value) {
                                                e.currentTarget.style.background = '#F5F5F5';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (sortBy !== option.value) {
                                                e.currentTarget.style.background = 'transparent';
                                            }
                                        }}
                                    >
                                        <span>{option.label}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {filteredExpenses.length === 0 ? (
                    <p style={{ color: '#ccc', textAlign: 'center', padding: '20px' }}>還沒有紀錄哦，按 + 新增一筆吧！</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {sortedExpenses.map(expense => (
                            <div key={expense.id}
                                onClick={() => { setEditingExpense(expense); setIsFormOpen(true); }}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    paddingBottom: '16px',
                                    borderBottom: '1px dashed #F3EFE0',
                                    transition: 'background 0.2s',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    margin: '-12px',
                                    marginBottom: '4px'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#F9F9F9'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >

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
