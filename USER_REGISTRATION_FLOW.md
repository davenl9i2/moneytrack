# 新使用者註冊流程

## 📋 功能說明

當使用者第一次加入 LINE Bot 時，系統會引導他們先到網頁完成註冊，而不是自動建立帳號。

## 🔄 完整流程

### 1. 使用者加入 LINE Bot 好友

當使用者第一次傳送訊息給 Bot 時：

```
使用者: "午餐 100"
```

### 2. Bot 檢查使用者是否存在

Webhook 會檢查資料庫中是否有該使用者：

```typescript
let user = await prisma.user.findUnique({
    where: { lineUserId },
});

if (!user) {
    // 新使用者 - 引導註冊
}
```

### 3. 引導新使用者註冊

如果是新使用者，Bot 會回覆：

```
👋 歡迎使用記帳小幫手！

您是第一次使用，請先點擊下方連結進入網頁完成註冊：

🔗 https://liff.line.me/YOUR_LIFF_ID

註冊完成後，就可以開始記帳囉！😊
```

### 4. 使用者點擊連結進入網頁

- LIFF 會自動登入使用者的 LINE 帳號
- 取得使用者的 `userId` 和 `displayName`
- 自動呼叫註冊 API

### 5. 自動註冊

網頁會自動呼叫 `/api/users/register`：

```typescript
await fetch('/api/users/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
        userId: profile.userId, 
        displayName: profile.displayName 
    })
});
```

API 會建立使用者帳號：

```typescript
const newUser = await prisma.user.create({
    data: {
        lineUserId: userId,
        displayName: displayName || 'User',
    },
});
```

### 6. 註冊完成

- 使用者可以在網頁上查看儀表板
- 回到 LINE Bot 就可以開始記帳了

## 💬 對話範例

### 場景 1: 新使用者首次使用

```
使用者: "午餐 100"

Bot: 👋 歡迎使用記帳小幫手！

     您是第一次使用，請先點擊下方連結進入網頁完成註冊：

     🔗 https://liff.line.me/1234567890-abcdefgh

     註冊完成後，就可以開始記帳囉！😊
```

### 場景 2: 已註冊使用者

```
使用者: "午餐 100"

Bot: ✅ 記帳成功！
     類型: 支出
     項目: 飲食
     金額: -100
     備註: 無
```

## 🔧 技術實作

### 修改的檔案

1. **`app/api/line/webhook/route.ts`**
   - 移除自動建立使用者的邏輯
   - 新增新使用者檢測和引導訊息

2. **`app/api/users/register/route.ts`** (新增)
   - 處理使用者註冊
   - 檢查使用者是否已存在
   - 建立新使用者帳號

3. **`app/dashboard/page.tsx`**
   - 在 LIFF 初始化後自動呼叫註冊 API
   - 確保使用者帳號存在

### Webhook 邏輯

```typescript
if (!user) {
    // New user - guide them to register via web
    console.log(`🆕 New user detected: ${lineUserId}`);
    
    const liffUrl = process.env.NEXT_PUBLIC_LIFF_ID 
        ? `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}`
        : 'https://your-app-url.onrender.com/dashboard';
    
    await lineClient.replyMessage({
        replyToken,
        messages: [{
            type: 'text',
            text: `👋 歡迎使用記帳小幫手！\n\n您是第一次使用，請先點擊下方連結進入網頁完成註冊：\n\n🔗 ${liffUrl}\n\n註冊完成後，就可以開始記帳囉！😊`,
        }],
    });
    
    return; // Stop processing for new users
}
```

### 註冊 API

```typescript
// Check if user already exists
const existingUser = await prisma.user.findUnique({
    where: { lineUserId: userId },
});

if (existingUser) {
    return NextResponse.json({ 
        message: 'User already exists',
        user: existingUser 
    });
}

// Create new user
const newUser = await prisma.user.create({
    data: {
        lineUserId: userId,
        displayName: displayName || 'User',
    },
});
```

## ✅ 優點

1. **更好的使用者體驗**
   - 使用者知道有網頁介面可以使用
   - 引導使用者完成完整的設定流程

2. **資料一致性**
   - 確保使用者資料完整
   - 避免自動建立不完整的帳號

3. **靈活性**
   - 未來可以在註冊頁面加入更多設定選項
   - 可以收集使用者偏好設定

## 🧪 測試步驟

1. **清除測試使用者資料**
   ```sql
   DELETE FROM User WHERE lineUserId = 'YOUR_TEST_USER_ID';
   ```

2. **在 LINE Bot 傳送訊息**
   - 應該收到註冊引導訊息
   - 不應該新增任何記帳記錄

3. **點擊 LIFF 連結**
   - 應該成功開啟網頁
   - 應該自動登入並註冊

4. **回到 LINE Bot**
   - 再次傳送記帳訊息
   - 應該成功記帳

## 📝 注意事項

1. **LIFF URL 設定**
   - 確保 `.env` 中的 `NEXT_PUBLIC_LIFF_ID` 正確設定
   - 如果沒有設定，會使用預設的 Render URL

2. **重複註冊**
   - API 會檢查使用者是否已存在
   - 如果已存在，會回傳現有使用者資訊
   - 不會建立重複帳號

3. **錯誤處理**
   - 如果註冊失敗，網頁仍會繼續載入
   - 使用者可以重新整理頁面重試

## 🚀 未來優化

1. **註冊頁面**
   - 建立專門的歡迎/註冊頁面
   - 收集使用者偏好設定（預算、分類等）

2. **引導流程**
   - 加入使用教學
   - 提供範例記帳資料

3. **通知**
   - 註冊成功後傳送 LINE 通知
   - 提醒使用者可以開始記帳
