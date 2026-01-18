/**
 * Inbox Flow - Content Script
 * Handles initialization and unread email detection.
 */

(function () {
    console.log('✨ Inbox Flow: Content script initializing...');

    let isInitialized = false;
    let unreadEmails = [];

    /**
     * Safety check to ensure Gmail's core UI components are loaded.
     */
    const isGmailReady = () => {
        const inbox = window.getGmailElement(window.GMAIL_SELECTORS.MAIN_INBOX_CONTAINER);
        const emailRows = window.getAllGmailElements(window.GMAIL_SELECTORS.EMAIL_ROW);
        return !!inbox && emailRows.length > 0;
    };

    /**
     * Scans the current view for unread emails.
     * Uses classes, font-weight, and aria-labels for reliable detection.
     */
    const detectUnreadEmails = () => {
        const rows = window.getAllGmailElements(window.GMAIL_SELECTORS.EMAIL_ROW);
        const currentUnread = [];

        rows.forEach(row => {
            // 1. Check for Gmail's specific unread class (.zE)
            let isUnread = row.classList.contains('zE');

            // 2. Fallback: Check ARIA label for "unread" text
            if (!isUnread) {
                const ariaLabel = row.getAttribute('aria-labelledby') || '';
                // In many cases, the hidden text for screen readers contains "unread"
                const hiddenText = row.querySelector('.yP, .zF')?.getAttribute('aria-label') || '';
                if (hiddenText.toLowerCase().includes('unread')) {
                    isUnread = true;
                }
            }

            // 3. Fallback: Check font-weight of the subject/sender
            if (!isUnread) {
                const subject = row.querySelector(window.GMAIL_SELECTORS.SUBJECT);
                if (subject && window.getComputedStyle(subject).fontWeight >= 700) {
                    isUnread = true;
                }
            }

            if (isUnread) {
                const sender = row.querySelector(window.GMAIL_SELECTORS.SENDER)?.textContent?.trim() || 'Unknown';
                const subject = row.querySelector(window.GMAIL_SELECTORS.SUBJECT)?.textContent?.trim() || 'No Subject';
                const snippet = row.querySelector(window.GMAIL_SELECTORS.SNIPPET)?.textContent?.trim() || '';

                currentUnread.push({
                    id: row.id || Math.random().toString(36).substr(2, 9),
                    sender,
                    subject,
                    snippet
                });
            }
        });

        unreadEmails = currentUnread;
        console.log(`📊 Inbox Flow: Detected ${unreadEmails.length} unread emails.`);

        // Broadcast the update (e.g., to the popup)
        chrome.runtime.sendMessage({
            type: 'UNREAD_EMAILS_UPDATED',
            count: unreadEmails.length,
            emails: unreadEmails
        });
    };

    /**
     * Main initialization logic.
     */
    const startExtension = () => {
        if (isInitialized) return;

        console.log('✅ Inbox Flow: Gmail is ready. Starting features...');
        isInitialized = true;
        document.body.classList.add('inbox-flow-loaded');

        chrome.runtime.sendMessage({
            type: 'CONTENT_SCRIPT_READY',
            url: window.location.href
        });

        // Initial scan
        detectUnreadEmails();

        // Continue observing for changes
        observeGmailChanges();
    };

    /**
     * Observes changes in the Gmail DOM.
     */
    const observeGmailChanges = () => {
        let timeout;
        const observer = new MutationObserver((mutations) => {
            if (!isInitialized && isGmailReady()) {
                startExtension();
                return;
            }

            // Debounce the scan to avoid performance issues during rapid DOM changes
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                if (isInitialized) {
                    detectUnreadEmails();
                }
            }, 1000);
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    };

    // Initial attempt
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        if (isGmailReady()) {
            startExtension();
        } else {
            console.log('⏳ Inbox Flow: Waiting for Gmail UI to settle...');
            observeGmailChanges();
        }
    } else {
        window.addEventListener('DOMContentLoaded', observeGmailChanges);
    }
})();
