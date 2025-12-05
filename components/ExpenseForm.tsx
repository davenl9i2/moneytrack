"use client";

import { useState, useEffect } from 'react';

type Expense = {
    id?: number;
    amount: number;
    category: string;
    description: string;
    date: string;
    type: 'EXPENSE' | 'INCOME';
};

type Category = {
    id: number;
    name: string;
    type: string;
};

interface ExpenseFormProps {
    initialData?: Expense;
    onSubmit: (data: Expense) => void;
    onCancel: () => void;
    isOpen: boolean;
}

export default function ExpenseForm({ initialData, onSubmit, onCancel, isOpen }: ExpenseFormProps) {
    const [amount, setAmount] = useState(initialData?.amount || '');
    const [category, setCategory] = useState(initialData?.category || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [date, setDate] = useState(initialData?.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    const [type, setType] = useState<'EXPENSE' | 'INCOME'>(initialData?.type || 'EXPENSE');

    // Categories State
    const [categories, setCategories] = useState<Category[]>([]);
    const [isManageMode, setIsManageMode] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    const TEST_USER_ID = "U1234567890abcdef1234567890abcdef";

    // Reset form when opening/closing or when initialData changes
    useEffect(() => {
        if (isOpen) {
            // Reset to initial values when opening
            setAmount(initialData?.amount || '');
            setCategory(initialData?.category || '');
            setDescription(initialData?.description || '');
            // Always use today's date for new records (use local timezone)
            if (initialData?.date) {
                setDate(new Date(initialData.date).toISOString().split('T')[0]);
            } else {
                // Get current date in local timezone
                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const day = String(now.getDate()).padStart(2, '0');
                setDate(`${year}-${month}-${day}`);
            }
            setType(initialData?.type || 'EXPENSE');
            setIsManageMode(false);
        }
    }, [isOpen, initialData]);

    useEffect(() => {
        if (isOpen) {
            fetchCategories();
        }
    }, [isOpen, type]);

    const fetchCategories = async () => {
        const res = await fetch(`/api/categories?userId=${TEST_USER_ID}&type=${type}`);
        if (res.ok) {
            const data = await res.json();
            setCategories(data);

            // Set default category if none selected or invalid
            if (!initialData && data.length > 0) {
                // only set if currently empty or not in list
                setCategory(prev => data.find((c: any) => c.name === prev) ? prev : data[0].name);
            }
        }
    };

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return;
        await fetch('/api/categories', {
            method: 'POST',
            body: JSON.stringify({ name: newCategoryName, type, userId: TEST_USER_ID })
        });
        setNewCategoryName('');
        fetchCategories();
    };

    const handleDeleteCategory = async (id: number) => {
        if (!confirm('確定刪除此類別？')) return;
        await fetch(`/api/categories?id=${id}`, { method: 'DELETE' });
        fetchCategories();
    };

    // Reset logic when switching types is handled by fetchCategories + default selection
    useEffect(() => {
        if (!initialData) {
            // trigger re-fetch or clear is handled by effect above
        }
    }, [type]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            ...initialData,
            amount: Number(amount),
            category,
            description,
            date: new Date(date).toISOString(),
            type
        });
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000
        }}>
            <div className="card fade-in" style={{ width: '100%', maxWidth: '600px', borderRadius: '16px 16px 0 0', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 className="title" style={{ fontSize: '1.5rem' }}>
                        {isManageMode ? '我的類別' : (initialData ? '編輯紀錄' : '新增紀錄')}
                    </h2>
                    <button style={{ fontSize: '1.05rem', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }} onClick={() => setIsManageMode(!isManageMode)}>
                        {isManageMode ? '完成' : '我的類別'}
                    </button>
                </div>

                {isManageMode ? (
                    <div style={{ marginTop: '16px' }}>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                            <input
                                className="card"
                                style={{ flex: 1, padding: '8px', background: '#F9F9F9' }}
                                placeholder="新類別名稱..."
                                value={newCategoryName}
                                onChange={e => setNewCategoryName(e.target.value)}
                            />
                            <button className="btn btn-primary" style={{ padding: '8px 16px' }} onClick={handleAddCategory}>新增</button>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {categories.map(c => (
                                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#F0F0F0', borderRadius: '20px' }}>
                                    <span>{c.name}</span>
                                    <span onClick={() => handleDeleteCategory(c.id)} style={{ cursor: 'pointer', color: '#ccc', fontWeight: 'bold' }}>×</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                        {/* Type Toggle */}
                        <div style={{ display: 'flex', background: 'var(--border)', padding: '4px', borderRadius: '12px' }}>
                            {['EXPENSE', 'INCOME'].map((t) => (
                                <div
                                    key={t}
                                    onClick={() => setType(t as any)}
                                    style={{
                                        flex: 1,
                                        textAlign: 'center',
                                        padding: '8px',
                                        borderRadius: '8px',
                                        background: type === t ? 'var(--card-bg)' : 'transparent',
                                        color: type === t ? (t === 'EXPENSE' ? '#FF5C5C' : '#4BC0C0') : 'var(--secondary)',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        boxShadow: type === t ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {t === 'EXPENSE' ? '支出' : '收入'}
                                </div>
                            ))}
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--secondary)', marginBottom: '4px' }}>金額</label>
                            <input
                                type="number"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                className="card"
                                style={{ width: '100%', fontSize: '1.5rem', fontWeight: 'bold', padding: '12px', border: 'none', background: '#f5f5f5' }}
                                placeholder="0"
                                required
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--secondary)', marginBottom: '4px' }}>日期</label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                    className="card"
                                    style={{ width: '100%', padding: '12px', border: '1px solid var(--border)', background: 'transparent' }}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--secondary)', marginBottom: '4px' }}>類別</label>
                                <select
                                    value={category}
                                    onChange={e => setCategory(e.target.value)}
                                    className="card"
                                    style={{ width: '100%', padding: '12px', border: '1px solid var(--border)', background: 'transparent' }}
                                >
                                    {categories.map(c => (
                                        <option key={c.id} value={c.name}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--secondary)', marginBottom: '4px' }}>備註</label>
                            <input
                                type="text"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="card"
                                style={{ width: '100%', padding: '12px', border: '1px solid var(--border)', background: 'transparent' }}
                                placeholder={type === 'EXPENSE' ? '錢錢去哪了呢？' : '告訴我賺錢的秘密吧！'}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                            <button type="button" onClick={onCancel} className="btn" style={{ flex: 1, background: '#f0f0f0' }}>取消</button>
                            <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>儲存</button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
