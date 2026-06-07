# LIQIFIN Privacy Policy

*Last updated: June 8, 2026*

This Privacy Policy describes how LIQIFIN ("we", "us", or "our") collects, uses, processes, and protects your personal and financial information when you use our personal finance management dashboard.

We are fully committed to protecting your privacy and complying with applicable data protection laws, including the General Data Protection Regulation (GDPR) for users within the European Economic Area (EEA).

---

## 1. Information We Collect

LIQIFIN is designed to process and visualize your personal financial data. The information we collect falls into the following categories:

* **Account Credentials**: Name, email address, password hashes, and biometric identifiers (biometric passkeys are processed locally on your device; we only store public key credentials and credentials IDs).
* **Financial Data**: Credit card limits, balances, billing cycles, category budgets, savings goals, and expenses.
* **Email Ledger Sync**: If activated, email headers, metadata, and transaction descriptions parsed from sync accounts to automate expense entries.
* **Metadata & Sessions**: IP address, system OS, browser type, and authentication cookies.

---

## 2. How We Use Your Data

We use the collected information strictly for:
* Creating and managing your user account.
* Real-time expense auditing, budget tracking, and analytics.
* Secure biometric authentication handshake verification.
* Sending system notifications (e.g. payment due dates, budget thresholds).

**We never sell, rent, or trade your personal or financial data to third parties.**

---

## 3. GDPR Compliance (EU/EEA User Rights)

If you reside in the European Economic Area (EEA), you have the following rights under the GDPR:
* **Right of Access**: You can request a copy of all personal and financial data stored in our system.
* **Right to Rectification**: You can modify your profile details and ledger accounts at any time.
* **Right to Erasure (Right to be Forgotten)**: You can request the complete deletion of your user account and all associated transactions.
* **Right to Data Portability**: You can export your data in structured JSON format.

---

## 4. PCI-DSS Compliance (Credit Card Storage)

LIQIFIN is designed to be **out of scope** for PCI-DSS data storage compliance:
* **Data Minimization**: We **do not** collect, store, process, or transmit full primary account numbers (PAN), CVVs, card PINs, or expiration dates.
* **Last Four Digits**: We only store the last 4 digits of credit card numbers (`cardNumberLastFour`) for display and matching purposes, which is fully permitted and does not trigger PCI-DSS auditing.

---

## 5. Cookies & Local Storage

We use cookies and localStorage strictly for operational purposes:
* **Strictly Necessary Cookies**: An HTTP-only `refreshToken` is set to manage secure session handshakes.
* **LocalStorage**: Used to persist offline expense data, local app preferences, and your cookie consent response (`liqifin-cookie-consent`).
