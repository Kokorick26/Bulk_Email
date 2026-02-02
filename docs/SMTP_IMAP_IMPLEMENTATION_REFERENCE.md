# Email SMTP/IMAP Configuration - Implementation Reference

**Date:** February 2, 2026  
**Version:** 1.0  
**Status:** Analyzed & Verified

---

## Quick Reference: SMTP/IMAP Server Details

### 🔵 Google Gmail

| Setting | Value | Notes |
|---------|-------|-------|
| **SMTP Host** | `smtp.gmail.com` | Port 465 (SSL) or 587 (TLS) |
| **SMTP Port** | 465 or 587 | 465 recommended for OAuth |
| **IMAP Host** | `imap.gmail.com` | Required for inbox & reply detection |
| **IMAP Port** | 993 | SSL/TLS required |
| **Username** | Your Gmail address | `user@gmail.com` |
| **Password** | App Password (NOT Gmail password) | Generate in Google Account Settings |
| **OAuth Scope** | `https://mail.google.com/` | Full SMTP + IMAP access |
| **TLS/SSL** | Required | Both SMTP and IMAP |

**Implementation Location:** [oauth.js](warmo-platform/server/routes/oauth.js#L169-L200)

```javascript
// OAuth Auto-Configuration
{
    host: 'smtp.gmail.com',
    port: 465,
    imapHost: 'imap.gmail.com',
    imapPort: 993,
    authType: 'oauth-google',
    imapConfigured: true,  // Automatic
}
```

---

### 🔴 Microsoft Outlook / Office 365

| Setting | Value | Notes |
|---------|-------|-------|
| **SMTP Host** | `smtp.office365.com` | Also works: `smtp-mail.outlook.com` |
| **SMTP Port** | 587 | TLS required |
| **IMAP Host** | `outlook.office365.com` | Required for inbox & reply detection |
| **IMAP Port** | 993 | SSL/TLS required |
| **Username** | Your Outlook email | `user@outlook.com` or `user@company.com` |
| **Password** | App Password (NOT Outlook password) | Generate in Microsoft Account Settings |
| **OAuth Scope** | Multiple scopes | See below |
| **TLS/SSL** | Required | Both SMTP and IMAP |

**OAuth Scopes Required:**
```javascript
[
    'https://outlook.office.com/IMAP.AccessAsUser.All',
    'https://outlook.office.com/SMTP.Send',
    'offline_access'
]
```

**Implementation Location:** [oauth.js](warmo-platform/server/routes/oauth.js#L442-L475)

```javascript
// OAuth Auto-Configuration
{
    host: 'smtp.office365.com',
    port: 587,
    imapHost: 'outlook.office365.com',
    imapPort: 993,
    authType: 'oauth-microsoft',
    imapConfigured: true,  // Automatic
}
```

---

### 🟠 Zoho Mail

| Setting | Value | Notes |
|---------|-------|-------|
| **SMTP Host** | `smtppro.zoho.eu` or `smtppro.zoho.com` | Region-specific |
| **SMTP Port** | 465 | SSL required |
| **IMAP Host** | `imappro.zoho.eu` or `imappro.zoho.com` | Must match SMTP region |
| **IMAP Port** | 993 | SSL/TLS required |
| **Username** | Your Zoho email | `user@company.com` |
| **Password** | Your account password | App-specific password recommended |
| **Preset Detection** | `zoho.com` & `zoho.eu` | Auto-detected in ImapConfigDialog |

**Preset Available:** ✓ [ImapConfigDialog.tsx](warmo-platform/src/components/mail/ImapConfigDialog.tsx#L31-L44)

```typescript
'zoho.com': { host: 'imappro.zoho.com', port: 993, tls: true },
'zoho.eu': { host: 'imappro.zoho.eu', port: 993, tls: true },
```

---

### 🟢 Yahoo Mail

| Setting | Value | Notes |
|---------|-------|-------|
| **SMTP Host** | `smtp.mail.yahoo.com` | Port 465 or 587 |
| **SMTP Port** | 465 or 587 | 465 recommended |
| **IMAP Host** | `imap.mail.yahoo.com` | Required for inbox & reply detection |
| **IMAP Port** | 993 | SSL/TLS required |
| **Username** | Your Yahoo email | `user@yahoo.com` |
| **Password** | App Password | Generate in Yahoo Account Settings |
| **Preset Detection** | `yahoo.com` | Auto-detected in ImapConfigDialog |

**Preset Available:** ✓ [ImapConfigDialog.tsx](warmo-platform/src/components/mail/ImapConfigDialog.tsx#L31-L44)

```typescript
'yahoo.com': { host: 'imap.mail.yahoo.com', port: 993, tls: true },
```

---

### 🟣 iCloud Mail

| Setting | Value | Notes |
|---------|-------|-------|
| **SMTP Host** | `smtp.mail.me.com` | For iCloud email addresses |
| **SMTP Port** | 587 | TLS required |
| **IMAP Host** | `imap.mail.me.com` | Required for inbox & reply detection |
| **IMAP Port** | 993 | SSL/TLS required |
| **Username** | Your iCloud email | `user@icloud.com` or `user@me.com` |
| **Password** | App-Specific Password | Generate in iCloud Security Settings |
| **Preset Detection** | `icloud.com` | Auto-detected in ImapConfigDialog |

**Preset Available:** ✓ [ImapConfigDialog.tsx](warmo-platform/src/components/mail/ImapConfigDialog.tsx#L31-L44)

```typescript
'icloud.com': { host: 'imap.mail.me.com', port: 993, tls: true },
```

---

## 🔧 Backend API Endpoints

### 1. Create SMTP Account

**Endpoint:** `POST /api/bulk-email/smtp-accounts`

**Location:** [bulk-email.js](warmo-platform/server/routes/bulk-email.js#L60)

**Request Body:**
```json
{
    "name": "My Gmail Account",
    "host": "smtp.gmail.com",
    "port": 587,
    "username": "user@gmail.com",
    "password": "your-app-password",
    "fromEmail": "user@gmail.com",
    "fromName": "John Doe",
    "isDefault": true,
    "imapHost": "imap.gmail.com",
    "imapPort": 993,
    "imapUser": "user@gmail.com",
    "imapPassword": "your-app-password",
    "imapTls": true
}
```

**Response (201 Created):**
```json
{
    "id": "uuid-here",
    "userId": "user-id",
    "name": "My Gmail Account",
    "host": "smtp.gmail.com",
    "port": 587,
    "fromEmail": "user@gmail.com",
    "fromName": "John Doe",
    "isDefault": true,
    "imapConfigured": true,
    "imapHost": "imap.gmail.com",
    "imapPort": 993,
    "imapUser": "user@gmail.com",
    "imapTls": true,
    "createdAt": "2026-02-02T10:00:00Z",
    "updatedAt": "2026-02-02T10:00:00Z"
}
```

**Notes:**
- Password returned as `********` in response for security
- `imapConfigured` set to `true` if `imapHost` provided
- If IMAP fields empty, `imapConfigured` set to `false`

---

### 2. Update IMAP Configuration (After Account Creation)

**Endpoint:** `PUT /api/inbox/smtp-accounts/:id/imap`

**Location:** [inbox.js](warmo-platform/server/routes/inbox.js#L154)

**Request Body:**
```json
{
    "imapHost": "imap.gmail.com",
    "imapPort": 993,
    "imapUser": "user@gmail.com",
    "imapPassword": "your-app-password",
    "imapTls": true
}
```

**Response (200 OK):**
```json
{
    "id": "uuid-here",
    "name": "My Gmail Account",
    "host": "smtp.gmail.com",
    "port": 587,
    "fromEmail": "user@gmail.com",
    "imapConfigured": true,
    "imapHost": "imap.gmail.com",
    "imapPort": 993,
    "imapUser": "user@gmail.com",
    "imapTls": true,
    "updatedAt": "2026-02-02T10:05:00Z"
}
```

**Backend Logic (Password Handling):**
```javascript
// If imapPassword not provided or is placeholder, use existing
imapPassword: (imapPassword && imapPassword !== '********')
    ? imapPassword
    : existing.Item.imapPassword,
```

**Key Feature:** If user leaves password empty, backend uses existing SMTP password!

---

### 3. Test IMAP Connection

**Endpoint:** `POST /api/inbox/smtp-accounts/:id/test-imap`

**Location:** [inbox.js](warmo-platform/server/routes/inbox.js#L201)

**Request Body:** (empty)
```json
{}
```

**Response (200 OK - Success):**
```json
{
    "message": "IMAP connection successful!",
    "mailboxes": [
        "INBOX",
        "[Gmail]/All Mail",
        "[Gmail]/Sent Mail",
        "[Gmail]/Drafts",
        "[Gmail]/Spam",
        "[Gmail]/Trash"
    ]
}
```

**Response (400 Bad Request - Failure):**
```json
{
    "error": "Invalid credentials"
}
```

**IMAP Config Used in Test:**
```javascript
{
    user: account.imapUser || account.username,              // Fallback to SMTP user
    password: account.imapPassword || account.password,      // Fallback to SMTP password
    host: account.imapHost,
    port: account.imapPort || 993,                           // Default 993
    tls: account.imapTls !== false,                          // Default true
    tlsOptions: { rejectUnauthorized: false },
    connTimeout: 10000,
    authTimeout: 10000,
}
```

---

### 4. Get All SMTP Accounts

**Endpoint:** `GET /api/bulk-email/smtp-accounts`

**Location:** [bulk-email.js](warmo-platform/server/routes/bulk-email.js#L29)

**Response (200 OK):**
```json
[
    {
        "id": "uuid1",
        "name": "My Gmail",
        "host": "smtp.gmail.com",
        "port": 587,
        "fromEmail": "user@gmail.com",
        "fromName": "John Doe",
        "isDefault": true,
        "imapConfigured": true,
        "createdAt": "2026-02-02T10:00:00Z"
    },
    {
        "id": "uuid2",
        "name": "Company Outlook",
        "host": "smtp.office365.com",
        "port": 587,
        "fromEmail": "user@company.com",
        "fromName": "Jane Smith",
        "isDefault": false,
        "imapConfigured": true,
        "createdAt": "2026-02-02T11:00:00Z"
    }
]
```

**Notes:**
- Passwords excluded from response for security
- Only returns accounts for authenticated user
- Sorted by creation date (newest first)

---

## 🔐 OAuth Endpoints

### Google OAuth Callback

**Endpoint:** `GET /api/oauth/google/callback`

**Location:** [oauth.js](warmo-platform/server/routes/oauth.js#L130-L165)

**Query Parameters:**
```
?code=4/0AX4XfW...&scope=https://mail.google.com/...&state=csrf-token
```

**Auto-Configuration (What Happens):**
```javascript
// Automatically creates account with both SMTP and IMAP
{
    authType: 'oauth-google',
    host: 'smtp.gmail.com',          // ✓ Set
    port: 465,                        // ✓ Set
    imapHost: 'imap.gmail.com',      // ✓ Set
    imapPort: 993,                    // ✓ Set
    imapConfigured: true,             // ✓ Set
    accessToken: tokens.access_token, // ✓ Set
    refreshToken: tokens.refresh_token,
    tokenExpiresAt: new Date(...),
}
```

**Result:** 100% automatic, no manual config needed!

---

### Microsoft OAuth Callback

**Endpoint:** `GET /api/oauth/microsoft/callback`

**Location:** [oauth.js](warmo-platform/server/routes/oauth.js#L390-L435)

**Query Parameters:**
```
?code=M.R3_BAY...&state=csrf-token&admin_consent=True
```

**Auto-Configuration (What Happens):**
```javascript
// Automatically creates account with both SMTP and IMAP
{
    authType: 'oauth-microsoft',
    host: 'smtp.office365.com',      // ✓ Set
    port: 587,                        // ✓ Set
    imapHost: 'outlook.office365.com', // ✓ Set
    imapPort: 993,                    // ✓ Set
    imapConfigured: true,             // ✓ Set
    accessToken: tokens.access_token, // ✓ Set
    refreshToken: tokens.refresh_token,
    tokenExpiresAt: new Date(...),
}
```

**Result:** 100% automatic, no manual config needed!

---

## 📱 Frontend Components

### 1. SmtpAccounts Component

**Location:** [warmo-platform/src/components/mail/SmtpAccounts.tsx](warmo-platform/src/components/mail/SmtpAccounts.tsx)

**Features:**
- Create new account
- Edit existing account
- Delete account
- Test SMTP connection
- Separate IMAP configuration button

**Issue:** Uses `(form as any).imapHost` - TypeScript casting

**Note:** IMAP fields in this form are optional and get saved if provided

---

### 2. ImapConfigDialog Component

**Location:** [warmo-platform/src/components/mail/ImapConfigDialog.tsx](warmo-platform/src/components/mail/ImapConfigDialog.tsx)

**Features:**
- Auto-detects email domain (gmail.com, outlook.com, etc.)
- Shows IMAP preset values for detected domain
- Test IMAP connection button
- Save configuration

**Key Method:**
```typescript
useEffect(() => {
    // Auto-fills preset values when dialog opens
    for (const [domain, preset] of Object.entries(IMAP_PRESETS)) {
        if (account.host.includes(domain) || account.fromEmail.includes(domain)) {
            setForm({
                imapHost: account.imapHost || preset.host,
                imapPort: String(account.imapPort || preset.port),
                imapUser: account.imapUser || account.username,
                imapPassword: '',  // Always empty - forces user to enter
                imapTls: preset.tls,
            });
            break;
        }
    }
}, [account]);
```

---

## 🔄 Data Flow Diagrams

### Manual Account Creation + IMAP Setup (Two Step)

```
User Input
    ↓
SmtpAccounts.tsx (Create Form)
    ├─ Fill SMTP: host, port, username, password
    ├─ Leave IMAP empty (or fill it)
    └─ Submit

Backend: POST /smtp-accounts
    ├─ Create account with: imapConfigured: false (if IMAP empty)
    └─ Return created account

Frontend: Account List
    ├─ Show account card
    └─ Show "Configure IMAP" button

User Clicks Button
    ↓
ImapConfigDialog
    ├─ Detects domain from account.fromEmail
    ├─ Auto-fills: imapHost, imapPort, imapUser
    └─ User enters: imapPassword

Backend: PUT /inbox/smtp-accounts/:id/imap
    ├─ Merge IMAP config with existing account
    ├─ Logic: If imapPassword empty, use existing
    └─ Update: imapConfigured: true

✓ DONE: Account fully configured!
```

### OAuth Account Creation (One Step)

```
User Clicks "Connect with Google"
    ↓
OAuth Flow
    ├─ Redirects to Google
    ├─ User grants permission
    └─ Redirects back with code

Backend: GET /oauth/google/callback
    ├─ Exchange code for tokens
    ├─ Fetch user info
    └─ Create account with:
        ├─ host: smtp.gmail.com ✓
        ├─ imapHost: imap.gmail.com ✓
        ├─ accessToken ✓
        ├─ refreshToken ✓
        └─ imapConfigured: true ✓

✓ DONE: Everything automatic!
```

---

## 🧪 Testing Credentials

### Test Gmail Account

```
Email: your-test-email@gmail.com
SMTP: smtp.gmail.com:587
IMAP: imap.gmail.com:993
App Password: Generate from: https://myaccount.google.com/apppasswords
Verification: Test connection button should find 6+ Gmail mailboxes
```

### Test Outlook Account

```
Email: your-test-email@outlook.com
SMTP: smtp.office365.com:587
IMAP: outlook.office365.com:993
App Password: Generate from: https://account.microsoft.com/security
Verification: Test connection button should find Inbox, Sent Items, etc.
```

---

## ⚠️ Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| "Invalid credentials" on IMAP test | Wrong password or account restrictions | Use app password, enable IMAP in account settings |
| IMAP test hangs | Network timeout | Increase `connTimeout` in config (default 10s) |
| Port 587 vs 465 confusion | SMTP port selection | 465=SSL, 587=TLS. Both work, Gmail prefers 465 for OAuth |
| "IMAP not configured" after creation | User left IMAP fields empty in form | User must click "Configure IMAP" button separately |
| Gmail OAuth scopes error | Missing scopes | Must include `https://mail.google.com/` scope |
| Outlook OAuth scopes error | Missing scopes | Must include both IMAP and SMTP scopes |

---

## 📝 Summary of Implementation Status

### ✅ WORKING PERFECTLY
- [x] Google SMTP configuration
- [x] Microsoft SMTP configuration
- [x] Google OAuth with SMTP + IMAP
- [x] Microsoft OAuth with SMTP + IMAP
- [x] IMAP connection testing
- [x] Password fallback mechanism
- [x] Domain preset detection
- [x] Reply detection via IMAP
- [x] OAuth token refresh

### ⚠️ WORKS BUT HAS UX ISSUES
- [x] Manual IMAP setup (requires two steps)
- [x] TypeScript type safety (uses `any` casting)
- [x] First-time user confusion

### ❌ BROKEN
- None known

