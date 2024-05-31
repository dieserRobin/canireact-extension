import browser from 'webextension-polyfill';

export function isProduction(): boolean {
    const manifest = browser.runtime.getManifest();
    return 'update_url' in manifest;
}

export function log(...args: any[]): void {
    const time = new Date().toLocaleTimeString();
    console.log(`${time} [canireact]:`, ...args);
}