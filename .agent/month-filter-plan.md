# 月份篩選功能實作計劃

## 需求總結
1. 圓餅圖 + 總額：只顯示選中月份的資料
2. 支出/收入切換：保留上方按鈕
3. 滑動：左滑下個月，右滑上個月
4. 圓餅圖中間：顯示月份（可點擊選擇）
5. 近期紀錄：顯示全部資料

## 需要修改的文件

### 1. app/dashboard/page.tsx
- 添加月份狀態：selectedMonth, showMonthPicker
- 添加月份切換函數：changeMonth()
- 修改滑動邏輯：handleSwipe() 改為切換月份
- 修改數據篩選：按月份篩選圓餅圖數據
- 添加月份選擇器 UI
- 修改滑動提示文字

### 2. components/DashboardChart.tsx  
- 接收 selectedMonth prop
- 在圓餅圖中間顯示月份
- 月份可點擊（觸發 onMonthClick）
- 只顯示該月份的數據

## 實作步驟

### 步驟 1: 添加月份狀態（Dashboard）
```typescript
const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
});
const [showMonthPicker, setShowMonthPicker] = useState(false);
```

### 步驟 2: 添加月份切換函數
```typescript
const changeMonth = (offset: number) => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + offset, 1);
    const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonth);
};
```

### 步驟 3: 修改滑動邏輯
```typescript
const handleSwipe = (direction: 'LEFT' | 'RIGHT') => {
    if (direction === 'LEFT') changeMonth(1);  // 下個月
    if (direction === 'RIGHT') changeMonth(-1); // 上個月
};
```

### 步驟 4: 按月份篩選數據
```typescript
// 篩選當月數據用於圓餅圖
const monthlyExpenses = expenses.filter(e => {
    const expenseMonth = new Date(e.date).toISOString().slice(0, 7);
    return expenseMonth === selectedMonth;
});

const currentTotal = monthlyExpenses
    .filter(e => (e.type || 'EXPENSE') === viewMode)
    .reduce((sum, e) => sum + e.amount, 0);
```

### 步驟 5: 修改 DashboardChart 調用
```typescript
<DashboardChart 
    type={viewMode} 
    data={monthlyExpenses}  // 只傳當月數據
    selectedMonth={selectedMonth}
    onMonthClick={() => setShowMonthPicker(true)}
/>
```

### 步驟 6: 修改滑動提示
```typescript
<div style={{ textAlign: 'center', marginTop: '20px', color: '#C7CEEA', fontSize: '0.8rem' }}>
    ← 滑動切換月份 →
</div>
```

### 步驟 7: 添加月份選擇器 UI
在適當位置添加月份選擇器彈窗

### 步驟 8: 修改 DashboardChart 組件
- 在圓餅圖中間顯示月份
- 添加點擊事件

## 注意事項
- 近期紀錄使用 expenses（全部數據）
- 圓餅圖使用 monthlyExpenses（當月數據）
- 保持現有的排序功能
