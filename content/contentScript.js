/**
 * Inbox Flow - Content Script
 * Handles initialization and reliability checks for Gmail's dynamic UI.
 */

(function () {
    console.log('✨ Inbox Flow: Content script initializing...');

    let isInitialized = false;

    /**
     * Safety check to ensure Gmail's core UI components are loaded.
     */
    const isGmailReady = () => {
        const inbox = window.getGmailElement(window.GMAIL_SELECTORS.MAIN_INBOX_CONTAINER);
        const emailRows = window.getAllGmailElements(window.GMAIL_SELECTORS.EMAIL_ROW);
        return !!inbox && emailRows.length > 0;
    };

    /**
     * Main initialization logic for the extension features.
     */
    const startExtension = () => {
        if (isInitialized) return;

        console.log('✅ Inbox Flow: Gmail is ready. Starting features...');
        isInitialized = true;

        // Add a signature class to the body for CSS targeting
        document.body.classList.add('inbox-flow-loaded');

        // Notify background script
        chrome.runtime.sendMessage({
            type: 'CONTENT_SCRIPT_READY',
            url: window.location.href,
            timestamp: new Date().toISOString()
        });

        // Your feature logic starts here
        observeGmailChanges();
    };

    /**
     * Observes changes in the Gmail DOM to handle SPA navigation and dynamic updates.
     */
    const observeGmailChanges = () => {
        const observer = new MutationObserver((mutations) => {
            // Check for initialization if not already done
            if (!isInitialized && isGmailReady()) {
                startExtension();
            }

            // Handle navigation changes (Gmail uses hash routing/pushState)
            // If the primary container is removed/replaced, we might need to re-initialize or update
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
