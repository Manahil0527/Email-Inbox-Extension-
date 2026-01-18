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
     * Uses class-first detection to avoid layout thrashing.
     */
    const detectUnreadEmails = () => {
        const rows = window.getAllGmailElements(window.GMAIL_SELECTORS.EMAIL_ROW);
        if (rows.length === 0) return;

        const currentUnread = [];

        rows.forEach(row => {
            // 1. Check for Gmail's unread class - FASTEST
            let isUnread = row.classList.contains('zE');

            // 2. Fallback to ARIA labels if class is missing but row looks unread
            if (!isUnread) {
                const hiddenText = row.querySelector('.yP, .zF')?.getAttribute('aria-label') || '';
                if (hiddenText.toLowerCase().includes('unread')) {
                    isUnread = true;
                }
            }

            // 3. Last resort: Style check (Avoid if possible)
            if (!isUnread) {
                const subject = row.querySelector(window.GMAIL_SELECTORS.SUBJECT);
                // We only check style if we haven't found unread status yet
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

                // Apply visual highlighting
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

        // Proactive update to listeners
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
     * Watches for new rows and tab count changes.
     */
    const observeGmailChanges = () => {
        let debounceTimer;

        const observer = new MutationObserver((mutations) => {
            if (!isInitialized) {
                if (isGmailReady()) startExtension();
                return;
            }

            // Check if any mutation is relevant to avoid unnecessary scans
            const hasRelevantChange = mutations.some(mutation => {
                // If nodes were added, check if they are (or contain) email rows
                if (mutation.addedNodes.length > 0) return true;

                // If attributes changed (like unread state classes)
                if (mutation.type === 'attributes' &&
                    (mutation.target.classList?.contains('zA') ||
                        mutation.target.classList?.contains('bsU'))) {
                    return true;
                }

                return false;
            });

            if (hasRelevantChange) {
                clearTimeout(debounceTimer);
                // Lower debounce time (500ms) for better responsiveness during scroll
                debounceTimer = setTimeout(detectUnreadEmails, 500);
            }
        });

        // Watch the whole body but filtered by the logic above for efficiency
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class'] // We care about class changes for unread status
        });
    };

    // Initial load handler
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        if (isGmailReady()) {
            startExtension();
        } else {
            console.log('⏳ Inbox Flow: Waiting for Gmail UI...');
            observeGmailChanges();
        }
    } else {
        window.addEventListener('DOMContentLoaded', observeGmailChanges);
    }
})();
