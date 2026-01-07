import express from 'express';
import geoip from 'geoip-lite';
import dynamoDB from '../db.js';

const router = express.Router();
const EMAIL_LOGS_TABLE = 'EmailLogs';
const CAMPAIGNS_TABLE = 'EmailCampaigns';
const LEAD_PROGRESS_TABLE = 'LeadProgress';

// Helper to get IP
const getIp = (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded ? forwarded.split(/, /)[0] : (req.socket.remoteAddress || req.ip);
    // Handle localhost IPv6
    if (ip === '::1' || ip === '::ffff:127.0.0.1') return '127.0.0.1';
    return ip;
};

// 1x1 Transparent GIF
const PIXEL_BUFFER = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');

// TRACK OPEN
router.get('/:uniqueId', async (req, res) => {
    // Always return image immediately to avoid blocking email client
    res.writeHead(200, {
        'Content-Type': 'image/gif',
        'Content-Length': PIXEL_BUFFER.length,
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Expires': '0',
        'Pragma': 'no-cache',
    });
    res.end(PIXEL_BUFFER);

    try {
        const { uniqueId } = req.params;
        // Format: campaignId-recipientIndex-timestamp OR uuid (if we change format later)
        // For now, let's assume we can try to find the log by uniqueId if we stored it, 
        // OR we just log a new event if we can parse the Campaign ID.

        // However, in campaignExecutor.js, we generate uniqueId but don't explicitly store it in EmailLogs as a key.
        // We stored `messageId`. 
        // The uniqueId in the pixel is `campaignId-recipientIndex-timestamp`.

        // Let's parse it to get campaignId at least
        const parts = uniqueId.split('-');
        if (parts.length < 2) return;

        const campaignId = parts[0];
        // const recipientIndex = parts[1];

        const ip = getIp(req);
        const geo = geoip.lookup(ip);
        const userAgent = req.headers['user-agent'];

        console.log(`[Tracking] Open detected from IP: ${ip} (${geo?.country || 'Unknown'})`);

        // We need to find the specific log entry to update it. 
        // Since we don't have the log ID in the uniqueId (pixel was generated with campaign-index-time), 
        // we might have to rely on `campaignId` and maybe `recipientIndex` if we stored it.
        // Or better: update `LeadProgress` since that tracks the relationship.

        // Actually, let's just create a NEW tracking log event for aggregation? 
        // OR update the original sent log if we can find it.
        // Simpler for analytics: Just store a new "OpenEvent".
        // BUT existing analytics relies on `EmailLogs`.

        // Strategy: We will update the `LeadProgress` for this lead (if we can find it) AND log an Open event.
        // Since `uniqueId` contains `recipientIndex`, and `EmailLogs` stores `stepIndex`, it's not a direct map.
        // Let's iterate: The system asks for "Traffic coming from".

        // We will store a specialized "TrackingLog" or update "EmailLogs". 
        // Updating `EmailLogs` is hard without the primary key (ID). 
        // Let's create a new item in `EmailLogs` with status='open' so we can count them later.

        const logItem = {
            id: `open_${uniqueId}_${Date.now()}`,
            campaignId: campaignId,
            uniqueId: uniqueId, // Store the ID passed
            status: 'open',
            ip: ip,
            country: geo?.country || 'Unknown',
            city: geo?.city || 'Unknown',
            region: geo?.region || 'Unknown',
            userAgent: userAgent,
            openedAt: new Date().toISOString(),
            createdAt: new Date().toISOString()
        };

        await dynamoDB.put({
            TableName: EMAIL_LOGS_TABLE,
            Item: logItem
        }).promise();

        // Also update Campaign Stats (Open Count) atomically
        await dynamoDB.update({
            TableName: CAMPAIGNS_TABLE,
            Key: { id: campaignId },
            UpdateExpression: 'SET openCount = if_not_exists(openCount, :zero) + :one',
            ExpressionAttributeValues: { ':zero': 0, ':one': 1 }
        }).promise();

    } catch (error) {
        console.error('[Tracking] Error processing open pixel:', error);
    }
});

// TRACK CLICK
router.get('/click/:uniqueId', async (req, res) => {
    const { uniqueId } = req.params;
    const targetUrl = req.query.url;

    if (!targetUrl) {
        return res.status(400).send('Missing target URL');
    }

    // Redirect immediately
    res.redirect(targetUrl);

    try {
        const parts = uniqueId.split('-');
        if (parts.length < 2) return;
        const campaignId = parts[0];

        const ip = getIp(req);
        const geo = geoip.lookup(ip);
        const userAgent = req.headers['user-agent'];

        console.log(`[Tracking] Click detected from IP: ${ip} (${geo?.country || 'Unknown'})`);

        // Log the Click
        const logItem = {
            id: `click_${uniqueId}_${Date.now()}`,
            campaignId: campaignId,
            uniqueId: uniqueId,
            status: 'clicked',
            targetUrl: targetUrl,
            ip: ip,
            country: geo?.country || 'Unknown',
            city: geo?.city || 'Unknown',
            region: geo?.region || 'Unknown',
            userAgent: userAgent,
            clickedAt: new Date().toISOString(),
            createdAt: new Date().toISOString()
        };

        await dynamoDB.put({
            TableName: EMAIL_LOGS_TABLE,
            Item: logItem
        }).promise();

        // Update Campaign Stats (Click Count)
        await dynamoDB.update({
            TableName: CAMPAIGNS_TABLE,
            Key: { id: campaignId },
            UpdateExpression: 'SET clickCount = if_not_exists(clickCount, :zero) + :one',
            ExpressionAttributeValues: { ':zero': 0, ':one': 1 }
        }).promise();

    } catch (error) {
        console.error('[Tracking] Error processing click:', error);
    }
});

export default router;
