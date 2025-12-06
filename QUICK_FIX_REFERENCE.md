# 🔧 快速修復參考

## 問題 ❌

### 1. 查詢時新增 0 元記錄
```
使用者: "我昨天花多少錢?"
系統: ✅ 記帳成功！金額: $0  ← 錯誤！
資料庫: 新增了一筆 0 元記錄
```

### 2. 查詢回覆無資料
```
使用者: "今天花了多少"
系統: 📊 查詢結果 - 無資料  ← 錯誤！
實際: 資料庫中有記錄
```

---

## 修復 ✅

### 1. 防止 0 元記錄
```typescript
// webhook/route.ts
if (intent === 'RECORD') {
    if (!amount || amount === 0) {
        // 拒絕並提示使用者
        return;
    }
    // 只有有效金額才儲存
}
```

### 2. 修正日期範圍
```typescript
// webhook/route.ts
if (queryEndDate) {
    const endDate = new Date(queryEndDate);
    endDate.setHours(23, 59, 59, 999); // 包含當天結束
    where.date.lte = endDate;
}
```

### 3. 改進 LLM Prompt
```typescript
// lib/groq.ts
"amount": number (MUST be 0 for QUERY and CHAT intents)
Keywords indicating QUERY: "多少", "花了", "收入", "支出", "?"
```

---

## 測試 🧪

### 快速測試命令
```bash
node scripts/quick-test.js
```

### 手動測試案例
| 輸入 | 預期 Intent | 預期 Amount | 應該新增記錄? |
|------|-------------|-------------|---------------|
| "午餐 100" | RECORD | 100 | ✅ 是 |
| "我今天花多少?" | QUERY | 0 | ❌ 否 |
| "昨天花了多少" | QUERY | 0 | ❌ 否 |
| "這個月交通費" | QUERY | 0 | ❌ 否 |

---

## Debug 📊

### 查看 Server Log
```
📋 Parsed Data: {...}        ← LLM 完整回應
🎯 Intent detected: QUERY    ← 識別的意圖
✅ Found 8 records           ← 查詢結果數量
💬 Sending reply: ...        ← 回覆內容
```

### 關鍵檢查點
1. ✅ Intent 是否正確 (QUERY vs RECORD)
2. ✅ Amount 是否為 0 (查詢時)
3. ✅ 日期範圍是否包含目標日期
4. ✅ 是否有不該新增的記錄

---

## 檔案清單 📁

| 檔案 | 修改內容 |
|------|----------|
| `lib/groq.ts` | 改進 LLM prompt |
| `app/api/line/webhook/route.ts` | 修正查詢邏輯、加入驗證 |
| `DEBUG_GUIDE.md` | 除錯指南 |
| `FIX_SUMMARY.md` | 完整修復說明 |
| `scripts/quick-test.js` | 測試腳本 |

---

## 下一步 🚀

1. [ ] 在 LINE Bot 測試查詢功能
2. [ ] 確認不會新增 0 元記錄
3. [ ] 檢查 server log 輸出
4. [ ] 驗證日期範圍查詢正確
5. [ ] 部署到 Render

---

**需要幫助?** 查看 `DEBUG_GUIDE.md`
