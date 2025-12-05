import { messagingApi } from "@line/bot-sdk";

const channelAccessToken = process.env.LINE_ACCESS_TOKEN || '';

export const lineClient = new messagingApi.MessagingApiClient({
    channelAccessToken,
});
