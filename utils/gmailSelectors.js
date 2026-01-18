/**
 * Centralized Gmail DOM selectors.
 * This file is loaded before the content script to provide GMAIL_SELECTORS globally.
 */

window.GMAIL_SELECTORS = {
    // --- Email List / Rows ---
    EMAIL_ROW: 'tr.zA',
    UNREAD_ROW: 'tr.zE',
    READ_ROW: 'tr.yO',

    // --- Row Elements ---
    CHECKBOX: '.T-Jo',
    STAR: '.T-KT',
    SENDER: '.yW',
    SUBJECT: '.y6',
    SNIPPET: '.y2',
    DATE: '.xW',

    // --- Inbox Tabs ---
    TAB_PRIMARY: '[role="tab"][aria-label="Primary"]',
    TAB_SOCIAL: '[role="tab"][aria-label="Social"]',
    TAB_PROMOTIONS: '[role="tab"][aria-label="Promotions"]',
    TAB_UPDATES: '[role="tab"][aria-label="Updates"]',
    TAB_FORUMS: '[role="tab"][aria-label="Forums"]',

    // --- Unread Indicators ---
    UNREAD_COUNT: '.bsU', // Number shown next to Inbox/Labels
    UNREAD_DOT: '.pE',    // Small dot indicator if any

    // --- Main UI Containers ---
    MAIN_INBOX_CONTAINER: '.nH.bkK',
    SIDEBAR: '.bhZ',
    SEARCH_BAR: 'input[name="q"]',

    // --- Buttons ---
    COMPOSE_BTN: '.T-I.T-I-KE.L3',
    REFRESH_BTN: '.asP',
};

/**
 * Utility to find elements safely
 */
window.getGmailElement = (selector) => document.querySelector(selector);
window.getAllGmailElements = (selector) => document.querySelectorAll(selector);
