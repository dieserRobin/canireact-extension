import browser from 'webextension-polyfill';

export function getLanguage() {
    return browser.i18n.getUILanguage().split("-")[0];
}

export function getLanguageString(key: string) {
    return browser.i18n.getMessage(key);
}
