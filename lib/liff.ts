// LIFF utility functions
import liff from '@line/liff';

const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID || '';

export async function initializeLiff() {
    try {
        await liff.init({ liffId: LIFF_ID });
        return true;
    } catch (error) {
        console.error('LIFF initialization failed:', error);
        return false;
    }
}

export function isLoggedIn() {
    return liff.isLoggedIn();
}

export async function login() {
    if (!liff.isLoggedIn()) {
        liff.login();
    }
}

export async function getUserProfile() {
    try {
        const profile = await liff.getProfile();
        return {
            userId: profile.userId,
            displayName: profile.displayName,
            pictureUrl: profile.pictureUrl,
        };
    } catch (error) {
        console.error('Failed to get user profile:', error);
        return null;
    }
}

export function logout() {
    if (liff.isLoggedIn()) {
        liff.logout();
        window.location.reload();
    }
}

export function isInClient() {
    return liff.isInClient();
}
