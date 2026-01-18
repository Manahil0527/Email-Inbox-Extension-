document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const totalCountEl = document.getElementById('total-count');
    const primaryCountEl = document.getElementById('primary-count');
    const socialCountEl = document.getElementById('social-count');
    const promotionsCountEl = document.getElementById('promotions-count');
    const statusIndicator = document.getElementById('gmail-status');
    const statusBanner = document.getElementById('status-banner');
    const statusText = document.getElementById('status-text');
    const refreshBtn = document.getElementById('refresh-data');

    /**
     * Updates the status banner with a message and optional error state.
     */
    const showStatus = (message, isError = false) => {
        statusBanner.classList.remove('hidden');
        statusBanner.classList.toggle('error', isError);
        statusText.textContent = message;
    };

    const hideStatus = () => {
        statusBanner.classList.add('hidden');
    };

    /**
     * Updates the UI with counts from the content script.
     */
    const updateUI = (data) => {
        if (!data) return;

        hideStatus();
        animateCount(totalCountEl, data.total || 0);
        animateCount(primaryCountEl, data.primary || 0);
        animateCount(socialCountEl, data.social || 0);
        animateCount(promotionsCountEl, data.promotions || 0);

        statusIndicator.classList.add('active');
        statusIndicator.title = 'Connected to Gmail';
    };

    /**
     * Simple animation for counting numbers.
     */
    const animateCount = (el, target) => {
        const start = parseInt(el.textContent, 10) || 0;
        const duration = 500;
        let startTime = null;

        const animation = (currentTime) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);
            const current = Math.floor(progress * (target - start) + start);
            el.textContent = current;
            if (progress < 1) {
                requestAnimationFrame(animation);
            }
        };
        requestAnimationFrame(animation);
    };

    /**
     * Request fresh counts from the content script.
     */
    const fetchData = () => {
        totalCountEl.textContent = '...';
        showStatus('Fetching latest data...');

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const currentTab = tabs[0];

            if (currentTab?.url && currentTab.url.includes('mail.google.com')) {
                chrome.tabs.sendMessage(currentTab.id, { type: 'GET_UNREAD_COUNTS' }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.warn('Communication error:', chrome.runtime.lastError.message);
                        statusIndicator.classList.remove('active');
                        showStatus('Gmail is loading or script not ready...', true);
                        totalCountEl.textContent = '0';
                        return;
                    }

                    if (response) {
                        updateUI(response);
                    } else {
                        showStatus('No response from Gmail page.', true);
                        totalCountEl.textContent = '0';
                    }
                });
            } else {
                statusIndicator.classList.remove('active');
                showStatus('Please open your Gmail tab', true);
                totalCountEl.textContent = '--';
                [primaryCountEl, socialCountEl, promotionsCountEl].forEach(el => el.textContent = '--');
            }
        });
    };

    // Initial fetch
    fetchData();

    // Refresh button event
    refreshBtn.addEventListener('click', () => {
        refreshBtn.classList.add('loading');
        fetchData();
        setTimeout(() => refreshBtn.classList.remove('loading'), 500);
    });

    // Listen for proactive updates from content script
    chrome.runtime.onMessage.addListener((message) => {
        if (message.type === 'UNREAD_EMAILS_UPDATED') {
            updateUI({
                total: message.totalCount,
                primary: message.tabCounts.primary,
                social: message.tabCounts.social,
                promotions: message.tabCounts.promotions
            });
        }
    });
});
