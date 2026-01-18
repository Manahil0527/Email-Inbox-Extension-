chrome.runtime.onInstalled.addListener(() => {
    console.log('Inbox Flow: Extension installed');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'CONTENT_SCRIPT_LOADED') {
        console.log('Inbox Flow: Content script reported for tab:', sender.tab.id);
    }
});
