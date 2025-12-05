export function getBotQrCodeUrl() {
    // In a real app, this might come from LINE API or config
    // For now, returning a sample QR code or placeholder
    return process.env.NEXT_PUBLIC_BOT_QR_CODE || "https://qr-official.line.me/gs/M/YOUR_BOT_ID_HERE.png";
}
