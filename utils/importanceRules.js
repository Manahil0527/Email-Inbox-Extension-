/**
 * Importance Rule Engine for Inbox Flow.
 * defines what makes an email "important" based on senders and keywords.
 */

window.IMPORTANCE_RULES = {
    // List of senders whose emails should always be highlighted
    IMPORTANT_SENDERS: [
        'google.com',
        'github.com',
        'calendar-notification@google.com',
        'linkedin.com',
        'slack.com',
        'fimini'
    ],

    // Keywords that, if found in the sender, subject, or snippet, mark an email as important
    IMPORTANT_KEYWORDS: [
        'urgent',
        'action required',
        'invitation',
        'meeting',
        'interview',
        'offer',
        'invoice',
        'receipt',
        'password',
        'security alert',
        'deadline',
        'fiminico',
        'fimini co',
        'fimini',
        'fahad jameel'
    ],

    /**
     * Checks if an email is important based on its sender, subject, and snippet.
     * Performs case-insensitive partial matching across all fields.
     */
    isImportant: ({ sender, subject, snippet }) => {
        const rules = window.IMPORTANCE_RULES;
        const s = (sender || '').toLowerCase();
        const sub = (subject || '').toLowerCase();
        const snip = (snippet || '').toLowerCase();

        // 1. Check Explicit Important Senders (Partial Match)
        const matchesSender = rules.IMPORTANT_SENDERS.some(importantSender =>
            s.includes(importantSender.toLowerCase())
        );

        if (matchesSender) return true;

        // 2. Check Keywords in Sender, Subject, OR Snippet (Maximum Coverage)
        const hasKeyword = rules.IMPORTANT_KEYWORDS.some(keyword => {
            const currentKeyword = keyword.toLowerCase();
            return s.includes(currentKeyword) ||
                sub.includes(currentKeyword) ||
                snip.includes(currentKeyword);
        });

        return hasKeyword;
    }
};
