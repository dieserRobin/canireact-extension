import browser from 'webextension-polyfill';

export function isProduction(): boolean {
    const manifest = browser.runtime.getManifest();
    return 'update_url' in manifest;
}

export function log(...args: any[]): void {
    const time = new Date().toLocaleTimeString();
    console.log(`${time} [canireact]:`, ...args);
}

export function hasTimeElapsed(uploadedAt: string, hours: number): boolean {
    const uploadedTime = new Date(uploadedAt).getTime();
    const currentTime = new Date().getTime();
    const elapsedHours = (currentTime - uploadedTime) / 1000 / 60 / 60;
    return elapsedHours >= hours;
}