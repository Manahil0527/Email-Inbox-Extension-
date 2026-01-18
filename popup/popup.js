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
        document.getElementById('status-icon').textContent = isError ? '⚠️' : '✨';
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
        statusIndicator.title = 'Connected to Gmail Dashboard';

        // Trigger a subtle scale animation on the hero card
        const heroCard = document.querySelector('.main-stats-card');
        heroCard.style.transform = 'scale(1.02)';
        setTimeout(() => heroCard.style.transform = 'translateY(0)', 300);
    };

    /**
     * Refined count animation with easing.
     */
    const animateCount = (el, target) => {
        const start = parseInt(el.textContent, 10) || 0;
        if (start === target) return;

        const duration = 800;
        let startTime = null;

        const easeOutExpo = (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

        const animation = (currentTime) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);
            const easedProgress = easeOutExpo(progress);
            const current = Math.floor(easedProgress * (target - start) + start);

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
        totalCountEl.parentElement.classList.add('loading-pulse');
        showStatus('Analyzing Inbox...');

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const currentTab = tabs[0];

            if (currentTab?.url && currentTab.url.includes('mail.google.com')) {
                chrome.tabs.sendMessage(currentTab.id, { type: 'GET_UNREAD_COUNTS' }, (response) => {
                    totalCountEl.parentElement.classList.remove('loading-pulse');
                    if (chrome.runtime.lastError) {
                        statusIndicator.classList.remove('active');
                        showStatus('Gmail is waking up...', true);
                        return;
                    }

                    if (response) {
                        updateUI(response);
                    }
                });
            } else {
                totalCountEl.parentElement.classList.remove('loading-pulse');
                statusIndicator.classList.remove('active');
                showStatus('Unlock data on Gmail tab', true);
                [totalCountEl, primaryCountEl, socialCountEl, promotionsCountEl].forEach(el => el.textContent = '--');
            }
        });
    };

    // Initial fetch
    fetchData();

    // Refresh button event
    refreshBtn.addEventListener('click', (e) => {
        e.preventDefault();
        fetchData();
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

    // Interactive hover effects for category items
    document.querySelectorAll('.category-item').forEach(item => {
        item.addEventListener('mouseenter', () => {
            const icon = item.querySelector('.item-icon');
            icon.style.transform = 'rotate(12deg) scale(1.1)';
        });
        item.addEventListener('mouseleave', () => {
            const icon = item.querySelector('.item-icon');
            icon.style.transform = 'rotate(0) scale(1)';
        });
    });
});
