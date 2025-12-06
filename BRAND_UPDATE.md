# 小金庫 - 品牌更新總結

## 🎯 更新內容

### 1. Bot 名稱
- **舊名稱**: 記帳小幫手
- **新名稱**: 小金庫 (Little Treasure) 💰

### 2. LIFF URL
- **正式 URL**: `https://liff.line.me/2008640057-D5PyLKZv`

---

## 📝 修改的檔案

### 1. `lib/groq.ts` - LLM System Prompt
**更新內容**:
```typescript
You are "小金庫" (Little Treasure), an AI assistant for a personal accounting LINE bot. 
Your role is to parse user messages into structured financial data JSON or handle queries.
You are friendly, helpful, and use a warm, conversational tone in Traditional Chinese.
```

**影響**: LLM 現在知道自己是「小金庫」，回覆會更有個性和一致性

---

### 2. `app/api/line/webhook/route.ts` - 歡迎訊息

#### 新使用者歡迎訊息
```
👋 歡迎使用小金庫！

您是第一次使用，請先點擊下方連結進入網頁完成註冊：

🔗 https://liff.line.me/2008640057-D5PyLKZv

註冊完成後，就可以開始記帳囉！💰
```

#### CHAT Intent 預設回覆
```
您好！我是小金庫 💰
您的貼心記帳小幫手～
```

---

### 3. `README.md` - 專案標題
```markdown
# 小金庫 (Little Treasure)

LINE 整合的智能記帳應用程式 💰
```

---

## 💬 使用者體驗改善

### 對話範例

**場景 1: 新使用者**
```
使用者: 你好
Bot: 👋 歡迎使用小金庫！
     您是第一次使用，請先點擊下方連結進入網頁完成註冊：
     🔗 https://liff.line.me/2008640057-D5PyLKZv
     註冊完成後，就可以開始記帳囉！💰
```

**場景 2: 一般對話**
```
使用者: 你好
Bot: 您好！我是小金庫 💰
     您的貼心記帳小幫手～
```

**場景 3: 記帳**
```
使用者: 午餐 100
Bot: ✅ 記帳成功！
     類型: 支出
     項目: 飲食
     金額: -100
     備註: 無
```
*註: LLM 的回覆會更友善和個性化*

**場景 4: 查詢**
```
使用者: 我今天花多少錢?
Bot: 📊 查詢結果

     支出總額: $350
     筆數: 3

     主要分類:
     飲食: $200
     交通: $100
     其他: $50
```

---

## 🎨 品牌個性

### 小金庫的特色
- **友善溫暖** - 使用親切的語氣
- **專業可靠** - 準確記錄每一筆帳
- **智能貼心** - 理解自然語言，主動提供幫助
- **視覺識別** - 💰 金庫圖示

### 語氣風格
- 使用「您」而非「你」，更有禮貌
- 加入適當的表情符號 (💰, 😊, 📊, ✅)
- 簡潔明瞭，不囉嗦
- 正面鼓勵的語氣

---

## 🔧 技術細節

### LIFF URL 設定
- **環境變數**: `NEXT_PUBLIC_LIFF_ID=2008640057-D5PyLKZv`
- **完整 URL**: `https://liff.line.me/2008640057-D5PyLKZv`
- **Fallback**: 如果環境變數未設定，使用完整 URL

### System Prompt 優化
- 明確定義 Bot 身份
- 強調友善和溫暖的語氣
- 使用繁體中文
- 保持專業性

---

## ✅ 檢查清單

部署前確認：
- [ ] `.env` 中設定 `NEXT_PUBLIC_LIFF_ID=2008640057-D5PyLKZv`
- [ ] 測試新使用者歡迎訊息
- [ ] 測試 LIFF URL 是否正確開啟
- [ ] 測試 LLM 回覆是否使用「小金庫」名稱
- [ ] 測試一般對話的預設回覆

---

## 📱 使用者旅程

1. **加入好友** → 收到歡迎訊息
2. **點擊連結** → 開啟 LIFF 網頁
3. **自動註冊** → 建立帳號
4. **開始記帳** → 使用自然語言記帳
5. **查詢統計** → 詢問消費記錄
6. **查看儀表板** → 在網頁查看圖表

---

**更新日期**: 2025-12-06  
**版本**: v1.2.0  
**狀態**: ✅ 已完成
