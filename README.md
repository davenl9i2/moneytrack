# LINE Expense Tracker

LINE 整合的記帳應用程式

## 環境變數設定

複製 `.env.example` 為 `.env` 並填入以下資訊：

```bash
# LINE Bot
LINE_CHANNEL_SECRET=your_channel_secret
LINE_CHANNEL_ACCESS_TOKEN=your_access_token

# LINE LIFF
NEXT_PUBLIC_LIFF_ID=your_liff_id

# Google Gemini API
GOOGLE_API_KEY=your_gemini_api_key

# Database
DATABASE_URL=file:./dev.db
```

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
