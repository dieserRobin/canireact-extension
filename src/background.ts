import browser, { Runtime } from 'webextension-polyfill';

interface RequestMessage {
    message: string;
    url: string;
    method: string;
    data?: any;
}

const sendRequestToServer = (url: string, method: string, data?: any): Promise<any> => {
    return fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: data ? JSON.stringify(data) : null
    })
        .then(response => {
            console.log(response);
            return response.json();
        })
        .catch(error => {
            console.error(error);
            throw error;
        });
};

chrome.runtime.onConnect.addListener((port) => {
    port.onMessage.addListener(msg => {
        console.log(msg);
    })
});

browser.runtime.onMessage.addListener((request: RequestMessage, sender: Runtime.MessageSender, sendResponse: (response?: any) => void) => {
    switch (request.message) {
        case "sendRequest":
            sendRequestToServer(request.url, request.method, request.data)
                .then(data => {
                    sendResponse({ success: true, data });
                })
                .catch(error => {
                    sendResponse({ success: false, error: error.toString() });
                });

            return true;
        default:
            break;
    }
});
