import browser from 'webextension-polyfill';

export function getLanguage(): string | null {
    const countryCode: HTMLElement | null = document.querySelector("#country-code");

    if (countryCode) {
        return countryCode.innerText.trim().toLowerCase();
    }

    return null;
}

export async function getLanguageString(key: string): Promise<string> {
    let language = getLanguage();

    if (!language) {
        language = navigator.language.split('-')[0];
    }

    const src = browser.runtime.getURL(`languages/${language}.json`);
    let languages: { [key: string]: string } = {};

    try {
        const response = await fetch(src);
        if (response.ok) {
            languages = await response.json();
        }
    } catch (error) {
        console.error("Error fetching language file:", error);
    }

    if (!languages[key]) {
        const defaultSrc = browser.runtime.getURL("languages/en.json");
        try {
            const defaultResponse = await fetch(defaultSrc);
            if (defaultResponse.ok) {
                const defaultLanguages = await defaultResponse.json();
                return defaultLanguages[key] ?? key;
            }
        } catch (defaultError) {
            console.error("Error fetching default language file:", defaultError);
        }
    }

    return languages[key] ?? key;
}
