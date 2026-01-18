document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('toggle-highlights');
    const settingsBtn = document.getElementById('open-settings');

    toggleBtn.addEventListener('click', () => {
        // Toggle logic will go here
        console.log('Toggle highlights clicked');
        toggleBtn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            toggleBtn.style.transform = 'scale(1)';
        }, 100);
    });

    settingsBtn.addEventListener('click', () => {
        console.log('Settings clicked');
        // Open options page or show settings panel
    });

    // Check if we are on Gmail
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const url = tabs[0].url;
        const statusIndicator = document.querySelector('.status-indicator');
        const statusValue = document.querySelector('.value');

        if (url.includes('mail.google.com')) {
            statusIndicator.classList.add('active');
            statusValue.textContent = 'Active on Gmail';
        } else {
            statusIndicator.classList.remove('active');
            statusValue.textContent = 'Not on Gmail';
        }
    });
});
