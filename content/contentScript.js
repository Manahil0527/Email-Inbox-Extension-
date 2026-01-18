console.log('Inbox Flow: Content script loaded');

// Demonstrate usage of centralized selectors
const initializeExtension = () => {
    const unreadCountElement = window.getGmailElement(window.GMAIL_SELECTORS.UNREAD_COUNT);
    if (unreadCountElement) {
        console.log('Current Unread Count:', unreadCountElement.textContent);
    }

    const emailRows = window.getAllGmailElements(window.GMAIL_SELECTORS.EMAIL_ROW);
    console.log(`Found ${emailRows.length} email rows on page`);
};

// Gmail is a single-page app, so we might need to wait for elements to load
const observer = new MutationObserver(() => {
    if (window.getGmailElement(window.GMAIL_SELECTORS.MAIN_INBOX_CONTAINER)) {
        initializeExtension();
        // We could disconnect here if we only want to run once, 
        // but Gmail transitions often need continuous observation.
    }
});

observer.observe(document.body, { childList: true, subtree: true });

chrome.runtime.sendMessage({ type: 'CONTENT_SCRIPT_LOADED' });
