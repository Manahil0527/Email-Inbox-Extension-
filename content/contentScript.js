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
     * Injects premium fonts into the Gmail document.
     */
    const injectFonts = () => {
        if (document.getElementById('inbox-flow-fonts')) return;
        const link = document.createElement('link');
        link.id = 'inbox-flow-fonts';
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600&display=swap';
        document.head.appendChild(link);
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
     * High-efficiency scan for emails.
     */
    const scanEmails = () => {
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

            const senderArea = row.querySelector(window.GMAIL_SELECTORS.SENDER);
            const subjectArea = row.querySelector(window.GMAIL_SELECTORS.SUBJECT);
            const snippetArea = row.querySelector(window.GMAIL_SELECTORS.SNIPPET);

            const sender = senderArea?.innerText?.trim() || senderArea?.textContent?.trim() || 'Unknown';
            const subject = subjectArea?.innerText?.trim() || subjectArea?.textContent?.trim() || 'No Subject';
            const snippet = snippetArea?.innerText?.trim() || snippetArea?.textContent?.trim() || '';

            const emailData = {
                id: row.id || Math.random().toString(36).substr(2, 9),
                sender,
                subject,
                snippet,
                isUnread
            };

            const isImportant = window.IMPORTANCE_RULES.isImportant(emailData);

            if (isImportant) {
                row.classList.add('inbox-flow-important-row');
            } else {
                row.classList.remove('inbox-flow-important-row');
            }

            if (isUnread) {
                currentUnread.push(emailData);
            }
        });

        unreadEmails = currentUnread;
        const totalUnreadFromTabs = updateTabCounts();

        if (chrome.runtime && chrome.runtime.id) {
            chrome.runtime.sendMessage({
                type: 'UNREAD_EMAILS_UPDATED',
                totalCount: totalUnreadFromTabs,
                tabCounts: tabCounts,
                visibleUnread: unreadEmails
            }).catch(() => { });
        }
    };

    /**
     * Initializes features once Gmail is confirmed ready.
     */
    const startExtension = () => {
        if (isInitialized) return;

        console.log('✅ Inbox Flow: Total Makeover Active.');
        isInitialized = true;
        document.body.classList.add('inbox-flow-loaded');
        injectFonts();

        if (chrome.runtime && chrome.runtime.id) {
            chrome.runtime.sendMessage({ type: 'CONTENT_SCRIPT_READY' }).catch(() => { });
        }

        scanEmails();
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
                debounceTimer = setTimeout(scanEmails, 500);
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
     * Message listener.
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
