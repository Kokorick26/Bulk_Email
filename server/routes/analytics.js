import express from 'express';
import dynamoDB from '../db.js';
import auth from '../middleware/auth.js';

const router = express.Router();

const CAMPAIGNS_TABLE = 'EmailCampaigns';
const EMAIL_LOGS_TABLE = 'EmailLogs';
const LEAD_PROGRESS_TABLE = 'LeadProgress';

/**
 * Analytics Calculation Guide:
 * 
 * 1. SENT COUNT
 *    - Source: LeadProgress entries with status = 'sent', 'opened', 'clicked', 'replied'
 *    - Also stored directly on campaign.sentCount
 * 
 * 2. OPEN COUNT
 *    - Source: Tracking pixel hits (GET /api/tracking/:uniqueId)
 *    - Each hit creates an EmailLogs entry with status='open'
 *    - Campaign.openCount is atomically incremented
 *    - Note: Same email can be opened multiple times (we count unique opens)
 * 
 * 3. CLICK COUNT
 *    - Source: Wrapped link clicks (GET /api/tracking/click/:uniqueId?url=...)
 *    - Each hit creates an EmailLogs entry with status='clicked'
 *    - Campaign.clickCount is atomically incremented
 * 
 * 4. REPLY COUNT
 *    - Source: IMAP inbox checking (ReplyChecker service)
 *    - Matches incoming emails to campaign leads by email address
 *    - Updates LeadProgress status to 'replied'
 *    - Increments campaign.replyCount
 * 
 * 5. BOUNCE COUNT
 *    - Source: Bounce detection from mailer-daemon replies
 *    - Updates LeadProgress status to 'bounced'
 *    - Increments campaign.bounceCount
 */

// GET /api/analytics/campaign/:campaignId - Get comprehensive analytics for a campaign
router.get('/campaign/:campaignId', auth, async (req, res) => {
    try {
        const { campaignId } = req.params;

        // 1. Get Campaign data
        const campaignData = await dynamoDB.get({
            TableName: CAMPAIGNS_TABLE,
            Key: { id: campaignId }
        }).promise();

        if (!campaignData.Item) {
            return res.status(404).json({ error: 'Campaign not found' });
        }

        const campaign = campaignData.Item;

        // 2. Get all LeadProgress entries for this campaign
        // Try GSI first, fallback to scan if GSI doesn't exist
        let leads = [];
        try {
            const leadProgressData = await dynamoDB.query({
                TableName: LEAD_PROGRESS_TABLE,
                IndexName: 'CampaignIdIndex',
                KeyConditionExpression: 'campaignId = :campaignId',
                ExpressionAttributeValues: { ':campaignId': campaignId }
            }).promise();
            leads = leadProgressData.Items || [];
        } catch (gsiError) {
            console.log('[Analytics] GSI query failed, falling back to scan:', gsiError.code);
            // Fallback: scan the table
            try {
                const scanData = await dynamoDB.scan({
                    TableName: LEAD_PROGRESS_TABLE,
                    FilterExpression: 'campaignId = :campaignId',
                    ExpressionAttributeValues: { ':campaignId': campaignId }
                }).promise();
                leads = scanData.Items || [];
            } catch (scanErr) {
                console.log('[Analytics] LeadProgress scan also failed');
            }
        }

        // 2b. FALLBACK: If no LeadProgress entries, use campaign.leads array
        if (leads.length === 0 && campaign.leads && campaign.leads.length > 0) {
            console.log(`[Analytics] Using campaign.leads array (${campaign.leads.length} leads)`);
            leads = campaign.leads.map(l => ({
                leadEmail: l.email,
                status: l.status || 'pending',
                hasReplied: l.hasReplied || false
            }));
        }

        // 3. Get all tracking logs for this campaign
        const logsData = await dynamoDB.scan({
            TableName: EMAIL_LOGS_TABLE,
            FilterExpression: 'campaignId = :campaignId',
            ExpressionAttributeValues: { ':campaignId': campaignId }
        }).promise();

        const logs = logsData.Items || [];

        // 4. Calculate metrics from leads
        const statusCounts = {
            pending: 0,
            sent: 0,
            in_progress: 0,  // FIX: Also track in_progress for backwards compatibility
            opened: 0,
            clicked: 0,
            replied: 0,
            bounced: 0,
            failed: 0,
            unsubscribed: 0,
            completed: 0  // FIX: Track completed status
        };

        leads.forEach(lead => {
            const status = lead.status || 'pending';
            if (statusCounts.hasOwnProperty(status)) {
                statusCounts[status]++;
            } else {
                statusCounts.pending++;
            }
        });

        // 5. Calculate unique opens/clicks from logs
        const uniqueOpens = new Set();
        const uniqueClicks = new Set();
        const opensByCountry = {};
        const clicksByUrl = {};
        const opensByHour = Array(24).fill(0);
        const opensByDay = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };

        logs.forEach(log => {
            if (log.status === 'open') {
                const key = log.uniqueId?.split('-')[1] || log.uniqueId; // recipient index
                uniqueOpens.add(key);

                // Track by country
                const country = log.country || 'Unknown';
                opensByCountry[country] = (opensByCountry[country] || 0) + 1;

                // Track by hour and day
                if (log.openedAt) {
                    const date = new Date(log.openedAt);
                    opensByHour[date.getHours()]++;
                    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                    opensByDay[days[date.getDay()]]++;
                }
            }

            if (log.status === 'clicked') {
                const key = log.uniqueId?.split('-')[1] || log.uniqueId;
                uniqueClicks.add(key);

                // Track by URL
                const url = log.targetUrl || 'Unknown';
                clicksByUrl[url] = (clicksByUrl[url] || 0) + 1;
            }
        });

        // 6. Build analytics response
        const totalLeads = leads.length || campaign.totalRecipients || 0;
        // FIX: Also count 'in_progress' and 'completed' status as sent for backwards compatibility
        const sentCount = statusCounts.sent + statusCounts.in_progress + statusCounts.completed + statusCounts.opened + statusCounts.clicked + statusCounts.replied;
        const openCount = uniqueOpens.size || campaign.openCount || 0;
        const clickCount = uniqueClicks.size || campaign.clickCount || 0;
        const replyCount = statusCounts.replied || campaign.replyCount || 0;
        const bounceCount = statusCounts.bounced || campaign.bounceCount || 0;
        const failedCount = statusCounts.failed || campaign.failedCount || 0;

        // 7. Calculate rates
        const openRate = sentCount > 0 ? ((openCount / sentCount) * 100).toFixed(2) : "0.00";
        const clickRate = openCount > 0 ? ((clickCount / openCount) * 100).toFixed(2) : "0.00";
        const replyRate = sentCount > 0 ? ((replyCount / sentCount) * 100).toFixed(2) : "0.00";
        const bounceRate = sentCount > 0 ? ((bounceCount / sentCount) * 100).toFixed(2) : "0.00";
        const deliveryRate = totalLeads > 0 ? (((sentCount - bounceCount) / totalLeads) * 100).toFixed(2) : "0.00";

        // 8. Build response
        const analytics = {
            campaignId,
            campaignName: campaign.name,
            status: campaign.status,

            // Summary Stats
            summary: {
                totalRecipients: totalLeads,
                sentCount,
                openCount,
                clickCount,
                replyCount,
                bounceCount,
                failedCount,
                pendingCount: statusCounts.pending,
                unsubscribedCount: statusCounts.unsubscribed
            },

            // Rates
            rates: {
                openRate: parseFloat(openRate),
                clickRate: parseFloat(clickRate),
                replyRate: parseFloat(replyRate),
                bounceRate: parseFloat(bounceRate),
                deliveryRate: parseFloat(deliveryRate)
            },

            // Funnel Data
            funnel: [
                { stage: 'Sent', count: sentCount, percentage: 100 },
                { stage: 'Opened', count: openCount, percentage: sentCount > 0 ? parseFloat(openRate) : 0 },
                { stage: 'Clicked', count: clickCount, percentage: openCount > 0 ? parseFloat(clickRate) : 0 },
                { stage: 'Replied', count: replyCount, percentage: sentCount > 0 ? parseFloat(replyRate) : 0 }
            ],

            // Geographic Data
            geography: {
                byCountry: opensByCountry
            },

            // Engagement Patterns
            engagement: {
                byHour: opensByHour,
                byDay: opensByDay,
                topLinks: Object.entries(clicksByUrl)
                    .map(([url, count]) => ({ url, count }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 10)
            },

            // Lead Status Distribution
            leadStatus: statusCounts,

            // Timestamps
            createdAt: campaign.createdAt,
            lastUpdated: new Date().toISOString()
        };

        res.json(analytics);

    } catch (err) {
        console.error('[Analytics] Error:', err);
        res.status(500).json({ error: 'Failed to calculate analytics' });
    }
});

// GET /api/analytics/overview - Get overall analytics across all campaigns
router.get('/overview', auth, async (req, res) => {
    try {
        const userId = req.user.userId;

        // Get all campaigns for this user
        const campaignsData = await dynamoDB.scan({
            TableName: CAMPAIGNS_TABLE,
            FilterExpression: 'userId = :userId',
            ExpressionAttributeValues: { ':userId': userId }
        }).promise();

        const campaigns = campaignsData.Items || [];

        // Aggregate stats
        let totalSent = 0;
        let totalOpens = 0;
        let totalClicks = 0;
        let totalReplies = 0;
        let totalBounces = 0;
        let totalRecipients = 0;
        let activeCampaigns = 0;
        let completedCampaigns = 0;
        let draftCampaigns = 0;

        campaigns.forEach(c => {
            totalSent += c.sentCount || 0;
            totalOpens += c.openCount || 0;
            totalClicks += c.clickCount || 0;
            totalReplies += c.replyCount || 0;
            totalBounces += c.bounceCount || 0;
            totalRecipients += c.totalRecipients || 0;

            if (c.status === 'sending' || c.status === 'active') activeCampaigns++;
            else if (c.status === 'completed') completedCampaigns++;
            else if (c.status === 'draft') draftCampaigns++;
        });

        const overview = {
            totalCampaigns: campaigns.length,
            activeCampaigns,
            completedCampaigns,
            draftCampaigns,

            totalRecipients,
            totalSent,
            totalOpens,
            totalClicks,
            totalReplies,
            totalBounces,

            avgOpenRate: totalSent > 0 ? ((totalOpens / totalSent) * 100).toFixed(2) : "0.00",
            avgClickRate: totalOpens > 0 ? ((totalClicks / totalOpens) * 100).toFixed(2) : "0.00",
            avgReplyRate: totalSent > 0 ? ((totalReplies / totalSent) * 100).toFixed(2) : "0.00",
            avgBounceRate: totalSent > 0 ? ((totalBounces / totalSent) * 100).toFixed(2) : "0.00",

            // Recent campaigns performance
            recentCampaigns: campaigns
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 5)
                .map(c => ({
                    id: c.id,
                    name: c.name,
                    status: c.status,
                    sent: c.sentCount || 0,
                    opens: c.openCount || 0,
                    replies: c.replyCount || 0,
                    openRate: c.sentCount > 0 ? ((c.openCount || 0) / c.sentCount * 100).toFixed(1) : "0.0"
                }))
        };

        res.json(overview);

    } catch (err) {
        console.error('[Analytics] Overview error:', err);
        res.status(500).json({ error: 'Failed to fetch overview' });
    }
});

// POST /api/analytics/recalculate/:campaignId - Force recalculate campaign stats
router.post('/recalculate/:campaignId', auth, async (req, res) => {
    try {
        const { campaignId } = req.params;

        // Get campaign data first (needed for fallback)
        const campaignData = await dynamoDB.get({
            TableName: CAMPAIGNS_TABLE,
            Key: { id: campaignId }
        }).promise();

        if (!campaignData.Item) {
            return res.status(404).json({ error: 'Campaign not found' });
        }

        const campaign = campaignData.Item;

        // Get leads for this campaign with fallback
        let leads = [];
        try {
            const leadsData = await dynamoDB.query({
                TableName: LEAD_PROGRESS_TABLE,
                IndexName: 'CampaignIdIndex',
                KeyConditionExpression: 'campaignId = :campaignId',
                ExpressionAttributeValues: { ':campaignId': campaignId }
            }).promise();
            leads = leadsData.Items || [];
        } catch (gsiError) {
            console.log('[Analytics] GSI query failed, falling back to scan');
            try {
                const scanData = await dynamoDB.scan({
                    TableName: LEAD_PROGRESS_TABLE,
                    FilterExpression: 'campaignId = :campaignId',
                    ExpressionAttributeValues: { ':campaignId': campaignId }
                }).promise();
                leads = scanData.Items || [];
            } catch (scanErr) {
                console.log('[Analytics] LeadProgress scan also failed');
            }
        }

        // Fallback to campaign.leads array
        if (leads.length === 0 && campaign.leads && campaign.leads.length > 0) {
            console.log(`[Analytics] Recalculate using campaign.leads array (${campaign.leads.length} leads)`);
            leads = campaign.leads.map(l => ({
                leadEmail: l.email,
                status: l.status || 'pending',
                hasReplied: l.hasReplied || false
            }));
        }

        // Get tracking logs
        const logsData = await dynamoDB.scan({
            TableName: EMAIL_LOGS_TABLE,
            FilterExpression: 'campaignId = :campaignId',
            ExpressionAttributeValues: { ':campaignId': campaignId }
        }).promise();

        const logs = logsData.Items || [];

        // Calculate fresh stats
        let sentCount = 0;
        let failedCount = 0;
        let replyCount = 0;
        let bounceCount = 0;

        leads.forEach(lead => {
            const status = lead.status;
            // FIX: Also count 'in_progress' and 'completed' as sent for backwards compatibility
            if (['sent', 'in_progress', 'completed', 'opened', 'clicked', 'replied'].includes(status)) sentCount++;
            if (status === 'failed') failedCount++;
            if (status === 'replied') replyCount++;
            if (status === 'bounced') bounceCount++;
        });

        // Count unique opens and clicks from logs
        const uniqueOpens = new Set();
        const uniqueClicks = new Set();

        logs.forEach(log => {
            if (log.status === 'open') {
                uniqueOpens.add(log.uniqueId);
            }
            if (log.status === 'clicked') {
                uniqueClicks.add(log.uniqueId);
            }
        });

        // Update campaign with fresh stats
        await dynamoDB.update({
            TableName: CAMPAIGNS_TABLE,
            Key: { id: campaignId },
            UpdateExpression: `SET 
                sentCount = :sentCount,
                failedCount = :failedCount,
                openCount = :openCount,
                clickCount = :clickCount,
                replyCount = :replyCount,
                bounceCount = :bounceCount,
                totalRecipients = :totalRecipients,
                updatedAt = :updatedAt
            `,
            ExpressionAttributeValues: {
                ':sentCount': sentCount,
                ':failedCount': failedCount,
                ':openCount': uniqueOpens.size,
                ':clickCount': uniqueClicks.size,
                ':replyCount': replyCount,
                ':bounceCount': bounceCount,
                ':totalRecipients': leads.length,
                ':updatedAt': new Date().toISOString()
            }
        }).promise();

        res.json({
            success: true,
            message: 'Campaign stats recalculated',
            stats: {
                totalRecipients: leads.length,
                sentCount,
                failedCount,
                openCount: uniqueOpens.size,
                clickCount: uniqueClicks.size,
                replyCount,
                bounceCount
            }
        });

    } catch (err) {
        console.error('[Analytics] Recalculate error:', err);
        res.status(500).json({ error: 'Failed to recalculate' });
    }
});

export default router;
