# Migration from IMAP to Native APIs (Gmail & Outlook Graph)

## Overview
Currently, the Warmo platform uses standard IMAP protocols to connect to email accounts for:
1.  Checking replies (`campaignExecutor.js`)
2.  Fetching inbox messages (`inbox.js`)
3.  Tracking bounces (`campaignExecutor.js`)

While IMAP is a standard, using native APIs (Gmail API and Microsoft Graph API) offers significant advantages:
*   **Reliability**: Less prone to connection timeouts and "too many connections" errors common with IMAP.
*   **Security**: Use of granular OAuth scopes.
*   **Performance**: Faster fetching and filtering (filtering server-side is much more powerful).
*   **Features**: Easier access to threads, labels, and metadata.

## Feasibility Analysis
**Yes, we can switch to APIs.**
The backend storage (`DynamoDB`) and frontend components are largely agnostic to *how* the email is fetched, as long as the data shape returned to the frontend remains consistent.

## Migration Steps

### 1. Dependency Updates
We need to add official SDKs:
```bash
npm install googleapis @microsoft/microsoft-graph-client @azure/identity isomorphic-fetch
```

### 2. Authorization Scopes Update (`server/routes/oauth.js`)
Users will need to re-authenticate to grant these new permissions.

**Google:**
*   Current: `https://mail.google.com/` (Full access - compatible with API, but we might want to refine it to `https://www.googleapis.com/auth/gmail.modify` + `https://www.googleapis.com/auth/gmail.send`).

**Microsoft:**
*   Current: `IMAP.AccessAsUser.All`, `SMTP.Send`
*   **Required Change**: Add `Mail.Read`, `Mail.Send`, `Mail.ReadWrite`.

### 3. Architecture Refactor: Provider Pattern
We should move away from the direct `imap` calls in `campaignExecutor.js` and `inbox.js` to a provider pattern.

**Proposed Structure:**
```
server/services/email/
├── EmailProvider.js       # Abstract interface
├── ImapProvider.js        # Adapter for existing IMAP logic
├── GmailProvider.js       # Adapter for Gmail API
├── OutlookProvider.js     # Adapter for Microsoft Graph API
└── ProviderFactory.js     # Returns correct provider based on account type
```

### 4. Implementation Details

#### The Interface (`EmailProvider`)
```javascript
class EmailProvider {
    async connect() {}
    async sendEmail(emailOptions) {}
    async fetchMessages(folder, options) {}
    async checkReplies(originalMessageId, sinceDate) {}
    async markAsRead(messageId) {}
    async deleteMessage(messageId) {}
}
```

### 5. Migration Strategy
1.  **Refactor**: detailed above.
2.  **Hybrid Rollout**: Update `ProviderFactory` to use `ImapProvider` by default, but switch to `GmailProvider` or `OutlookProvider` if an environment variable `ENABLE_NATIVE_API` is set, or based on a flag in the `SmtpAccounts` table.
3.  **Authentication**: Update the OAuth flow to request new scopes. Existing users will see a "Re-connect" prompt when their old tokens fail for API calls.

## Pros & Cons

**Pros:**
*   Better deliverability awareness (Graph API gives better bounce feedback).
*   Faster reply detection.
*   Lower latency for the Inbox UI.

**Cons:**
*   Requires users to re-authenticate (Auth tokens invalid for new scopes).
*   Maintenance of multiple APIs (Gmail vs Graph vs Generic IMAP).

## Recommendation
Implement the **Provider Pattern** refactor first, moving the existing IMAP logic into `ImapProvider.js`. Once the interface is stable, implement `GmailProvider` as the first API integration.
