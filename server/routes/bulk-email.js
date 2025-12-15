import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import dynamoDB from '../db.js';
import auth from '../middleware/auth.js';
import nodemailer from 'nodemailer';

const router = express.Router();
const CAMPAIGNS_TABLE = 'EmailCampaigns';
const EMAIL_LOGS_TABLE = 'EmailLogs';
const TEMPLATES_TABLE = 'EmailTemplates';
const SMTP_ACCOUNTS_TABLE = 'SmtpAccounts';
const NEWSLETTER_TABLE = 'NewsletterSubscribers';

// ============ SMTP ACCOUNTS MANAGEMENT ============

// Get all SMTP accounts
router.get('/smtp-accounts', auth, async (req, res) => {
    try {
        const data = await dynamoDB.scan({ TableName: SMTP_ACCOUNTS_TABLE }).promise();
        // Don't send passwords in response
        const accounts = (data.Items || []).map(acc => ({
            ...acc,
            password: acc.password ? '********' : ''
        })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        res.json(accounts);
    } catch (err) {
        console.error('Error fetching SMTP accounts:', err);
        // If table doesn't exist, return empty array
        if (err.code === 'ResourceNotFoundException') {
            return res.json([]);
        }
        res.status(500).json({ error: 'Could not load SMTP accounts' });
    }
});

// Create SMTP account
router.post('/smtp-accounts', auth, async (req, res) => {
    try {
        const { name, host, port, username, password, fromEmail, fromName, isDefault } = req.body;

        if (!name || !host || !port || !username || !password || !fromEmail) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // If this is set as default, unset other defaults
        if (isDefault) {
            const existing = await dynamoDB.scan({ TableName: SMTP_ACCOUNTS_TABLE }).promise();
            for (const acc of (existing.Items || [])) {
                if (acc.isDefault) {
                    await dynamoDB.update({
                        TableName: SMTP_ACCOUNTS_TABLE,
                        Key: { id: acc.id },
                        UpdateExpression: 'SET isDefault = :val',
                        ExpressionAttributeValues: { ':val': false }
                    }).promise();
                }
            }
        }

        const account = {
            id: uuidv4(),
            name,
            host,
            port: Number(port),
            username,
            password,
            fromEmail,
            fromName: fromName || name,
            isDefault: isDefault || false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        await dynamoDB.put({ TableName: SMTP_ACCOUNTS_TABLE, Item: account }).promise();

        res.status(201).json({
            ...account,
            password: '********'
        });
    } catch (err) {
        console.error('Error creating SMTP account:', err);
        res.status(500).json({ error: 'Could not create SMTP account' });
    }
});

// Update SMTP account
router.put('/smtp-accounts/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const existing = await dynamoDB.get({
            TableName: SMTP_ACCOUNTS_TABLE,
            Key: { id }
        }).promise();

        if (!existing.Item) {
            return res.status(404).json({ error: 'SMTP account not found' });
        }

        // If setting as default, unset other defaults
        if (updates.isDefault) {
            const all = await dynamoDB.scan({ TableName: SMTP_ACCOUNTS_TABLE }).promise();
            for (const acc of (all.Items || [])) {
                if (acc.isDefault && acc.id !== id) {
                    await dynamoDB.update({
                        TableName: SMTP_ACCOUNTS_TABLE,
                        Key: { id: acc.id },
                        UpdateExpression: 'SET isDefault = :val',
                        ExpressionAttributeValues: { ':val': false }
                    }).promise();
                }
            }
        }

        const updated = {
            ...existing.Item,
            ...updates,
            // Keep existing password if not provided or if placeholder
            password: (updates.password && updates.password !== '********')
                ? updates.password
                : existing.Item.password,
            id: existing.Item.id,
            updatedAt: new Date().toISOString(),
        };

        await dynamoDB.put({ TableName: SMTP_ACCOUNTS_TABLE, Item: updated }).promise();

        res.json({
            ...updated,
            password: '********'
        });
    } catch (err) {
        console.error('Error updating SMTP account:', err);
        res.status(500).json({ error: 'Could not update SMTP account' });
    }
});

// Delete SMTP account
router.delete('/smtp-accounts/:id', auth, async (req, res) => {
    try {
        await dynamoDB.delete({
            TableName: SMTP_ACCOUNTS_TABLE,
            Key: { id: req.params.id }
        }).promise();
        res.json({ message: 'SMTP account deleted' });
    } catch (err) {
        console.error('Error deleting SMTP account:', err);
        res.status(500).json({ error: 'Could not delete SMTP account' });
    }
});

// Test SMTP connection
router.post('/smtp-accounts/:id/test', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { testEmail } = req.body;

        if (!testEmail) {
            return res.status(400).json({ error: 'Test email address is required' });
        }

        const account = await dynamoDB.get({
            TableName: SMTP_ACCOUNTS_TABLE,
            Key: { id }
        }).promise();

        if (!account.Item) {
            return res.status(404).json({ error: 'SMTP account not found' });
        }

        const transporter = nodemailer.createTransport({
            host: account.Item.host,
            port: account.Item.port,
            secure: account.Item.port === 465,
            auth: {
                user: account.Item.username,
                pass: account.Item.password,
            },
        });

        await transporter.sendMail({
            from: `"${account.Item.fromName}" <${account.Item.fromEmail}>`,
            to: testEmail,
            subject: 'SMTP Test - Kokorick Bulk Email',
            text: 'This is a test email to verify your SMTP configuration is working correctly.',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>SMTP Test Successful!</h2>
                    <p>Your SMTP configuration for <strong>${account.Item.name}</strong> is working correctly.</p>
                    <p style="color: #666;">Sent from Kokorick Bulk Email System</p>
                </div>
            `,
        });

        transporter.close();
        res.json({ message: 'Test email sent successfully!' });
    } catch (err) {
        console.error('SMTP test failed:', err);
        res.status(500).json({ error: err.message || 'SMTP test failed' });
    }
});

// ============ GET TRANSPORTER ============

// Get transporter for a specific account or default/env
async function getTransporter(smtpAccountId = null) {
    let config;

    if (smtpAccountId) {
        // Use specific SMTP account
        const account = await dynamoDB.get({
            TableName: SMTP_ACCOUNTS_TABLE,
            Key: { id: smtpAccountId }
        }).promise();

        if (account.Item) {
            config = {
                host: account.Item.host,
                port: account.Item.port,
                secure: account.Item.port === 465,
                auth: {
                    user: account.Item.username,
                    pass: account.Item.password,
                },
                fromEmail: account.Item.fromEmail,
                fromName: account.Item.fromName,
            };
        }
    }

    if (!config) {
        // Try to get default account from database
        try {
            const all = await dynamoDB.scan({ TableName: SMTP_ACCOUNTS_TABLE }).promise();
            const defaultAcc = (all.Items || []).find(a => a.isDefault);
            if (defaultAcc) {
                config = {
                    host: defaultAcc.host,
                    port: defaultAcc.port,
                    secure: defaultAcc.port === 465,
                    auth: {
                        user: defaultAcc.username,
                        pass: defaultAcc.password,
                    },
                    fromEmail: defaultAcc.fromEmail,
                    fromName: defaultAcc.fromName,
                };
            }
        } catch (err) {
            console.log('No SMTP accounts in database, using env config');
        }
    }

    if (!config) {
        // Fallback to environment variables
        const smtpHost = process.env.SMTP_HOST;
        const smtpPort = Number(process.env.SMTP_PORT) || 587;
        const smtpUser = process.env.SMTP_USER;
        const smtpPass = process.env.SMTP_PASS;

        if (!smtpHost || !smtpUser || !smtpPass) {
            throw new Error('No SMTP configuration available');
        }

        config = {
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
            fromEmail: process.env.SMTP_FROM || smtpUser,
            fromName: 'Kokorick AI',
        };
    }

    const transporter = nodemailer.createTransport({
        ...config,
        pool: true, // Enable connection pooling for bulk sending
        maxConnections: 5,
        maxMessages: 100,
        rateDelta: 1000,
        rateLimit: 10,
    });

    return { transporter, fromEmail: config.fromEmail, fromName: config.fromName };
}

// ============ QUICK SEND (Direct sending without campaign) ============

router.post('/quick-send', auth, async (req, res) => {
    try {
        const {
            smtpAccountId,
            recipients, // comma or newline separated emails
            subject,
            htmlContent,
            textContent,
            sendOneByOne
        } = req.body;

        if (!recipients || !subject || !htmlContent) {
            return res.status(400).json({ error: 'Recipients, subject, and content are required' });
        }

        // Parse recipients - support comma, semicolon, or newline separation
        const emailList = recipients
            .split(/[,;\n]/)
            .map(e => e.trim().toLowerCase())
            .filter(e => e && e.includes('@'));

        if (emailList.length === 0) {
            return res.status(400).json({ error: 'No valid email addresses found' });
        }

        // Create a quick campaign record
        const campaignId = uuidv4();
        const campaign = {
            id: campaignId,
            name: `Quick Send - ${new Date().toLocaleString()}`,
            subject,
            htmlContent,
            textContent: textContent || '',
            recipientType: 'custom',
            recipients: emailList.map(e => ({ email: e })),
            totalRecipients: emailList.length,
            sentCount: 0,
            failedCount: 0,
            status: 'sending',
            smtpAccountId: smtpAccountId || null,
            sendOneByOne: sendOneByOne || false,
            createdAt: new Date().toISOString(),
            startedAt: new Date().toISOString(),
        };

        // Try to save campaign, but don't fail if table doesn't exist
        try {
            await dynamoDB.put({ TableName: CAMPAIGNS_TABLE, Item: campaign }).promise();
        } catch (dbErr) {
            console.log('Could not save campaign to DB (table may not exist), continuing with send...');
        }

        // Send response immediately
        res.json({
            message: 'Sending started',
            campaignId,
            totalRecipients: emailList.length
        });

        // Process in background
        if (sendOneByOne) {
            processEmailsOneByOne(campaignId, campaign, emailList, smtpAccountId);
        } else {
            processEmailsPooled(campaignId, campaign, emailList, smtpAccountId);
        }

    } catch (err) {
        console.error('Quick send error:', err);
        res.status(500).json({ error: err.message || 'Failed to send emails' });
    }
});

// Send emails one by one (creates new connection for each)
async function processEmailsOneByOne(campaignId, campaign, emailList, smtpAccountId) {
    let sentCount = 0;
    let failedCount = 0;

    for (const email of emailList) {
        try {
            const { transporter, fromEmail, fromName } = await getTransporter(smtpAccountId);

            // Generate unique message ID
            const domain = fromEmail.split('@')[1] || 'kokorick.uk';
            const messageId = `<${Date.now()}.${Math.random().toString(36).substr(2, 9)}@${domain}>`;

            const info = await transporter.sendMail({
                from: `"${fromName}" <${fromEmail}>`,
                to: email,
                replyTo: fromEmail,
                subject: campaign.subject,
                text: campaign.textContent || campaign.htmlContent.replace(/<[^>]*>/g, ''),
                html: campaign.htmlContent,
                messageId,
                headers: {
                    'X-Mailer': 'Kokorick Bulk Email',
                    'X-Priority': '3',
                    'Precedence': 'bulk',
                    'List-Unsubscribe': `<mailto:${fromEmail}?subject=Unsubscribe>`,
                },
            });

            transporter.close();

            // Log success (ignore DB errors)
            try {
                await dynamoDB.put({
                    TableName: EMAIL_LOGS_TABLE,
                    Item: {
                        id: uuidv4(),
                        campaignId,
                        email,
                        status: 'sent',
                        messageId: info.messageId,
                        sentAt: new Date().toISOString(),
                    }
                }).promise();
            } catch (dbErr) {
                // Ignore DB errors, email was still sent
            }

            sentCount++;
            console.log(`[One-by-One] Sent to ${email}`);

            // Small delay between emails to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));

        } catch (err) {
            console.error(`[One-by-One] Failed to send to ${email}:`, err.message);

            // Log failure (ignore DB errors)
            try {
                await dynamoDB.put({
                    TableName: EMAIL_LOGS_TABLE,
                    Item: {
                        id: uuidv4(),
                        campaignId,
                        email,
                        status: 'failed',
                        error: err.message,
                        sentAt: new Date().toISOString(),
                    }
                }).promise();
            } catch (dbErr) {
                // Ignore DB errors
            }

            failedCount++;
        }

        // Update progress every 5 emails (ignore DB errors)
        if ((sentCount + failedCount) % 5 === 0) {
            try {
                await updateCampaignProgress(campaignId, sentCount, failedCount);
            } catch (dbErr) {
                // Ignore
            }
        }
    }

    // Final update (ignore DB errors)
    try {
        await finalizeCampaign(campaignId, sentCount, failedCount);
    } catch (dbErr) {
        console.log(`Email send complete: ${sentCount} sent, ${failedCount} failed`);
    }
}

// Send emails using connection pool (faster for bulk)
async function processEmailsPooled(campaignId, campaign, emailList, smtpAccountId) {
    let sentCount = 0;
    let failedCount = 0;

    try {
        const { transporter, fromEmail, fromName } = await getTransporter(smtpAccountId);

        for (const email of emailList) {
            try {
                // Generate unique message ID
                const domain = fromEmail.split('@')[1] || 'kokorick.uk';
                const messageId = `<${Date.now()}.${Math.random().toString(36).substr(2, 9)}@${domain}>`;

                const info = await transporter.sendMail({
                    from: `"${fromName}" <${fromEmail}>`,
                    to: email,
                    replyTo: fromEmail,
                    subject: campaign.subject,
                    text: campaign.textContent || campaign.htmlContent.replace(/<[^>]*>/g, ''),
                    html: campaign.htmlContent,
                    messageId,
                    headers: {
                        'X-Mailer': 'Kokorick Bulk Email',
                        'X-Priority': '3',
                        'Precedence': 'bulk',
                        'List-Unsubscribe': `<mailto:${fromEmail}?subject=Unsubscribe>`,
                    },
                });

                // Log success (ignore DB errors)
                try {
                    await dynamoDB.put({
                        TableName: EMAIL_LOGS_TABLE,
                        Item: {
                            id: uuidv4(),
                            campaignId,
                            email,
                            status: 'sent',
                            messageId: info.messageId,
                            sentAt: new Date().toISOString(),
                        }
                    }).promise();
                } catch (dbErr) {
                    // Ignore
                }

                sentCount++;
                console.log(`[Pooled] Sent to ${email}`);

            } catch (err) {
                console.error(`[Pooled] Failed to send to ${email}:`, err.message);

                // Log failure (ignore DB errors)
                try {
                    await dynamoDB.put({
                        TableName: EMAIL_LOGS_TABLE,
                        Item: {
                            id: uuidv4(),
                            campaignId,
                            email,
                            status: 'failed',
                            error: err.message,
                            sentAt: new Date().toISOString(),
                        }
                    }).promise();
                } catch (dbErr) {
                    // Ignore
                }

                failedCount++;
            }

            // Update progress every 10 emails (ignore DB errors)
            if ((sentCount + failedCount) % 10 === 0) {
                try {
                    await updateCampaignProgress(campaignId, sentCount, failedCount);
                } catch (dbErr) {
                    // Ignore
                }
            }
        }

        transporter.close();

    } catch (err) {
        console.error('Pooled sending error:', err);
        // If pooled fails, fall back to one-by-one for remaining
        const remaining = emailList.slice(sentCount + failedCount);
        if (remaining.length > 0) {
            console.log(`Falling back to one-by-one for ${remaining.length} remaining emails`);
            await processEmailsOneByOne(campaignId,
                { ...campaign, htmlContent: campaign.htmlContent, textContent: campaign.textContent, subject: campaign.subject },
                remaining,
                smtpAccountId
            );
            return;
        }
    }

    // Final update (ignore DB errors)
    try {
        await finalizeCampaign(campaignId, sentCount, failedCount);
    } catch (dbErr) {
        console.log(`Email send complete: ${sentCount} sent, ${failedCount} failed`);
    }
}

async function updateCampaignProgress(campaignId, sentCount, failedCount) {
    await dynamoDB.update({
        TableName: CAMPAIGNS_TABLE,
        Key: { id: campaignId },
        UpdateExpression: 'SET sentCount = :sent, failedCount = :failed',
        ExpressionAttributeValues: {
            ':sent': sentCount,
            ':failed': failedCount
        }
    }).promise();
}

async function finalizeCampaign(campaignId, sentCount, failedCount) {
    const finalStatus = failedCount > 0 && sentCount === 0 ? 'failed' : 'completed';
    await dynamoDB.update({
        TableName: CAMPAIGNS_TABLE,
        Key: { id: campaignId },
        UpdateExpression: 'SET #status = :status, sentCount = :sent, failedCount = :failed, completedAt = :completedAt',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
            ':status': finalStatus,
            ':sent': sentCount,
            ':failed': failedCount,
            ':completedAt': new Date().toISOString()
        }
    }).promise();
    console.log(`Campaign ${campaignId} completed: ${sentCount} sent, ${failedCount} failed`);
}

// ============ EMAIL TEMPLATES ============

router.get('/templates', auth, async (req, res) => {
    try {
        const data = await dynamoDB.scan({ TableName: TEMPLATES_TABLE }).promise();
        const templates = (data.Items || []).sort((a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt)
        );
        res.json(templates);
    } catch (err) {
        console.error('Error fetching templates:', err);
        if (err.code === 'ResourceNotFoundException') {
            return res.json([]);
        }
        res.status(500).json({ error: 'Could not load templates' });
    }
});

router.post('/templates', auth, async (req, res) => {
    try {
        const { name, subject, htmlContent, textContent } = req.body;

        if (!name || !subject || !htmlContent) {
            return res.status(400).json({ error: 'Name, subject, and HTML content are required' });
        }

        const template = {
            id: uuidv4(),
            name,
            subject,
            htmlContent,
            textContent: textContent || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: req.user.userId,
        };

        await dynamoDB.put({ TableName: TEMPLATES_TABLE, Item: template }).promise();
        res.status(201).json(template);
    } catch (err) {
        console.error('Error creating template:', err);
        res.status(500).json({ error: 'Could not create template' });
    }
});

router.delete('/templates/:id', auth, async (req, res) => {
    try {
        await dynamoDB.delete({
            TableName: TEMPLATES_TABLE,
            Key: { id: req.params.id }
        }).promise();
        res.json({ message: 'Template deleted' });
    } catch (err) {
        console.error('Error deleting template:', err);
        res.status(500).json({ error: 'Could not delete template' });
    }
});

// ============ CAMPAIGNS ============

router.get('/campaigns', auth, async (req, res) => {
    try {
        const data = await dynamoDB.scan({ TableName: CAMPAIGNS_TABLE }).promise();
        const campaigns = (data.Items || []).sort((a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt)
        );
        res.json(campaigns);
    } catch (err) {
        console.error('Error fetching campaigns:', err);
        if (err.code === 'ResourceNotFoundException') {
            return res.json([]);
        }
        res.status(500).json({ error: 'Could not load campaigns' });
    }
});

router.get('/campaigns/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;

        const campaign = await dynamoDB.get({
            TableName: CAMPAIGNS_TABLE,
            Key: { id }
        }).promise();

        if (!campaign.Item) {
            return res.status(404).json({ error: 'Campaign not found' });
        }

        // Get email logs for this campaign
        try {
            const logs = await dynamoDB.scan({
                TableName: EMAIL_LOGS_TABLE,
                FilterExpression: 'campaignId = :campaignId',
                ExpressionAttributeValues: { ':campaignId': id }
            }).promise();

            res.json({
                ...campaign.Item,
                logs: logs.Items || []
            });
        } catch (err) {
            res.json({
                ...campaign.Item,
                logs: []
            });
        }
    } catch (err) {
        console.error('Error fetching campaign:', err);
        res.status(500).json({ error: 'Could not load campaign' });
    }
});

router.delete('/campaigns/:id', auth, async (req, res) => {
    try {
        await dynamoDB.delete({
            TableName: CAMPAIGNS_TABLE,
            Key: { id: req.params.id }
        }).promise();
        res.json({ message: 'Campaign deleted' });
    } catch (err) {
        console.error('Error deleting campaign:', err);
        res.status(500).json({ error: 'Could not delete campaign' });
    }
});

// ============ STATS ============

router.get('/stats', auth, async (req, res) => {
    try {
        const [campaigns, logs, subscribers, smtpAccounts] = await Promise.all([
            dynamoDB.scan({ TableName: CAMPAIGNS_TABLE }).promise().catch(() => ({ Items: [] })),
            dynamoDB.scan({ TableName: EMAIL_LOGS_TABLE }).promise().catch(() => ({ Items: [] })),
            dynamoDB.scan({ TableName: NEWSLETTER_TABLE }).promise().catch(() => ({ Items: [] })),
            dynamoDB.scan({ TableName: SMTP_ACCOUNTS_TABLE }).promise().catch(() => ({ Items: [] })),
        ]);

        const campaignItems = campaigns.Items || [];
        const logItems = logs.Items || [];

        const stats = {
            totalCampaigns: campaignItems.length,
            activeCampaigns: campaignItems.filter(c => c.status === 'sending').length,
            completedCampaigns: campaignItems.filter(c => c.status === 'completed').length,
            totalEmailsSent: logItems.filter(l => l.status === 'sent').length,
            totalEmailsFailed: logItems.filter(l => l.status === 'failed').length,
            totalSubscribers: (subscribers.Items || []).length,
            totalSmtpAccounts: (smtpAccounts.Items || []).length,
        };

        res.json(stats);
    } catch (err) {
        console.error('Error fetching stats:', err);
        res.status(500).json({ error: 'Could not load stats' });
    }
});

// Get recipients from various sources
router.get('/recipients/newsletter', auth, async (req, res) => {
    try {
        const data = await dynamoDB.scan({ TableName: NEWSLETTER_TABLE }).promise();
        res.json((data.Items || []).map(s => ({ email: s.email, name: '', subscribedAt: s.subscribedAt })));
    } catch (err) {
        res.json([]);
    }
});

router.get('/recipients/contacts', auth, async (req, res) => {
    try {
        const data = await dynamoDB.scan({ TableName: 'ContactRequests' }).promise();
        res.json((data.Items || []).map(c => ({ email: c.email, name: c.name, company: c.company })));
    } catch (err) {
        res.json([]);
    }
});

export default router;
