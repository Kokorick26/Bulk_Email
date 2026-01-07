# Quick Testing Guide

## 🚀 How to Test the Fixes

### Step 1: Restart the Server
The backend changes require a server restart. Your dev server should auto-reload, but if not:
```bash
# Stop current server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 2: Create a Test Campaign

1. **Go to Campaigns** → Click "Create Campaign"

2. **Step 1 - Name**: Enter "Test Campaign - Account Assignment"

3. **Step 2 - Accounts**: 
   - Select **2 or more SMTP accounts**
   - Note which accounts you selected

4. **Step 3 - Leads**: Add test leads
   ```csv
   Email,First Name,Last Name,Company
   test1@example.com,John,Doe,Acme Corp
   test2@example.com,Jane,Smith,Tech Inc
   test3@example.com,,Wilson,StartupXYZ
   test4@example.com,Bob,,
   test5@example.com,,,Solo Corp
   ```
   - Mix of leads with/without names to test variable replacement

5. **Step 4 - Strategy**: Choose "Same Sequence"

6. **Step 5 - Emails**: Create sequence
   ```
   Subject: Hi {{First Name}}, let's connect!
   Body: 
   Hello {{First Name}},

   I'm reaching out from {{Sender Company}} because I think {{Company}} 
   would benefit from our solution.

   Best regards,
   {{Sender Name}}
   {{Sender Position}}
   ```

7. **Step 6 - Schedule**: Use defaults

8. **Step 7 - Launch**: Click "Launch"

### Step 3: Verify Account Assignment

1. **Open the campaign** you just created
2. **Go to "Leads" tab**
3. **Check the "Sending Account" column**:
   - ✅ Should show actual email addresses (e.g., "sender@company.com")
   - ❌ Should NOT show "Not assigned" or "Auto"
   - ✅ Accounts should be distributed round-robin

**Example Expected Result**:
```
Lead 1: account1@company.com
Lead 2: account2@company.com
Lead 3: account1@company.com (wraps around)
Lead 4: account2@company.com
Lead 5: account1@company.com
```

### Step 4: Start Campaign & Check Logs

1. **Click "Start Campaign"**

2. **Open your terminal** where the server is running

3. **Look for these log patterns**:

```
[CampaignExecutor] ========== EMAIL PREPARATION ==========
[CampaignExecutor] Lead: test1@example.com
[CampaignExecutor] SMTP Account: acc-xxx (account1@company.com)
[CampaignExecutor] Lead Data: { firstName: 'John', lastName: 'Doe', ... }

[CampaignExecutor] Subject BEFORE replacement: "Hi {{First Name}}, let's connect!"
[CampaignExecutor] Subject AFTER replacement: "Hi John, let's connect!"

[CampaignExecutor] 📧 FINAL EMAIL PREVIEW:
  To: test1@example.com
  From: "Your Name" <account1@company.com>
  Subject: Hi John, let's connect!
  Body Preview: Hello John, I'm reaching out from Your Company...

[CampaignExecutor] ✅ Successfully sent step 1 to test1@example.com from account1@company.com
```

### Step 5: Verify Variable Replacement

Check the logs for each lead:

**Lead with full name (John Doe)**:
- ✅ Subject: "Hi John, let's connect!"
- ✅ Body: "Hello John,"

**Lead with empty firstName (Wilson)**:
- ✅ Subject: "Hi , let's connect!" OR "Hi Wilson, let's connect!" (if fallback works)
- ✅ Body: "Hello ," OR "Hello Wilson,"

**Lead with no name at all**:
- ✅ Subject: "Hi , let's connect!"
- ✅ Body: "Hello ,"

### Step 6: Check Database (Optional)

If you want to verify the data is saved correctly:

```javascript
// In your database client or API:

// 1. Check campaign leads have sendingAccountId
GET /api/bulk-email/campaigns/{campaignId}
// Look at: leads[].sendingAccountId

// 2. Check email logs have tracking
GET /api/bulk-email/campaigns/{campaignId}
// Look at: logs[].smtpAccountId, logs[].fromEmail

// 3. Check lead progress
// Query LeadProgress table
// Look at: stepHistory[].smtpAccountId, stepHistory[].fromEmail
```

---

## 🐛 Troubleshooting

### Issue: Still seeing "Not assigned"
**Cause**: Old campaign created before fix  
**Solution**: Create a NEW campaign after the fixes

### Issue: Variables not replaced
**Cause**: Lead data missing or empty strings  
**Solution**: Check server logs for "Lead Data:" - verify fields are populated

### Issue: Emails not sending
**Cause**: SMTP configuration issue  
**Solution**: Check error logs for "❌ Failed to send" with stack trace

### Issue: All emails from same account
**Cause**: Only one account selected in wizard  
**Solution**: Select multiple accounts in Step 2

---

## ✅ Success Indicators

You'll know everything is working when:

1. ✅ **Leads Tab** shows actual email addresses in "Sending Account" column
2. ✅ **Server Logs** show structured EMAIL PREPARATION sections
3. ✅ **Variable Replacement** works in logs (BEFORE/AFTER comparison)
4. ✅ **Success Messages** show which account sent each email
5. ✅ **No "Not assigned"** messages in the UI

---

## 📞 Need Help?

If something isn't working:

1. **Check server logs** - Look for errors or unexpected behavior
2. **Verify SMTP accounts** - Make sure they're configured correctly
3. **Check campaign data** - Use API to inspect campaign.leads[].sendingAccountId
4. **Review FIXES_IMPLEMENTED.md** - See what should be happening
5. **Check CAMPAIGN_FLOW_ANALYSIS.md** - Understand the full flow

---

**Happy Testing!** 🎉
