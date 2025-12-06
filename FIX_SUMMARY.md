# 🛠️ 修復項目總結報告 (Fix Summary Report)

## 1. 查詢日期範圍修正 (Query Date Range Fix)
- **問題**: 詢問「這個月花費」時，LLM 傾向回答「今日花費」，且日期範圍判定不準確。
- **修復**: 
  - 在 `ExpenseService` 中修正了 `Date` 物件的建立邏輯，確保「這個月」的範圍是從本地時間的 `1號 00:00:00` 到 `月底 23:59:59`。
  - 更新 LLM Prompt，明確傳入 Start/End Date，並指示 LLM 根據範圍使用正確的時間用語 (如 "This month" 而非 "Today")。

## 2. 導入 LLM 運作指南 (Operational Guidebook)
- **問題**: System Prompt 過長且難以維護，導致行為不一致。
- **修復**:
  - 建立了 `lib/prompts/LLM_GUIDEBOOK.md`，作為 LLM 的「工具書」。
  - 集中管理所有意圖 (RECORD, QUERY, MODIFY) 的判斷規則與 JSON 輸出格式。
  - 程式碼重構為讀取此 Markdown 文件作為 System Context，大幅提升指令遵循度。

## 3. 修正「修改紀錄」邏輯 (Implicit Modification Fix)
- **問題**: 使用者說「打錯了，是600」時，LLM 會嘗試根據日期猜測要改哪一筆，經常錯誤地選擇了舊的紀錄（因為日期是今天）而忽略了剛輸入但日期標為昨天的紀錄。
- **修復**:
  - 在 Guidebook 中強制規定：對於「隱式修正」(未指名道姓的修改)，LLM **必須** 將 `targetId` 設為 `null`。
  - 後端程式碼在收到 `null` 時，會自動使用 `ID` 排序 (Database Primary Key)，抓取絕對最新的那一筆紀錄進行修改，確保 100% 準確。

## 4. 投資與收入計算修正 (Investment & Income Logic Fix)
- **問題**: 記錄「投資賺了 15000」後，詢問「花費多少」時，系統將這筆錢加進了總額，導致支出暴增。
- **修復**:
  - **Guidebook 更新**: 定義「賺、獲利、股息」等關鍵字為 `INCOME` 類型。
  - **統計邏輯更新**: 在 `groq.ts` 與 `expense.ts` 中，將 `Total Income` 與 `Total Expense` 分開計算。
  - 無論 LLM 回傳什麼類型的查詢結果，系統現在都能正確區分「流入」與「流出」，不會再將收入誤算為支出。

---
✅ **目前狀態**: 所有功能皆已測試通過並推送到 `main` 分支。
