# 小金庫 (Little Treasure)

LINE 整合的智能記帳應用程式 💰

## 環境變數設定

複製 `.env.example` 為 `.env` 並填入以下資訊：

```bash
# LINE Bot
LINE_CHANNEL_SECRET=your_channel_secret
LINE_CHANNEL_ACCESS_TOKEN=your_access_token

# LINE LIFF
NEXT_PUBLIC_LIFF_ID=your_liff_id

# Groq API (for LLM parsing)
GROQ_API_KEY=your_groq_api_key

# Database
DATABASE_URL=file:./dev.db
```

## 功能特色

### 📝 智能記帳
透過 LINE Bot 輸入自然語言即可記帳：
- `午餐 100` - 自動識別為飲食支出
- `薪水 50000` - 自動識別為收入
- `買書 350` - 自動分類

### 🔍 智能查詢 ✨ 新功能
詢問歷史消費記錄，LLM 會自動查詢並統計：
- `我昨天花多少錢?`
- `這個月的支出是多少?`
- `上週的交通費`
- `本月收入多少?`

查詢結果包含：
- 總額統計
- 筆數統計
- 前三大分類明細

### 📊 視覺化儀表板
- 圓餅圖顯示支出分類
- 月份切換功能
- 收入/支出切換
- 最近記錄列表

詳細查詢功能說明請參考 [QUERY_FEATURE.md](./QUERY_FEATURE.md)


## 本地開發

```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

## 部署到 Render

1. 將程式碼推送到 GitHub
2. 在 Render 建立新的 Web Service
3. 連接您的 GitHub repository
4. 設定環境變數（同上）
5. Build Command: `npm install && npx prisma generate && npx prisma db push && npm run build`
6. Start Command: `npm start`

## LINE LIFF 設定

1. 前往 [LINE Developers Console](https://developers.line.biz/)
2. 選擇您的 Provider 和 Channel
3. 進入 LIFF 頁面
4. 新增 LIFF app:
   - Endpoint URL: `https://your-render-url.onrender.com/dashboard`
   - Size: Full
   - Scope: `profile`, `openid`
5. 複製 LIFF ID 到環境變數 `NEXT_PUBLIC_LIFF_ID`
