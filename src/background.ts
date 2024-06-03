import browser, { Runtime } from 'webextension-polyfill';

interface RequestMessage {
    message: string;
    url: string;
    method: string;
    data?: any;
}

const CACHE_EXPIRATION = 24 * 60 * 60 * 1000; // 24 hours

const sendRequestToServer = (url: string, method: string, data?: any): Promise<any> => {
    return fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: data ? JSON.stringify(data) : null
    })
        .then(response => response.json())
        .then(responseData => {
            setCachedData(url, responseData);
            return responseData;
        })
        .catch(error => {
            console.error(error);
            throw error;
        });
};

const getCachedData = async (cacheKey: string) => {
    try {
        const result = await browser.storage.local.get(cacheKey);
        const cachedData = result[cacheKey];
        if (cachedData) {
            const { data, timestamp } = cachedData;
            if (new Date().getTime() - timestamp < CACHE_EXPIRATION) {
                return data;
            }
            await browser.storage.local.remove(cacheKey);
        }
        return null;
    } catch (error) {
        console.error("Error getting cached data:", error);
        return null;
    }
};

const setCachedData = async (cacheKey: string, data: any) => {
    const cacheItem = { data, timestamp: new Date().getTime() };
    try {
        await browser.storage.local.set({ [cacheKey]: cacheItem });
        console.log(`Cache set for key: ${cacheKey}`);
    } catch (error) {
        console.error("Error setting cache:", error);
    }
};

browser.runtime.onConnect.addListener((port) => {
    port.onMessage.addListener(msg => {
        console.log(msg);
    });
});

browser.runtime.onMessage.addListener((request: RequestMessage, sender: Runtime.MessageSender, sendResponse: (response?: any) => void) => {
    if (request.message === "sendRequest") {
        const cacheKey = `cache_${request.url}`;

        getCachedData(cacheKey)
            .then(cachedData => {
                if (cachedData) {
                    console.log('Using cached data');
                    sendResponse({ success: true, data: cachedData });
                } else {
                    console.log('Fetching new data');
                    sendRequestToServer(request.url, request.method, request.data)
                        .then(data => {
                            sendResponse({ success: true, data });
                        })
                        .catch(error => {
                            sendResponse({ success: false, error: error.toString() });
                        });
                }
            })
            .catch(error => {
                sendResponse({ success: false, error: error.toString() });
            });

        return true; // Keeps the message channel open for sendResponse
    }
});