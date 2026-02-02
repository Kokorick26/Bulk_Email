# Campaign Real-Time Updates & Reply Tracking - Implementation Plan

## Issues Identified

### 1. ❌ Lead Status Not Updating in UI
**Problem**: Emails are sent successfully, but UI still shows "Pending" status
- Lead #1: ✅ Shows "Now" with green checkmark (working)
- Lead #2 & #3: ❌ Show scheduled time but status is "Pending" (not working)

**Root Cause**: No real-time update mechanism (no WebSocket)

### 2. ❓ Reply Tracking Status Unknown
**Found**: `checkForReplies()` function exists in `campaignExecutor.js`
**Need to verify**: 
- Is it being called regularly?
- Does it update lead status when reply detected?
- Is the UI showing reply status?

---

## Solution: Implement Real-Time Updates

### Option 1: Polling (Quick Fix)
**Pros**: Simple, works immediately
**Cons**: Not truly real-time, more server load

**Implementation**:
1. Frontend polls `/api/bulk-email/campaigns/:id` every 5-10 seconds
2. Updates lead statuses when data changes
3. Shows reply status if detected

### Option 2: WebSocket (Proper Solution)
**Pros**: True real-time, efficient
**Cons**: More complex, requires Socket.IO

**Implementation**:
1. Add Socket.IO to server
2. Emit events when:
   - Email sent
   - Lead status changes
   - Reply detected
3. Frontend listens and updates UI instantly

---

## Current Reply Tracking Analysis

### How It Works Now:
```javascript
// server/services/campaignExecutor.js
async function checkForReplies(smtpAccount, leadEmail, sinceDate) {
    // Connects to IMAP
    // Searches for replies from leadEmail
    // Returns true if reply found
}
```

### When It's Called:
- Before sending each email in a sequence
- Checks if lead has replied to previous emails
- If replied, skips sending next email

### Issues:
1. ❓ Not clear if it updates lead status to "replied"
2. ❓ Not clear if it runs continuously or only during campaign execution
3. ❌ No real-time notification to UI

---

## Recommended Implementation

### Phase 1: Fix Status Updates (Immediate)
1. **Add polling to LeadsTab**:
   ```typescript
   useEffect(() => {
       const interval = setInterval(() => {
           fetchCampaignData(); // Refresh every 10 seconds
       }, 10000);
       return () => clearInterval(interval);
   }, [campaignId]);
   ```

2. **Ensure backend returns correct status**:
   - Verify lead status is being updated in DynamoDB
   - Check if API returns latest status

### Phase 2: Improve Reply Tracking
1. **Add periodic reply checking**:
   ```javascript
   // Run every 5 minutes
   setInterval(async () => {
       await checkAllCampaignsForReplies();
   }, 5 * 60 * 1000);
   ```

2. **Update lead status when reply detected**:
   ```javascript
   if (hasReplied) {
       await updateLeadStatus(leadId, 'replied');
   }
   ```

### Phase 3: Add WebSocket (Future)
1. Install Socket.IO
2. Emit events on status changes
3. Update UI instantly

---

## Quick Fixes to Implement Now

### Fix 1: Add Polling to LeadsTab
**File**: `src/components/campaigns/tabs/LeadsTab.tsx`
**Change**: Add auto-refresh every 10 seconds

### Fix 2: Verify Status Update Logic
**File**: `server/services/campaignExecutor.js`
**Check**: Ensure `updateLeadStatus()` is called after email sent

### Fix 3: Add Reply Status Column
**File**: `src/components/campaigns/tabs/LeadsTab.tsx`
**Add**: Show "Replied" badge when lead has replied

---

## Testing Checklist

### Status Updates:
- [ ] Send campaign with 3 leads
- [ ] Verify all 3 show "Pending" initially
- [ ] After emails sent, verify status changes to "Sent"
- [ ] Verify timestamp shows correct send time

### Reply Tracking:
- [ ] Reply to a campaign email
- [ ] Wait 5 minutes (or trigger manual check)
- [ ] Verify lead status changes to "Replied"
- [ ] Verify next sequence email is NOT sent

### Real-Time Updates:
- [ ] Open campaign in browser
- [ ] Start campaign
- [ ] Verify UI updates without manual refresh
- [ ] Check update frequency (should be ~10 seconds)

---

## Next Steps

1. **Immediate**: Implement polling for status updates
2. **Short-term**: Verify and fix reply tracking
3. **Long-term**: Add WebSocket for true real-time updates

Would you like me to:
A) Implement polling now (quick fix)
B) Add WebSocket (proper solution)
C) First investigate why status isn't updating
