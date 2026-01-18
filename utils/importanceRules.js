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
        'slack.com'
    ],

    // Keywords that, if found in the subject or snippet, mark an email as important
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
        'fahad jameel'
    ],

    /**
     * Checks if an email is important based on its sender, subject, and snippet.
     * Performs case-insensitive partial matching.
     */
    isImportant: ({ sender, subject, snippet }) => {
        const rules = window.IMPORTANCE_RULES;
        const s = (sender || '').toLowerCase();
        const sub = (subject || '').toLowerCase();
        const snip = (snippet || '').toLowerCase();

        // Check Important Senders (Partial Match)
        const isImportantSender = rules.IMPORTANT_SENDERS.some(importantSender =>
            s.includes(importantSender.toLowerCase())
        );

        if (isImportantSender) return true;

        // Check Important Keywords in Subject or Snippet
        const hasKeyword = rules.IMPORTANT_KEYWORDS.some(keyword => {
            currentKeyword = keyword.toLowerCase();
            return sub.includes(currentKeyword) || snip.includes(currentKeyword);
        });

        return hasKeyword;
    }
};
