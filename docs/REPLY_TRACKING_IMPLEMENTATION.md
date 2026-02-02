# Reply Tracking & Sequence Automation - Complete Implementation

## User Requirements

### 1. Reply Status Display
- Show "Received Reply" badge/indicator in leads table
- Make it clickable to view the actual reply
- Show reply timestamp

### 2. Sequence Automation Logic
```
IF lead replies → STOP sequence (don't send more emails)
IF no reply after delay → SEND next email in sequence
```

---

## Implementation Plan

### Part 1: Backend - Reply Detection & Storage

#### 1.1 Update Lead Progress Schema
Add reply tracking to lead progress:
```javascript
{
    leadId: "lead-123",
    campaignId: "campaign-456",
    currentStep: 1,
    status: "sent" | "replied" | "pending",
    lastEmailSentAt: "2026-01-07T12:00:00Z",
    replyReceivedAt: "2026-01-07T14:30:00Z",  // NEW
    replySubject: "Re: Quick question",        // NEW
    replyBody: "Thanks for reaching out...",   // NEW
    replyFrom: "lead@example.com",             // NEW
    hasReplied: true                           // NEW
}
```

#### 1.2 Enhance Reply Checking
**File**: `server/services/campaignExecutor.js`

Current function:
```javascript
async function checkForReplies(smtpAccount, leadEmail, sinceDate) {
    // Returns true/false
}
```

Enhanced function:
```javascript
async function checkForReplies(smtpAccount, leadEmail, sinceDate) {
    // Returns: { hasReplied: true, replyData: {...} }
    return {
        hasReplied: true,
        replyData: {
            from: "lead@example.com",
            subject: "Re: Quick question",
            body: "Thanks for reaching out...",
            receivedAt: "2026-01-07T14:30:00Z"
        }
    };
}
```

#### 1.3 Store Reply Data
When reply detected:
```javascript
if (replyResult.hasReplied) {
    await updateLeadProgress(leadId, {
        status: 'replied',
        hasReplied: true,
        replyReceivedAt: replyResult.replyData.receivedAt,
        replySubject: replyResult.replyData.subject,
        replyBody: replyResult.replyData.body,
        replyFrom: replyResult.replyData.from
    });
}
```

#### 1.4 Add Reply Checking Scheduler
Run every 5 minutes to check for new replies:
```javascript
// server/index.js
setInterval(async () => {
    await checkAllActiveCampaignsForReplies();
}, 5 * 60 * 1000); // Every 5 minutes
```

---

### Part 2: Backend - Sequence Automation

#### 2.1 Sequence Logic
```javascript
async function processSequenceStep(campaign, lead) {
    // Check if lead has replied
    if (lead.hasReplied) {
        console.log(`Lead ${lead.email} has replied - stopping sequence`);
        return; // Don't send more emails
    }
    
    // Check if enough time has passed since last email
    const daysSinceLastEmail = getDaysSince(lead.lastEmailSentAt);
    const nextStep = campaign.sequence.steps[lead.currentStep + 1];
    
    if (daysSinceLastEmail >= nextStep.delayDays) {
        // Send next email
        await sendSequenceEmail(campaign, lead, nextStep);
    }
}
```

#### 2.2 API Endpoint to Get Reply
**File**: `server/routes/bulk-email.js`
```javascript
// GET /api/bulk-email/campaigns/:campaignId/leads/:leadId/reply
router.get('/campaigns/:campaignId/leads/:leadId/reply', auth, async (req, res) => {
    const { campaignId, leadId } = req.params;
    
    // Get lead progress with reply data
    const leadProgress = await getLeadProgress(campaignId, leadId);
    
    if (!leadProgress.hasReplied) {
        return res.json({ hasReply: false });
    }
    
    res.json({
        hasReply: true,
        reply: {
            from: leadProgress.replyFrom,
            subject: leadProgress.replySubject,
            body: leadProgress.replyBody,
            receivedAt: leadProgress.replyReceivedAt
        }
    });
});
```

---

### Part 3: Frontend - Reply Status Display

#### 3.1 Update LeadsTab to Show Reply Status
**File**: `src/components/campaigns/tabs/LeadsTab.tsx`

Add reply column:
```tsx
{
    id: 'reply',
    label: 'Reply Status',
    icon: MessageSquare,
    render: (lead) => {
        if (lead.hasReplied) {
            return (
                <button
                    onClick={() => openReplyModal(lead)}
                    className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 hover:bg-green-200"
                >
                    <CheckCircle className="w-4 h-4" />
                    <span>Received Reply</span>
                </button>
            );
        }
        return <span className="text-gray-400">No reply</span>;
    }
}
```

#### 3.2 Reply Modal Component
```tsx
function ReplyModal({ lead, onClose }) {
    const [reply, setReply] = useState(null);
    
    useEffect(() => {
        fetchReply(lead.id).then(setReply);
    }, [lead.id]);
    
    return (
        <Modal onClose={onClose}>
            <h2>Reply from {lead.email}</h2>
            <div className="reply-content">
                <p><strong>Subject:</strong> {reply.subject}</p>
                <p><strong>Received:</strong> {formatDate(reply.receivedAt)}</p>
                <div className="reply-body">
                    {reply.body}
                </div>
            </div>
        </Modal>
    );
}
```

#### 3.3 Add Auto-Refresh (Polling)
```tsx
useEffect(() => {
    const interval = setInterval(() => {
        fetchCampaignData(); // Refresh every 10 seconds
    }, 10000);
    return () => clearInterval(interval);
}, [campaignId]);
```

---

### Part 4: Sequence Tab - Show Next Email Schedule

#### 4.1 Display Sequence Progress
**File**: `src/components/campaigns/tabs/SequencesTab.tsx`

Show for each lead:
```tsx
<div className="sequence-status">
    {lead.hasReplied ? (
        <Badge color="green">Replied - Sequence Stopped</Badge>
    ) : (
        <div>
            <Badge color="blue">Step {lead.currentStep} of {totalSteps}</Badge>
            {lead.currentStep < totalSteps && (
                <p className="text-sm text-gray-500">
                    Next email in {daysUntilNext} days
                </p>
            )}
        </div>
    )}
</div>
```

---

## Implementation Steps

### Step 1: Backend Reply Storage ✅
1. Update `checkForReplies()` to return reply data
2. Store reply in lead progress
3. Update lead status to "replied"

### Step 2: Reply Checking Scheduler ✅
1. Add interval to check for replies every 5 minutes
2. Update all active campaigns

### Step 3: Sequence Automation ✅
1. Check if lead replied before sending next email
2. If replied, skip remaining sequence
3. If not replied, send next email after delay

### Step 4: Frontend Reply Display ✅
1. Add "Reply Status" column to leads table
2. Show "Received Reply" badge
3. Make it clickable

### Step 5: Reply Modal ✅
1. Create modal to display reply
2. Fetch reply data from API
3. Show subject, body, timestamp

### Step 6: Auto-Refresh ✅
1. Add polling to LeadsTab
2. Refresh every 10 seconds
3. Update UI when status changes

---

## Testing Checklist

### Reply Detection:
- [ ] Send campaign email
- [ ] Reply to the email
- [ ] Wait 5 minutes (or trigger manual check)
- [ ] Verify "Received Reply" badge appears
- [ ] Click badge and verify reply content shows

### Sequence Automation:
- [ ] Create 3-step sequence with 2-day delays
- [ ] Send to lead
- [ ] Lead replies after step 1
- [ ] Verify step 2 is NOT sent
- [ ] Send to another lead who doesn't reply
- [ ] Verify step 2 IS sent after 2 days

### Real-Time Updates:
- [ ] Open campaign in browser
- [ ] Send emails
- [ ] Verify status updates without refresh
- [ ] Verify reply status appears automatically

---

## Priority Order

1. **HIGH**: Add auto-refresh (polling) - Fixes status update issue
2. **HIGH**: Store reply data when detected
3. **HIGH**: Show reply status in UI
4. **MEDIUM**: Add reply modal to view content
5. **MEDIUM**: Implement sequence automation logic
6. **LOW**: Add WebSocket for true real-time (future)

---

**Ready to implement?** I'll start with:
1. Auto-refresh for status updates
2. Reply status display
3. Sequence automation logic

This will give you a fully functional reply tracking and sequence system!
