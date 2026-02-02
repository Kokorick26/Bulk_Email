# Campaign Flow & Email Scheduling - Comprehensive Analysis

## Executive Summary

After deep analysis of the campaign execution flow, I've identified **critical issues** in how campaigns schedule and send emails. The system has sophisticated features (intelligent routing, timezone awareness, variable replacement) but several integration gaps prevent proper execution.

---

## 🔴 CRITICAL ISSUES IDENTIFIED

### 1. **Account Assignment Not Persisting to Leads**
**Location**: `CampaignWizard.tsx` → Campaign Creation
**Problem**: When creating a campaign, selected SMTP accounts are stored in `options.selectedAccountIds`, but individual leads don't get `sendingAccountId` assigned during wizard completion.

**Code Evidence**:
```typescript
// CampaignWizard.tsx line 98-106
body: JSON.stringify({
    name: campaignName.trim(),
    status: 'draft',
    leads,  // ❌ Leads don't have sendingAccountId assigned
    sequence: { id: `seq-${Date.now()}`, campaignId: '', steps: sequences },
    schedule,
    options: { ...options, selectedAccountIds },  // ✅ Accounts stored here
    sequenceType
})
```

**Impact**: 
- `initializeLeadProgress()` tries to assign accounts round-robin, but only if `lead.sendingAccountId` is missing
- UI shows "Not assigned" or "Auto" instead of actual account emails
- Emails may not send from intended accounts

**Fix Required**:
```typescript
// In CampaignWizard.tsx handleComplete()
// BEFORE sending to backend, assign accounts to leads:
const leadsWithAccounts = leads.map((lead, index) => ({
    ...lead,
    sendingAccountId: selectedAccountIds[index % selectedAccountIds.length]
}));
```

---

### 2. **Variable Replacement Not Working for Lead Names**
**Location**: `campaignExecutor.js` → `sendStepEmail()` function
**Problem**: The `leadData` structure doesn't match what `replaceVariables()` expects.

**Code Evidence**:
```javascript
// Line 556-561 - Debug logs show the issue
const leadData = lead.progress?.leadData || lead.leadData || {};
console.log(`[CampaignExecutor] DEBUG leadData for ${leadEmail}:`, JSON.stringify(leadData).substring(0, 300));
console.log(`[CampaignExecutor] DEBUG firstName="${leadData.firstName}", name="${leadData.name}"`);
```

**Root Cause Analysis**:
1. Leads are stored with fields: `firstName`, `lastName`, `email`, `company`
2. `replaceVariables()` expects these exact field names
3. BUT the Lead type definition shows: `firstName?`, `lastName?` (optional)
4. When leads are imported, these fields may be empty strings `""` instead of undefined

**Variable Replacement Logic**:
```javascript
// Line 73-93 - replaceVariables function
const safeData = {
    name: '', company: '', firstName: '', lastName: '', email: '',
    ...data,  // Spreads leadData
    
    // Sender Profile Mappings
    senderName: senderProfile.senderFullName || senderProfile.fromName || '',
    // ...
};

// Line 95-107 - Spaced variable handling
const spacedMappings = {
    'First Name': safeData.firstName || safeData.name?.split(' ')[0] || '',
    'Last Name': safeData.lastName || safeData.name?.split(' ').slice(1).join(' ') || '',
    'Full Name': safeData.name || `${safeData.firstName} ${safeData.lastName}`.trim() || '',
    // ...
};
```

**Issue**: If `leadData.firstName` is `""` (empty string), the fallback logic fails because `"" || fallback` returns `""`, not the fallback.

**Fix Required**:
```javascript
// In replaceVariables(), change line 96-98 to:
'First Name': safeData.firstName?.trim() || safeData.name?.split(' ')[0] || '',
'Last Name': safeData.lastName?.trim() || safeData.name?.split(' ').slice(1).join(' ') || '',
'Full Name': safeData.name?.trim() || `${safeData.firstName} ${safeData.lastName}`.trim() || '',
```

---

### 3. **Campaign Not Scheduling to ALL Selected Accounts**
**Location**: `campaignExecutor.js` → `executeCampaign()` function
**Problem**: The intelligent routing system is complex but has edge cases where not all accounts are utilized.

**Code Flow**:
```javascript
// Line 773-795 - Account Selection Logic
const leads = campaign.leads || [];
const leadAccountIds = [...new Set(leads.map(l =>
    l.sendingAccountId || l.smtpAccountId || l.accountId
).filter(Boolean))];

if (leadAccountIds.length > 0 && !hasSelectedAccounts) {
    options.selectedAccountIds = leadAccountIds;
    hasSelectedAccounts = true;
}

// Line 807-816 - Filtering accounts
if (hasSelectedAccounts) {
    allSmtpAccounts = allSmtpAccounts.filter(acc =>
        options.selectedAccountIds.includes(acc.id)
    );
}
```

**Issues**:
1. If leads don't have `sendingAccountId`, the system falls back to `options.selectedAccountIds`
2. But if that's also empty, `allSmtpAccounts` becomes empty array
3. Round-robin assignment in `initializeLeadProgress()` only works if `allSmtpAccounts.length > 0`

**Fix Required**:
Ensure `options.selectedAccountIds` is always populated when campaign is created.

---

### 4. **Email Preview Not Showing Personalized Content**
**Location**: `campaignExecutor.js` → `sendStepEmail()` function
**Problem**: Email preview logs show template variables, not replaced values.

**Code Evidence**:
```javascript
// Line 579-584 - Email Preview
console.log(`\n[CampaignExecutor] 📧 EMAIL PREVIEW for ${leadEmail}:`);
console.log(`  From: "${fromName}" <${fromEmail}>`);
console.log(`  Subject: ${subject}`);  // ✅ This IS replaced
console.log(`  Body Preview: ${body.substring(0, 200).replace(/\n/g, ' ')}...`);  // ✅ This IS replaced
```

**Actually Working**: The preview DOES show replaced content. The issue is likely in the UI not fetching/displaying this preview.

**UI Issue**: `LeadsTab.tsx` and `AccountsTab.tsx` need to fetch and display the actual email content that will be sent.

---

## 📊 COMPLETE FLOW ANALYSIS

### Campaign Creation Flow

```
User Creates Campaign (CampaignWizard.tsx)
    ↓
1. Step 1: Name Campaign
    ↓
2. Step 2: Select SMTP Accounts (StepAccounts)
   - Fetches all SMTP accounts from /api/bulk-email/smtp-accounts
   - User selects multiple accounts
   - Stored in: selectedAccountIds state
    ↓
3. Step 3: Add Leads (StepLeads)
   - Import from CSV, Lead Lists, or manual entry
   - Leads structure: { id, email, firstName, lastName, company, status, customFields, addedAt }
   - ❌ NO sendingAccountId assigned here
    ↓
4. Step 4: Choose Strategy (same sequence vs individual)
    ↓
5. Step 5: Create Email Sequence (StepEmails)
   - Subject and body with {{variables}}
   - Spintax support: {option1|option2}
    ↓
6. Step 6: Schedule (StepSchedule)
   - Timezone, working days, working hours
    ↓
7. Step 7: Launch Options (StepLaunch)
   - dailyLimit, timeBetweenEmails
   - stopOnReply, stopOnClick
    ↓
8. handleComplete() - POST /api/bulk-email/campaigns
   - Creates campaign with status: 'draft'
   - Saves: leads, sequence, schedule, options
   - ❌ options.selectedAccountIds saved, but leads don't have sendingAccountId
```

### Campaign Start Flow

```
User Clicks "Start Campaign"
    ↓
POST /api/bulk-email/campaigns/:id/start
    ↓
1. Validates campaign has leads and sequence
    ↓
2. Updates campaign status to 'active'
    ↓
3. Calls executeCampaign(id) in background via setImmediate()
```

### Campaign Execution Flow (executeCampaign)

```
executeCampaign(campaignId)
    ↓
1. Fetch campaign from DynamoDB
    ↓
2. Validate: status === 'active', has sequence, has leads
    ↓
3. 🔄 INTELLIGENT ROUTING SETUP
   - Scan ALL SMTP accounts
   - Extract leadAccountIds from leads (if any)
   - Filter to selectedAccountIds OR leadAccountIds
   - ❌ If both empty, allSmtpAccounts = []
    ↓
4. Initialize Lead Progress (initializeLeadProgress)
   - For each lead:
     * Create LeadProgress record: { id, campaignId, leadEmail, leadData, sendingAccountId, currentStep: 0, status: 'pending' }
     * ✅ Assigns account round-robin IF allSmtpAccounts.length > 0
     * ❌ If allSmtpAccounts = [], sendingAccountId = undefined
    ↓
5. Check for Replies (if IMAP configured)
    ↓
6. Get Leads Needing Emails (getLeadsNeedingEmails)
   - Scans LeadProgress table
   - Filters: status IN ('pending', 'in_progress')
   - Skips if: stopOnReply && hasReplied, stopOnClick && hasClicked
   - Returns leads ready for current step
    ↓
7. 🔄 SEND EMAILS LOOP
   For each lead:
     ↓
   a. Check campaign status (every 3 emails) - can pause mid-execution
     ↓
   b. Check daily limit
     ↓
   c. 🌍 TIMEZONE CHECK (if useLeadTimezones)
      - Get lead's timezone (from lead.timezone OR country inference OR campaign default)
      - Get current time in lead's timezone
      - Check if within working hours
      - ❌ Skip if outside working hours
     ↓
   d. 🔄 SELECT SMTP ACCOUNT
      Priority:
      1. lead.progress.sendingAccountId (from LeadProgress)
      2. lead.sendingAccountId (from Lead object)
      3. leadData.sendingAccountId
      4. Intelligent routing: getNextAccount()
      5. options.smtpAccountId (fallback)
     ↓
   e. Wait for delay (timeBetweenEmails in minutes)
     ↓
   f. 📧 SEND EMAIL (sendStepEmail)
      - Get transporter for SMTP account
      - Extract leadData from progress
      - 🔄 PERSONALIZE CONTENT
        * Process spintax: {option1|option2}
        * Replace variables: {{First Name}}, {{Company}}, etc.
        * Replace sender variables: [Your Name], [Your Company]
      - Convert body to HTML
      - Send via nodemailer
      - Log to EmailLogs table
      - Update LeadProgress: increment currentStep, set lastStepSentAt
      - Update campaign.leads[].status to 'sent'
     ↓
   g. Mark email sent for routing (if intelligent routing)
     ↓
   h. Delay before next email
    ↓
8. Update campaign stats (sentCount, failedCount)
    ↓
9. Return result
```

### Scheduler Flow

```
Server Startup (server/index.js)
    ↓
startCampaignScheduler(5)  // Check every 5 minutes
    ↓
setInterval(() => {
    processAllActiveCampaigns()
        ↓
    Scan campaigns where status = 'active'
        ↓
    For each active campaign:
        executeCampaign(campaign.id)
}, 5 * 60 * 1000)
```

---

## 🔧 DETAILED FIXES REQUIRED

### Fix 1: Assign Accounts to Leads in Wizard

**File**: `src/components/campaigns/CampaignWizard.tsx`
**Function**: `handleComplete()`
**Line**: ~88-116

```typescript
const handleComplete = async () => {
    setIsCreating(true);
    try {
        // ✅ ASSIGN ACCOUNTS TO LEADS BEFORE SAVING
        const leadsWithAccounts = leads.map((lead, index) => {
            // If lead already has an account assigned (from LeadsTab), keep it
            if (lead.sendingAccountId) {
                return lead;
            }
            // Otherwise, assign round-robin from selected accounts
            if (selectedAccountIds.length > 0) {
                return {
                    ...lead,
                    sendingAccountId: selectedAccountIds[index % selectedAccountIds.length]
                };
            }
            return lead;
        });

        const token = localStorage.getItem('bulkEmailToken');
        const response = await fetch('/api/bulk-email/campaigns', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                name: campaignName.trim(),
                status: 'draft',
                leads: leadsWithAccounts,  // ✅ Use leads with accounts
                sequence: { id: `seq-${Date.now()}`, campaignId: '', steps: sequences },
                schedule,
                options: { ...options, selectedAccountIds },
                sequenceType
            })
        });
        if (!response.ok) throw new Error('Failed');
        const data = await response.json();
        onComplete(data.id || data.campaignId);
    } catch {
        onComplete('new-campaign-' + Date.now());
    } finally {
        setIsCreating(false);
    }
};
```

---

### Fix 2: Improve Variable Replacement

**File**: `server/services/campaignExecutor.js`
**Function**: `replaceVariables()`
**Line**: ~72-162

```javascript
function replaceVariables(text, data, senderProfile = {}) {
    if (!text) return '';
    let result = text;

    // Helper to clean empty strings
    const cleanValue = (val) => {
        if (val === null || val === undefined) return '';
        const cleaned = String(val).trim();
        return cleaned === '' ? null : cleaned;  // Convert empty strings to null
    };

    // Merge recipient data with sender profile mapping
    const safeData = {
        name: cleanValue(data.name),
        company: cleanValue(data.company),
        firstName: cleanValue(data.firstName),
        lastName: cleanValue(data.lastName),
        email: cleanValue(data.email),

        // Sender Profile Mappings
        senderName: cleanValue(senderProfile.senderFullName || senderProfile.fromName),
        senderFullName: cleanValue(senderProfile.senderFullName || senderProfile.fromName),
        senderPosition: cleanValue(senderProfile.senderPosition),
        senderCompany: cleanValue(senderProfile.senderCompany),
        senderPhone: cleanValue(senderProfile.senderPhone),
        senderWebsite: cleanValue(senderProfile.senderWebsite),
        senderLinkedIn: cleanValue(senderProfile.senderLinkedIn),
        senderAddress: cleanValue(senderProfile.senderAddress),
        senderSignature: cleanValue(senderProfile.senderSignature),
    };

    // Handle {{First Name}}, {{Last Name}}, {{Company Name}} etc with spaces
    const spacedMappings = {
        'First Name': safeData.firstName || safeData.name?.split(' ')[0] || '',
        'Last Name': safeData.lastName || safeData.name?.split(' ').slice(1).join(' ') || '',
        'Full Name': safeData.name || `${safeData.firstName || ''} ${safeData.lastName || ''}`.trim() || '',
        'Company Name': safeData.company || '',
        'Company': safeData.company || '',
        'Email': safeData.email || '',
        'Sender Name': safeData.senderFullName || '',
        'Sender Position': safeData.senderPosition || '',
        'Sender Company': safeData.senderCompany || '',
        'Sender Phone': safeData.senderPhone || '',
        'Sender Website': safeData.senderWebsite || '',
    };

    // Replace spaced variable names first (before camelCase)
    Object.entries(spacedMappings).forEach(([key, value]) => {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'gi');
        result = result.replace(regex, value || '');
    });

    // Standard Handlebars-style {{key}} replacement (camelCase)
    Object.keys(safeData).forEach(key => {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'gi');
        result = result.replace(regex, safeData[key] || '');
    });

    // Square Bracket [Your Name] Style Replacement
    const bracketMappings = {
        'Your Name': safeData.senderFullName,
        'My Name': safeData.senderFullName,
        'Name': safeData.senderFullName,

        'Your Position': safeData.senderPosition,
        'My Position': safeData.senderPosition,
        'Position': safeData.senderPosition,
        'Job Title': safeData.senderPosition,

        'Your Company': safeData.senderCompany,
        'My Company': safeData.senderCompany,
        'Company': safeData.senderCompany,
        'Company Name': safeData.senderCompany,

        'Your Phone': safeData.senderPhone,
        'My Phone': safeData.senderPhone,
        'Phone': safeData.senderPhone,

        'Your Website': safeData.senderWebsite,
        'My Website': safeData.senderWebsite,
        'Website': safeData.senderWebsite,

        'LinkedIn': safeData.senderLinkedIn,
        'Address': safeData.senderAddress
    };

    Object.entries(bracketMappings).forEach(([key, value]) => {
        const regex = new RegExp(`\\[${key}\\]`, 'gi');
        result = result.replace(regex, value || '');
    });

    return result
        .replace(/—/g, '-')
        .replace(/–/g, '-')
        .replace(/"/g, '"')
        .replace(/"/g, '"')
        .replace(/'/g, "'")
        .replace(/'/g, "'");
}
```

---

### Fix 3: Enhanced Logging for Debugging

**File**: `server/services/campaignExecutor.js`
**Function**: `sendStepEmail()`
**Line**: ~545-671

Add more detailed logging:

```javascript
async function sendStepEmail(campaign, lead, step, stepIndex, smtpAccountId) {
    try {
        const { transporter, fromEmail, fromName, senderProfile } = await getTransporter(smtpAccountId);

        // Validate SMTP configuration
        if (!fromEmail || !transporter) {
            throw new Error(`No valid SMTP configuration for account ${smtpAccountId || 'default'}`);
        }

        // Extract lead data
        const leadEmail = lead.progress?.leadEmail || lead.leadEmail;
        const leadData = lead.progress?.leadData || lead.leadData || {};

        // ✅ ENHANCED DEBUG LOGGING
        console.log(`\n[CampaignExecutor] ========== EMAIL PREPARATION ==========`);
        console.log(`[CampaignExecutor] Lead: ${leadEmail}`);
        console.log(`[CampaignExecutor] SMTP Account: ${smtpAccountId} (${fromEmail})`);
        console.log(`[CampaignExecutor] Lead Data:`, {
            firstName: leadData.firstName,
            lastName: leadData.lastName,
            name: leadData.name,
            company: leadData.company,
            email: leadData.email
        });
        console.log(`[CampaignExecutor] Sender Profile:`, {
            senderFullName: senderProfile.senderFullName,
            senderPosition: senderProfile.senderPosition,
            senderCompany: senderProfile.senderCompany
        });

        // Personalize content
        let subject = processSpintax(step.subject);
        console.log(`[CampaignExecutor] Subject BEFORE replacement: "${subject}"`);
        subject = replaceVariables(subject, leadData, senderProfile);
        console.log(`[CampaignExecutor] Subject AFTER replacement: "${subject}"`);

        let body = processSpintax(step.body);
        console.log(`[CampaignExecutor] Body BEFORE (first 200 chars): "${body.substring(0, 200)}"`);
        body = replaceVariables(body, leadData, senderProfile);
        console.log(`[CampaignExecutor] Body AFTER (first 200 chars): "${body.substring(0, 200)}"`);

        // Convert to HTML
        const html = `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#202124">${body.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</div>`;

        // Generate unique message ID
        const domain = (fromEmail && fromEmail.includes('@')) ? fromEmail.split('@')[1] : 'kokorick.uk';
        const messageId = `<${Date.now()}.${Math.random().toString(36).substr(2, 9)}@${domain}>`;

        // ✅ FINAL EMAIL PREVIEW
        console.log(`\n[CampaignExecutor] 📧 FINAL EMAIL PREVIEW:`);
        console.log(`  To: ${leadEmail}`);
        console.log(`  From: "${fromName}" <${fromEmail}>`);
        console.log(`  Subject: ${subject}`);
        console.log(`  Body Preview: ${body.substring(0, 300).replace(/\n/g, ' ')}...`);
        console.log(`[CampaignExecutor] ==========================================\n`);

        // Send email
        const info = await transporter.sendMail({
            from: `"${fromName}" <${fromEmail}>`,
            to: leadEmail,
            replyTo: fromEmail,
            subject: subject,
            text: body,
            html: html,
            messageId,
            headers: {
                'X-Campaign-Id': campaign.id,
                'X-Step-Index': stepIndex.toString()
            }
        });

        transporter.close();

        // Log the email
        await dynamoDB.put({
            TableName: EMAIL_LOGS_TABLE,
            Item: {
                id: uuidv4(),
                campaignId: campaign.id,
                email: leadEmail,
                recipientName: leadData.name || leadData.firstName || '',
                status: 'sent',
                stepIndex,
                messageId: info.messageId,
                subject: subject,
                htmlContent: html,
                textContent: body,
                sentAt: new Date().toISOString(),
                smtpAccountId: smtpAccountId,  // ✅ Track which account sent it
                fromEmail: fromEmail  // ✅ Track sender email
            }
        }).promise();

        // Update lead progress
        await dynamoDB.update({
            TableName: LEAD_PROGRESS_TABLE,
            Key: { id: lead.progress.id },
            UpdateExpression: 'SET currentStep = :step, lastStepSentAt = :sentAt, #status = :status, stepHistory = list_append(stepHistory, :history), updatedAt = :updatedAt',
            ExpressionAttributeNames: { '#status': 'status' },
            ExpressionAttributeValues: {
                ':step': stepIndex + 1,
                ':sentAt': new Date().toISOString(),
                ':status': stepIndex + 1 >= campaign.sequence.steps.length ? 'completed' : 'in_progress',
                ':history': [{
                    stepIndex,
                    sentAt: new Date().toISOString(),
                    messageId: info.messageId,
                    smtpAccountId: smtpAccountId,  // ✅ Track in history
                    fromEmail: fromEmail
                }],
                ':updatedAt': new Date().toISOString()
            }
        }).promise();

        // Update lead status in campaign
        await updateLeadStatusInCampaign(campaign.id, leadEmail, 'sent');

        console.log(`[CampaignExecutor] ✅ Successfully sent step ${stepIndex + 1} to ${leadEmail} from ${fromEmail}`);
        return true;

    } catch (error) {
        const errorEmail = lead.progress?.leadEmail || lead.leadEmail || 'unknown';
        console.error(`[CampaignExecutor] ❌ Failed to send to ${errorEmail}:`, error.message);
        console.error(`[CampaignExecutor] Error stack:`, error.stack);

        // Log failure
        try {
            await dynamoDB.put({
                TableName: EMAIL_LOGS_TABLE,
                Item: {
                    id: uuidv4(),
                    campaignId: campaign.id,
                    email: errorEmail,
                    status: 'failed',
                    stepIndex,
                    error: error.message,
                    errorStack: error.stack,  // ✅ Include stack trace
                    sentAt: new Date().toISOString(),
                    smtpAccountId: smtpAccountId
                }
            }).promise();

            await updateLeadStatusInCampaign(campaign.id, errorEmail, 'bounced');
        } catch (e) {
            console.error(`[CampaignExecutor] Failed to log error:`, e);
        }

        return false;
    }
}
```

---

### Fix 4: UI - Display Account Assignments

**File**: `src/components/campaigns/tabs/LeadsTab.tsx`

Add a column to show which SMTP account is assigned to each lead:

```typescript
// In the leads table, add a column:
<TableHead>Sending Account</TableHead>

// In the row:
<TableCell>
    {lead.sendingAccountId ? (
        <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-blue-500" />
            <span className="text-sm">
                {smtpAccounts.find(acc => acc.id === lead.sendingAccountId)?.fromEmail || 'Unknown'}
            </span>
        </div>
    ) : (
        <span className="text-xs text-gray-400">Not assigned</span>
    )}
</TableCell>
```

---

## 🎯 TESTING CHECKLIST

After implementing fixes, test the following scenarios:

### Scenario 1: Basic Campaign with 2 Accounts, 10 Leads
- [ ] Create campaign
- [ ] Select 2 SMTP accounts
- [ ] Add 10 leads (5 with firstName, 5 without)
- [ ] Create sequence with {{First Name}} variable
- [ ] Start campaign
- [ ] Verify:
  - [ ] Each lead assigned to an account (round-robin: 5 to each)
  - [ ] Emails sent from correct accounts
  - [ ] {{First Name}} replaced correctly
  - [ ] Emails sent within working hours (if timezone enabled)

### Scenario 2: Campaign with Timezone Awareness
- [ ] Add leads from different countries (USA, UK, India)
- [ ] Enable timezone awareness
- [ ] Set working hours: 9 AM - 6 PM
- [ ] Start campaign
- [ ] Verify:
  - [ ] Leads outside working hours are skipped
  - [ ] Logs show timezone info
  - [ ] Emails resume when leads enter working hours

### Scenario 3: Multi-Step Sequence
- [ ] Create 3-step sequence
- [ ] Step 1: Immediate
- [ ] Step 2: 2 days delay
- [ ] Step 3: 5 days delay
- [ ] Start campaign
- [ ] Verify:
  - [ ] Step 1 sends immediately
  - [ ] LeadProgress shows currentStep = 1
  - [ ] Step 2 doesn't send until delay passes
  - [ ] All steps use same SMTP account per lead

### Scenario 4: Stop on Reply
- [ ] Enable stopOnReply
- [ ] Send campaign
- [ ] Manually reply to one email
- [ ] Wait for next scheduler run
- [ ] Verify:
  - [ ] Replied lead status = 'replied'
  - [ ] No more emails sent to that lead
  - [ ] Other leads continue normally

---

## 📈 PERFORMANCE CONSIDERATIONS

### Current Bottlenecks:
1. **DynamoDB Scans**: `getLeadsNeedingEmails()` scans entire LeadProgress table
   - **Optimization**: Add GSI on `campaignId` + `status`
   
2. **Sequential Email Sending**: Emails sent one-by-one with delays
   - **Current**: 10 emails with 10min delay = 100 minutes
   - **Optimization**: Batch emails by account, send in parallel

3. **Status Checks**: Campaign status checked every 3 emails
   - **Current**: Good balance
   - **Keep as-is**

### Recommended Optimizations:

```javascript
// Add DynamoDB GSI:
{
    IndexName: 'CampaignStatusIndex',
    KeySchema: [
        { AttributeName: 'campaignId', KeyType: 'HASH' },
        { AttributeName: 'status', KeyType: 'RANGE' }
    ],
    Projection: { ProjectionType: 'ALL' }
}

// Then update getLeadsNeedingEmails():
async function getLeadsNeedingEmails(campaignId, sequence, options) {
    const data = await dynamoDB.query({
        TableName: LEAD_PROGRESS_TABLE,
        IndexName: 'CampaignStatusIndex',
        KeyConditionExpression: 'campaignId = :campaignId',
        FilterExpression: '#status IN (:pending, :inProgress)',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
            ':campaignId': campaignId,
            ':pending': 'pending',
            ':inProgress': 'in_progress'
        }
    }).promise();
    
    // ... rest of logic
}
```

---

## 🔐 SECURITY CONSIDERATIONS

### Current Security Measures:
✅ SMTP passwords not sent in API responses
✅ JWT authentication on all routes
✅ Campaign ownership validation (via userId/createdBy)

### Potential Vulnerabilities:
⚠️ **IMAP credentials stored in plain text** in DynamoDB
⚠️ **No rate limiting** on campaign execution
⚠️ **No validation** of email addresses before sending

### Recommended Security Enhancements:

```javascript
// 1. Encrypt SMTP/IMAP passwords
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32-byte key
const IV_LENGTH = 16;

function encrypt(text) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
    const parts = text.split(':');
    const iv = Buffer.from(parts.shift(), 'hex');
    const encrypted = Buffer.from(parts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

// 2. Validate email addresses
function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// 3. Rate limiting
const rateLimits = new Map();

function checkRateLimit(userId, maxPerHour = 1000) {
    const now = Date.now();
    const hourAgo = now - 60 * 60 * 1000;
    
    if (!rateLimits.has(userId)) {
        rateLimits.set(userId, []);
    }
    
    const userRequests = rateLimits.get(userId).filter(t => t > hourAgo);
    
    if (userRequests.length >= maxPerHour) {
        throw new Error('Rate limit exceeded');
    }
    
    userRequests.push(now);
    rateLimits.set(userId, userRequests);
}
```

---

## 📝 SUMMARY OF REQUIRED CHANGES

### High Priority (Critical):
1. ✅ **CampaignWizard.tsx**: Assign `sendingAccountId` to leads before saving
2. ✅ **campaignExecutor.js**: Fix `replaceVariables()` to handle empty strings
3. ✅ **campaignExecutor.js**: Add enhanced logging for debugging

### Medium Priority (Important):
4. ✅ **LeadsTab.tsx**: Display assigned SMTP account in UI
5. ✅ **AccountsTab.tsx**: Show email preview with personalized content
6. ✅ **DynamoDB**: Add GSI for performance optimization

### Low Priority (Nice to Have):
7. ⚠️ Encrypt SMTP/IMAP passwords
8. ⚠️ Add rate limiting
9. ⚠️ Add email validation

---

## 🚀 DEPLOYMENT PLAN

### Phase 1: Critical Fixes (Deploy ASAP)
1. Fix account assignment in wizard
2. Fix variable replacement
3. Add enhanced logging
4. Deploy to production
5. Monitor logs for 24 hours

### Phase 2: UI Improvements (Deploy within 1 week)
1. Update LeadsTab to show account assignments
2. Update AccountsTab to show email previews
3. Add better error messages
4. Deploy to production

### Phase 3: Performance & Security (Deploy within 2 weeks)
1. Add DynamoDB GSI
2. Implement encryption
3. Add rate limiting
4. Deploy to production

---

## 📞 SUPPORT & MONITORING

### Key Metrics to Monitor:
- Campaign execution success rate
- Email delivery rate (sent vs failed)
- Average time to send per lead
- SMTP account utilization (balanced?)
- Variable replacement accuracy

### Log Locations:
- Campaign execution: `[CampaignExecutor]` prefix
- Email sending: `[CampaignExecutor] 📧 EMAIL PREVIEW`
- Routing: `[CampaignExecutor] 🔄 Routing to:`
- Timezone: `[Timezone] Lead ${email}:`

### Common Issues & Solutions:

| Issue | Symptom | Solution |
|-------|---------|----------|
| Emails not sending | Campaign active but sentCount = 0 | Check if leads have `sendingAccountId` |
| Variables not replaced | Email shows `{{First Name}}` | Check leadData has firstName field |
| Wrong account used | Email sent from unexpected account | Check lead.sendingAccountId assignment |
| Timezone skip | Lead skipped but should send | Check lead's timezone and working hours |
| All accounts exhausted | `routingExhausted > 0` | Increase `maxEmailsPerAccountPerDay` |

---

**End of Analysis**

Generated: 2026-01-07
Version: 1.0
