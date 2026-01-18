/**
 * Common CSS selectors for Gmail's interface.
 * Note: Gmail uses dynamic classes, so we rely on stable attributes and ARIA roles where possible.
 */

export const GMAIL_SELECTORS = {
    // Main UI Containers
    inboxContainer: '.nH.bkK',
    emailRow: 'tr.zA',

    // Email Content
    sender: '.yW',
    subject: '.y6',
    date: '.xW',
    snippet: '.y2',

    // UI Elements
    composeBtn: '.T-I.T-I-KE.L3',
    sidebar: '.bhZ',

    // Search
    searchBar: 'input[name="q"]',
};
