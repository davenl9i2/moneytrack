# 查詢功能除錯指南

## 🐛 問題診斷

### 問題 1: 查詢時新增了 0 元記錄
**原因**: LLM 沒有正確識別為 QUERY intent，或者 amount 沒有設為 0

**解決方案**:
1. ✅ 已在 webhook 加入驗證：如果 intent 是 RECORD 但 amount 為 0，會拒絕並提示使用者
2. ✅ 已更新 LLM prompt，強調 QUERY intent 必須設 amount = 0
3. ✅ 加入詳細的 console.log 來追蹤 intent 識別

### 問題 2: 查詢時回覆「無資料」但網頁有記錄
**可能原因**:
1. 日期範圍問題（時區、結束時間）
2. userId 不匹配
3. 查詢條件太嚴格

**解決方案**:
1. ✅ 已修正 queryEndDate 設為當天結束時間 (23:59:59.999)
2. ✅ 加入詳細的查詢條件 logging
3. ✅ 顯示找到的記錄數量

## 📊 Debug Logging

現在 webhook 會輸出以下 debug 資訊：

```
📋 Parsed Data: {完整的 LLM 回應 JSON}
🎯 Intent detected: QUERY
🔍 Processing QUERY intent...
📅 Query start date: 2025-12-05
📅 Query end date: 2025-12-05 (adjusted to end of day)
📊 Query type: EXPENSE
🔎 Query where clause: {完整的查詢條件}
✅ Found 8 records
💬 Sending reply: {回覆內容}
```

## 🔍 檢查步驟

### 1. 檢查 LLM 解析結果
查看 server log 中的 `📋 Parsed Data`，確認：
- ✅ `intent` 是否為 `"QUERY"`
- ✅ `amount` 是否為 `0`
- ✅ `queryStartDate` 和 `queryEndDate` 是否正確
- ✅ `queryType` 是否符合預期

### 2. 檢查查詢條件
查看 `🔎 Query where clause`，確認：
- ✅ `userId` 是否正確
- ✅ `date` 範圍是否包含目標日期
- ✅ `type` 是否正確（EXPENSE/INCOME）
- ✅ `category` 是否正確（如果有指定）

### 3. 檢查資料庫記錄
確認資料庫中確實有符合條件的記錄：
- 使用者 ID 相同
- 日期在範圍內
- 類型匹配
- 分類匹配（如果有指定）

## 🧪 測試案例

### 測試 1: 基本查詢
```
輸入: "我今天花多少錢?"
預期 LLM 輸出:
{
  "intent": "QUERY",
  "amount": 0,
  "queryStartDate": "2025-12-06",
  "queryEndDate": "2025-12-06",
  "queryType": "EXPENSE",
  ...
}
```

### 測試 2: 月份查詢
```
輸入: "這個月的支出"
預期 LLM 輸出:
{
  "intent": "QUERY",
  "amount": 0,
  "queryStartDate": "2025-12-01",
  "queryEndDate": "2025-12-31",
  "queryType": "EXPENSE",
  ...
}
```

### 測試 3: 分類查詢
```
輸入: "上週的交通費"
預期 LLM 輸出:
{
  "intent": "QUERY",
  "amount": 0,
  "queryStartDate": "2025-11-29",
  "queryEndDate": "2025-12-05",
  "queryType": "EXPENSE",
  "category": "交通",
  ...
}
```

### 測試 4: 記帳（不應該是 QUERY）
```
輸入: "午餐 100"
預期 LLM 輸出:
{
  "intent": "RECORD",
  "amount": 100,
  "category": "飲食",
  "type": "EXPENSE",
  ...
}
```

## 🔧 常見問題

### Q1: 為什麼查詢「昨天」找不到資料？
**A**: 檢查：
1. 資料庫中的記錄日期是否真的是昨天
2. LLM 是否正確解析「昨天」的日期
3. 時區設定是否正確

### Q2: 為什麼查詢「這個月」只顯示部分資料？
**A**: 檢查：
1. `queryEndDate` 是否設為月底最後一天
2. 是否有 `type` 或 `category` 篩選條件限制了結果

### Q3: 為什麼有時候會新增 0 元記錄？
**A**: 
- ✅ 已修正：現在會驗證 amount，如果是 0 會拒絕並提示使用者
- 檢查 LLM 是否正確識別 intent

## 📝 改進建議

1. **更多測試案例**: 測試各種時間表達方式
2. **錯誤處理**: 當查詢失敗時提供更詳細的錯誤訊息
3. **查詢優化**: 加入快取機制提升查詢速度
4. **使用者回饋**: 如果查詢結果為空，建議使用者調整查詢條件

## 🚀 下次測試時

請在 LINE Bot 中測試以下訊息，並查看 server log：

1. "我今天花多少錢?" - 應該是 QUERY
2. "午餐 100" - 應該是 RECORD
3. "這個月的交通費" - 應該是 QUERY
4. "昨天花了多少" - 應該是 QUERY
5. "本月收入" - 應該是 QUERY

每次測試後檢查：
- ✅ Intent 是否正確
- ✅ 是否新增了不該新增的記錄
- ✅ 查詢結果是否正確
- ✅ 回覆訊息是否符合預期
