/**
 * Inbox Flow - Content Script
 * Handles initialization, unread email detection, and visual highlighting.
 */

(function () {
    console.log('✨ Inbox Flow: Content script initializing...');

    let isInitialized = false;
    let unreadEmails = [];
    let tabCounts = {
        primary: 0,
        social: 0,
        promotions: 0,
        updates: 0,
        forums: 0
    };

    /**
     * Safety check to ensure Gmail's core UI components are loaded.
     */
    const isGmailReady = () => {
        const inbox = window.getGmailElement(window.GMAIL_SELECTORS.MAIN_INBOX_CONTAINER);
        return !!inbox;
    };

    /**
     * Extracts unread counts from the Inbox tabs (Primary, Social, etc.)
     */
    const updateTabCounts = () => {
        const categories = ['Primary', 'Social', 'Promotions', 'Updates', 'Forums'];
        let total = 0;

        categories.forEach(cat => {
            const selector = window.GMAIL_SELECTORS[`TAB_${cat.toUpperCase()}`];
            const tabElement = window.getGmailElement(selector);

            if (tabElement) {
                const countBadge = tabElement.querySelector(window.GMAIL_SELECTORS.UNREAD_COUNT);
                const count = countBadge ? parseInt(countBadge.textContent.replace(/,/g, ''), 10) || 0 : 0;

                tabCounts[cat.toLowerCase()] = count;
                total += count;
            }
        });

        return total;
    };

    /**
     * Scans the current view for unread email details and assess importance.
     */
    const detectUnreadEmails = () => {
        const rows = window.getAllGmailElements(window.GMAIL_SELECTORS.EMAIL_ROW);
        const currentUnread = [];

        rows.forEach(row => {
            let isUnread = row.classList.contains('zE');

            if (!isUnread) {
                const hiddenText = row.querySelector('.yP, .zF')?.getAttribute('aria-label') || '';
                if (hiddenText.toLowerCase().includes('unread')) {
                    isUnread = true;
                }
            }

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

                const emailData = {
                    id: row.id || Math.random().toString(36).substr(2, 9),
                    sender,
                    subject,
                    snippet
                };

                // Use the rule engine to determine importance
                emailData.isImportant = window.IMPORTANCE_RULES.isImportant(emailData);

                // Apply or remove highlighting based on importance
                if (emailData.isImportant) {
                    row.classList.add('inbox-flow-important-row');
                } else {
                    row.classList.remove('inbox-flow-important-row');
                }

                currentUnread.push(emailData);
            } else {
                // Remove highlight if email is read
                row.classList.remove('inbox-flow-important-row');
            }
        });

        unreadEmails = currentUnread;
        const totalUnreadFromTabs = updateTabCounts();

        // Broadcast the update proactively
        chrome.runtime.sendMessage({
            type: 'UNREAD_EMAILS_UPDATED',
            totalCount: totalUnreadFromTabs,
            tabCounts: tabCounts,
            visibleUnread: unreadEmails
        });
    };

    /**
     * Listen for messages from the popup or background script.
     */
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.type === 'GET_UNREAD_COUNTS') {
            const total = updateTabCounts();
            sendResponse({
                total: total,
                primary: tabCounts.primary,
                social: tabCounts.social,
                promotions: tabCounts.promotions,
                updates: tabCounts.updates,
                forums: tabCounts.forums,
                visibleUnread: unreadEmails
            });
        }
        return true;
    });

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

        detectUnreadEmails();
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
