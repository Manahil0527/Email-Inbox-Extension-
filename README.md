# Inbox Flow 📧

A premium Chrome Extension built with **Manifest V3** to enhance your Gmail inbox experience. Inbox Flow provides a modern dashboard for your unread emails and intelligently highlights important messages based on a customizable rule engine.

## ✨ Features

- **Real-time Dashboard**: Instantly view unread counts for Primary, Social, and Promotions categories.
- **Intelligent Highlighting**: Automatically identifies and highlights high-priority emails (e.g., from Google, GitHub, or containing keywords like "Urgent" or "Invoice").
- **Premium UI**: Dark/Light mode support with a sleek, glassmorphic design and Outfit typography.
- **Fast & Lightweight**: Optimized with debounced MutationObservers to ensure zero performance impact on Gmail.
- **Privacy First**: Processing happens entirely on your device. No email data is ever stored or transmitted.

## 🏗️ Architecture

- **Manifest V3**: Compliant with the latest Chrome Extension standards for security and performance.
- **Service Worker**: Handles background orchestration and extension installation events.
- **Content Scripts**: Injects logic and scoped styles into Gmail for real-time DOM analysis and visual enhancements.
- **Rule Engine**: A modular utility (`utils/importanceRules.js`) that defines importance logic via sender and keyword matching.
- **Centralized Selectors**: Managed in `utils/gmailSelectors.js` to ensure easy maintenance if Gmail's internal structures change.

## 🚀 Installation & Usage

1. Clone or download this repository.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** (top right).
4. Click **Load unpacked** and select the project directory.
5. Open [Gmail](https://mail.google.com/) and click the **Inbox Flow** icon to see your dashboard!

## ⚠️ Limitations

- **Gmail Only**: Designed specifically for the web version of Gmail.
- **Layout Dependencies**: Relies on standard Gmail selectors. If Google performs a major UI overhaul, some selectors in `utils/gmailSelectors.js` may need updates.
- **Email Content**: Highlighting is based on visible metadata (Sender, Subject, Snippet). It does not scan the full interior body of an open email to maintain privacy.

---
Built with ❤️ for a more organized inbox.