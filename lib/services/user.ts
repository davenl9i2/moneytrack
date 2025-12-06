import { prisma } from '@/lib/prisma';
import { lineClient } from '@/lib/line';
import { TextMessage } from '@line/bot-sdk';

/**
 * 驗證使用者是否存在，若不存在則回傳引導註冊訊息
 */
export async function getUserOrInviteRegister(lineUserId: string, replyToken: string): Promise<{ user: any, shouldStop: boolean }> {
    const user = await prisma.user.findUnique({
        where: { lineUserId },
    });

    if (!user) {
        // User not found, send registration invitation
        const registerUrl = `https://liff.line.me/${process.env.LINE_LIFF_ID}`;
        const welcomeMessage: TextMessage = {
            type: 'text',
            text: `歡迎使用小金庫！✨\n\n我需要先認識你才能幫你記帳喔。\n請點擊下方連結進行「一鍵註冊」：\n\n${registerUrl}\n\n(註冊只需 3 秒鐘！)`
        };

        await lineClient.replyMessage({
            replyToken,
            messages: [welcomeMessage]
        });
        return { user: null, shouldStop: true }; // Stop processing
    }

    return { user, shouldStop: false };
}
