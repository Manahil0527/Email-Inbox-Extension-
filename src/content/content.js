console.log('Inbox Flow: Content script loaded');

// Simple initialization message
chrome.runtime.sendMessage({ type: 'CONTENT_SCRIPT_LOADED' });

// Future logic: Inject UI elements or highlight emails
