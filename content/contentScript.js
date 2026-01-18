/**
 * Inbox Flow - Content Script
 * Handles initialization, unread email detection, and high-performance dynamic updates.
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
        return !!window.getGmailElement(window.GMAIL_SELECTORS.MAIN_INBOX_CONTAINER);
    };

    /**
     * Extracts unread counts from the Inbox tabs.
     */
    const updateTabCounts = () => {
        const categories = ['Primary', 'Social', 'Promotions', 'Updates', 'Forums'];
        let total = 0;

        categories.forEach(cat => {
            const selector = window.GMAIL_SELECTORS[`TAB_${cat.toUpperCase()}`];
            const tabElement = window.getGmailElement(selector);

            if (tabElement) {
                const countBadge = tabElement.querySelector(window.GMAIL_SELECTORS.UNREAD_COUNT);
                if (countBadge) {
                    const count = parseInt(countBadge.textContent.replace(/,/g, ''), 10) || 0;
                    tabCounts[cat.toLowerCase()] = count;
                    total += count;
                }
            }
        });

        return total;
    };

    /**
     * High-efficiency scan for unread and important emails.
     */
    const detectUnreadEmails = () => {
        const rows = window.getAllGmailElements(window.GMAIL_SELECTORS.EMAIL_ROW);
        if (rows.length === 0) return;

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

                emailData.isImportant = window.IMPORTANCE_RULES.isImportant(emailData);

                if (emailData.isImportant) {
                    row.classList.add('inbox-flow-important-row');
                } else {
                    row.classList.remove('inbox-flow-important-row');
                }

                currentUnread.push(emailData);
            } else {
                row.classList.remove('inbox-flow-important-row');
            }
        });

        unreadEmails = currentUnread;
        const totalUnreadFromTabs = updateTabCounts();

        chrome.runtime.sendMessage({
            type: 'UNREAD_EMAILS_UPDATED',
            totalCount: totalUnreadFromTabs,
            tabCounts: tabCounts,
            visibleUnread: unreadEmails
        });
    };

    /**
     * Initializes features once Gmail is confirmed ready.
     */
    const startExtension = () => {
        if (isInitialized) return;

        console.log('✅ Inbox Flow: Gmail is ready. Starting features...');
        isInitialized = true;
        document.body.classList.add('inbox-flow-loaded');

        chrome.runtime.sendMessage({ type: 'CONTENT_SCRIPT_READY' });

        detectUnreadEmails();
        observeGmailChanges();
    };

    /**
     * Robust MutationObserver for high-performance dynamic updates.
     */
    const observeGmailChanges = () => {
        let debounceTimer;

        const observer = new MutationObserver((mutations) => {
            if (!isInitialized) {
                if (isGmailReady()) startExtension();
                return;
            }

            const hasRelevantChange = mutations.some(mutation => {
                if (mutation.addedNodes.length > 0) return true;
                if (mutation.type === 'attributes' &&
                    (mutation.target.classList?.contains('zA') ||
                        mutation.target.classList?.contains('bsU'))) {
                    return true;
                }
                return false;
            });

            if (hasRelevantChange) {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(detectUnreadEmails, 500);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class']
        });
    };

    /**
     * Message listener for on-demand requests.
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

    // Startup
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        if (isGmailReady()) {
            startExtension();
        } else {
            observeGmailChanges();
        }
    } else {
        window.addEventListener('DOMContentLoaded', observeGmailChanges);
    }
})();
