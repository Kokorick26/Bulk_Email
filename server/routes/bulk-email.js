import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import dynamoDB from '../db.js';
import auth from '../middleware/auth.js';
import nodemailer from 'nodemailer';
import { executeCampaign, startCampaignScheduler } from '../services/campaignExecutor.js';

const router = express.Router();
const CAMPAIGNS_TABLE = 'EmailCampaigns';
const EMAIL_LOGS_TABLE = 'EmailLogs';
const TEMPLATES_TABLE = 'EmailTemplates';
const SMTP_ACCOUNTS_TABLE = 'SmtpAccounts';
const NEWSLETTER_TABLE = 'NewsletterSubscribers';
const LEAD_PROGRESS_TABLE = 'LeadProgress';
const LEAD_LISTS_TABLE = 'LeadLists';

// Start the campaign scheduler on server startup
startCampaignScheduler(5); // Check every 5 minutes

// ============ SMTP ACCOUNTS MANAGEMENT ============

// Get all SMTP accounts
router.get('/smtp-accounts', auth, async (req, res) => {
    try {
        const data = await dynamoDB.scan({ TableName: SMTP_ACCOUNTS_TABLE }).promise();
        // Don't send passwords in response
        const accounts = (data.Items || []).map(acc => ({
            ...acc,
            password: acc.password ? '********' : '',
            imapPassword: acc.imapPassword ? '********' : ''
        })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json(accounts);
    } catch (err) {
        console.error('Error fetching SMTP accounts:', err);
        if (err.code === 'ResourceNotFoundException') {
            return res.json([]);
        }
        res.status(500).json({ error: 'Could not load SMTP accounts' });
    }
});

// Create SMTP account
router.post('/smtp-accounts', auth, async (req, res) => {
    try {
        const { name, host, port, username, password, fromEmail, fromName, isDefault, imapHost, imapPort, imapUser, imapPassword, imapTls } = req.body;

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
            // IMAP configuration
            imapConfigured: !!imapHost,
            imapHost: imapHost || null,
            imapPort: imapPort ? Number(imapPort) : 993,
            imapUser: imapUser || null,
            imapPassword: imapPassword || null,
            imapTls: imapTls !== false,
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
            // Keep existing IMAP password if not provided or if placeholder
            imapPassword: (updates.imapPassword && updates.imapPassword !== '********')
                ? updates.imapPassword
                : existing.Item.imapPassword,
            // Set imapConfigured based on whether imapHost is set
            imapConfigured: !!(updates.imapHost || existing.Item.imapHost),
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

// Direct SMTP connection test (without existing account - for new account setup)
router.post('/smtp-accounts/test-connection', auth, async (req, res) => {
    try {
        const { host, port, username, password } = req.body;

        if (!host || !username || !password) {
            return res.status(400).json({ error: 'Host, username, and password are required' });
        }

        const transporter = nodemailer.createTransport({
            host,
            port: port || 587,
            secure: port === 465,
            auth: {
                user: username,
                pass: password,
            },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
        });

        // Verify the connection
        await transporter.verify();
        transporter.close();

        res.json({ message: 'SMTP connection successful!' });
    } catch (err) {
        console.error('SMTP test failed:', err);
        res.status(400).json({ error: err.message || 'SMTP connection failed' });
    }
});

// ============ USER SETTINGS ============

const USERS_TABLE = 'BulkEmailUsers';

// Get user settings
router.get('/settings', auth, async (req, res) => {
    // Default settings to return
    const defaultSettings = {
        maxEmailsPerAccountPerDay: 15,  // Default: 15 emails per account per day to avoid spam
        defaultThrottling: 4,
        trackOpens: true,
        trackClicks: true,
        autoRetry: true
    };

    try {
        // userId comes from JWT, fallback to email for admin user
        const userId = req.user.userId || req.user.email;

        const userData = await dynamoDB.get({
            TableName: USERS_TABLE,
            Key: { id: userId }
        }).promise();

        const userSettings = userData.Item?.settings || {};
        res.json({ ...defaultSettings, ...userSettings });
    } catch (err) {
        // If user doesn't exist in table or any error, just return defaults
        console.log('Could not fetch user settings, using defaults:', err.message);
        res.json(defaultSettings);
    }
});

// Update user settings
router.put('/settings', auth, async (req, res) => {
    try {
        // userId comes from JWT, fallback to email for admin user
        const userId = req.user.userId || req.user.email;
        const settings = req.body;

        // Validate daily limit (1-50 range to avoid spam issues)
        if (settings.maxEmailsPerAccountPerDay !== undefined) {
            settings.maxEmailsPerAccountPerDay = Math.max(1, Math.min(50, parseInt(settings.maxEmailsPerAccountPerDay) || 15));
        }

        // Try to get existing user first
        let existingUser = {};
        try {
            const userData = await dynamoDB.get({
                TableName: USERS_TABLE,
                Key: { id: userId }
            }).promise();
            existingUser = userData.Item || {};
        } catch (e) {
            // User doesn't exist, that's okay
        }

        // Use put to create or update the user settings
        await dynamoDB.put({
            TableName: USERS_TABLE,
            Item: {
                ...existingUser,
                id: userId,
                email: req.user.email,
                settings: settings,
                updatedAt: new Date().toISOString(),
                createdAt: existingUser.createdAt || new Date().toISOString()
            }
        }).promise();

        res.json({ message: 'Settings updated successfully', settings });
    } catch (err) {
        console.error('Error updating user settings:', err);
        res.status(500).json({ error: 'Could not update settings' });
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

    // Only search for a DB default if we didn't explicitly ask for the system default
    const isSystemRequest = smtpAccountId === 'system-default' || smtpAccountId === 'env-default';

    if (!config && !isSystemRequest) {
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
            fromName: 'Bhawesh Bhaskar',
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
        const { subject, htmlContent, textContent, recipients, smtpAccountId, sendOneByOne: reqSendOneByOne, delaySeconds } = req.body;

        if (!recipients) {
            return res.status(400).json({ error: 'Recipients are required' });
        }

        // Parse recipients into a standard list of objects or strings
        let recipientList = [];
        if (Array.isArray(recipients)) {
            recipientList = recipients.map(r => {
                if (typeof r === 'string') return { email: r.trim() };
                return r; // Assume object
            });
        } else if (typeof recipients === 'string') {
            recipientList = recipients.split(/[,\n]/).map(e => ({ email: e.trim() })).filter(e => e.email);
        }

        if (recipientList.length === 0) {
            return res.status(400).json({ error: 'No valid email addresses found' });
        }

        // Force sequential send if there's a delay, otherwise respect user pref
        const sendOneByOne = delaySeconds > 0 ? true : (reqSendOneByOne || false);

        // Create a quick campaign record
        const campaignId = uuidv4();
        const campaign = {
            id: campaignId,
            name: `Quick Send - ${new Date().toLocaleString()}`,
            subject,
            htmlContent,
            textContent: textContent || '', // Spintax will produce this dynamically later if needed, but we store base
            recipientType: 'custom',
            recipients: recipientList, // Store full objects
            totalRecipients: recipientList.length,
            sentCount: 0,
            failedCount: 0,
            status: 'sending',
            smtpAccountId: smtpAccountId || null,
            sendOneByOne: sendOneByOne,
            createdAt: new Date().toISOString(),
            startedAt: new Date().toISOString(),
        };

        // Try to save campaign
        try {
            await dynamoDB.put({ TableName: CAMPAIGNS_TABLE, Item: campaign }).promise();
        } catch (dbErr) {
            console.log('Could not save campaign to DB, continuing with send...', dbErr);
        }

        // Send response immediately
        res.json({
            message: 'Sending started',
            campaignId,
            totalRecipients: recipientList.length
        });

        // Process in background
        if (sendOneByOne) {
            // Pass the objects!
            processEmailsOneByOne(campaignId, campaign, recipientList, smtpAccountId, delaySeconds);
        } else {
            // Pooled support fallback (strings only for now in that function)
            const emailStrings = recipientList.map(r => r.email);
            processEmailsPooled(campaignId, campaign, emailStrings, smtpAccountId);
        }

    } catch (err) {
        console.error('Quick send error:', err);
        res.status(500).json({ error: err.message || 'Failed to send emails' });
    }
});

// Enhanced content variation engine to avoid email provider tracking
function processSpintax(text) {
    if (!text) return text;
    return text.replace(/{([^{}]+)}/g, (match, content) => {
        if (content.includes('|')) {
            const choices = content.split('|');
            return choices[Math.floor(Math.random() * choices.length)];
        }
        return match;
    });
}

// Sanitize content - remove em dashes and other problematic characters
function sanitizeContent(content) {
    if (!content) return content;
    return content
        .replace(/—/g, '-')  // em dash to hyphen
        .replace(/–/g, '-')  // en dash to hyphen
        .replace(/"/g, '"')  // smart quotes
        .replace(/"/g, '"')
        .replace(/'/g, "'")
        .replace(/'/g, "'");
}

// Advanced variable replacement with context awareness
function replaceVariables(text, data) {
    if (!text) return '';
    let result = text;
    // Basic defaults
    const safeData = { name: '', company: '', ...data };

    Object.keys(safeData).forEach(key => {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'gi');
        result = result.replace(regex, safeData[key] || '');
    });

    // Always sanitize to remove em dashes
    return sanitizeContent(result);
}

// Generate unique content variations to avoid spam filters
function generateContentVariation(baseText, recipientIndex, totalRecipients, campaignId) {
    if (!baseText) return baseText;

    let result = baseText;

    // 1. Micro-variations based on position
    const variationSeed = campaignId + recipientIndex + totalRecipients;
    const random = seededRandom(variationSeed);

    // 2. Introduce subtle punctuation variations
    if (random() > 0.7) {
        // Occasionally add commas where appropriate
        result = result.replace(/(\w+)\s+(\w+)/g, (match, word1, word2) => {
            if (random() > 0.5 && !/[,.!?]$/.test(word1)) {
                return `${word1}, ${word2}`;
            }
            return match;
        });
    }

    // 3. Add subtle whitespace variations
    if (random() > 0.8) {
        // Occasionally add extra spaces around certain punctuation
        result = result.replace(/([.,!?])(\w)/g, (match, punct, word) => {
            if (random() > 0.5) {
                return `${punct}  ${word}`;
            }
            return match;
        });
    }

    // 4. Word choice variations for common phrases - more extensive
    const variations = {
        'thank you': ['thanks', 'thank you', 'appreciate it', 'grateful'],
        'hello': ['hi', 'hello', 'hey', 'hey there'],
        'best regards': ['best', 'regards', 'cheers', 'warm regards', 'talk soon'],
        'looking forward': ['looking forward', 'excited about', 'eager for', 'keen on'],
        'please': ['please', 'kindly', 'if you could'],
        'let me know': ['let me know', 'feel free to share', 'drop me a line', 'reach out'],
        'would love to': ['would love to', 'would be great to', 'excited to', 'keen to'],
        'quick': ['quick', 'brief', 'short'],
        'chat': ['chat', 'call', 'conversation', 'discussion'],
        'connect': ['connect', 'catch up', 'sync', 'touch base'],
        'opportunity': ['opportunity', 'chance', 'possibility'],
        'interested': ['interested', 'curious', 'intrigued'],
        'great': ['great', 'excellent', 'fantastic', 'wonderful'],
        'help': ['help', 'assist', 'support'],
        'reach out': ['reach out', 'get in touch', 'contact me', 'drop a message']
    };

    Object.entries(variations).forEach(([original, alternatives]) => {
        if (result.toLowerCase().includes(original)) {
            const chosen = alternatives[Math.floor(random() * alternatives.length)];
            result = result.replace(new RegExp(original, 'gi'), chosen);
        }
    });

    // 5. Randomize sentence structure slightly
    if (random() > 0.6) {
        result = varySentenceStructure(result, random);
    }

    return result;
}

// Seeded random number generator for consistent variations
function seededRandom(seed) {
    let hash = seed;
    return function () {
        hash = ((hash * 9301 + 49297) % 233280) / 233280;
        return hash;
    };
}

// Vary sentence structure while maintaining meaning
function varySentenceStructure(text, randomFn) {
    let result = text;

    // Split into sentences and randomly reorder some clauses
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

    return sentences.map(sentence => {
        // Move adverbs around
        if (randomFn() > 0.7) {
            sentence = sentence.replace(/\b(quickly|easily|efficiently|effectually|certainly|definitely)\b/g, (match) => {
                if (randomFn() > 0.5) {
                    return match;
                }
                return ''; // Sometimes remove the adverb
            });
        }

        return sentence;
    }).join(' ');
}

// Personalize content with advanced anti-tracking features
function personalizeEmailContent(campaign, recipient, recipientIndex, totalRecipients, campaignId) {
    let subject = campaign.subject;
    let htmlContent = campaign.htmlContent;
    let textContent = campaign.textContent;

    // 1. Process Spintax for base variation
    subject = processSpintax(subject);
    htmlContent = processSpintax(htmlContent);
    textContent = processSpintax(textContent);

    // 2. Replace personalization variables
    subject = replaceVariables(subject, recipient);
    htmlContent = replaceVariables(htmlContent, recipient);
    textContent = replaceVariables(textContent, recipient);

    // 3. Add unique content variations for anti-tracking
    htmlContent = generateContentVariation(htmlContent, recipientIndex, totalRecipients, campaignId);
    textContent = generateContentVariation(textContent, recipientIndex, totalRecipients, campaignId);

    // 4. Add unique identifiers for tracking (without revealing to user)
    const uniqueId = `${campaignId}-${recipientIndex}-${Date.now()}`;
    const trackingPixel = `<img src="${process.env.API_BASE || 'http://localhost:3001'}/api/tracking/${uniqueId}" width="1" height="1" style="display:none;" alt="">`;
    htmlContent = htmlContent.replace('</body>', `${trackingPixel}</body>`);

    // 5. Generate unique message ID
    const domain = process.env.SMTP_FROM?.split('@')[1] || 'kokorick.uk';
    const messageId = `<${Date.now()}.${Math.random().toString(36).substr(2, 9)}@${domain}>`;

    return {
        subject,
        htmlContent,
        textContent,
        messageId,
        uniqueId
    };
}

// AI rewrite function to create unique variations of email content
async function aiRewriteEmail(subject, body, recipientData, index) {
    const apiKey = process.env.MISTRAL_API_KEY;

    // If no API key, return original with basic personalization
    if (!apiKey) {
        return { subject, body };
    }

    try {
        const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'mistral-large-latest',
                messages: [
                    {
                        role: 'system',
                        content: `You are an email rewriter. Rewrite the given email to say the SAME thing but with DIFFERENT wording. 
                        
RULES:
- Keep the exact same meaning and intent
- Change sentence structure, word choices, and phrasing
- Keep it natural and human-sounding
- NEVER use em dashes (—) or en dashes (–), only use hyphens (-) or colons (:)
- Keep the same tone (professional/casual)
- Output format: First line is subject, then blank line, then body
- Do NOT add "Subject:" prefix
- Keep similar length`
                    },
                    {
                        role: 'user',
                        content: `Rewrite this email with different wording (variation #${index + 1}):

Subject: ${subject}

Body:
${body}

Remember: Same meaning, different words. NO em dashes.`
                    }
                ],
                temperature: 0.9,
                max_tokens: 600
            })
        });

        if (!response.ok) {
            console.log(`[AI Rewrite] API error, using original for recipient ${index}`);
            return { subject, body };
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';

        // Parse the response
        const lines = content.trim().split('\n');
        const newSubject = lines[0]?.replace(/^Subject:\s*/i, '').trim() || subject;
        const newBody = lines.slice(1).join('\n').trim() || body;

        console.log(`[AI Rewrite] Generated unique version for recipient ${index + 1}`);
        return {
            subject: sanitizeContent(newSubject),
            body: sanitizeContent(newBody)
        };

    } catch (error) {
        console.error(`[AI Rewrite] Error for recipient ${index}:`, error.message);
        return { subject, body };
    }
}

// Send emails one by one with DELAY and FULL PERSONALIZATION
async function processEmailsOneByOne(campaignId, campaign, recipientList, smtpAccountId, delaySeconds = 0) {
    let sentCount = 0;
    let failedCount = 0;

    console.log(`[Batch] Starting sequential send for ${recipientList.length} recipients with ${delaySeconds}s delay...`);

    for (let i = 0; i < recipientList.length; i++) {
        const recipient = recipientList[i];
        const email = typeof recipient === 'string' ? recipient : recipient.email;
        const data = typeof recipient === 'object' ? recipient : { email };

        // ======= REAL-TIME STATUS CHECK =======
        // Check if campaign was paused/stopped DURING execution
        if (i % 5 === 0) { // Check every 5 emails
            try {
                const statusCheck = await dynamoDB.get({
                    TableName: CAMPAIGNS_TABLE,
                    Key: { id: campaignId },
                    ProjectionExpression: '#status',
                    ExpressionAttributeNames: { '#status': 'status' }
                }).promise();

                const currentStatus = statusCheck.Item?.status;
                if (currentStatus === 'paused' || currentStatus === 'stopped' || currentStatus === 'cancelled') {
                    console.log(`[Batch] ⏹️ Campaign ${currentStatus} - STOPPING IMMEDIATELY`);
                    console.log(`[Batch] Progress: ${sentCount} sent, ${failedCount} failed`);

                    // Save progress and exit
                    await finalizeCampaign(campaignId, sentCount, failedCount);
                    return;
                }
            } catch (statusErr) {
                // Ignore status check errors
            }
        }
        // ======= END STATUS CHECK =======

        // 1. Respect Delay (if not first email)
        if (i > 0 && delaySeconds > 0) {
            console.log(`[Batch] Waiting ${delaySeconds}s before next email...`);
            await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
        }

        try {
            const { transporter, fromEmail, fromName } = await getTransporter(smtpAccountId);

            // Generate unique message ID
            const domain = fromEmail.split('@')[1] || 'kokorick.uk';
            const messageId = `<${Date.now()}.${Math.random().toString(36).substr(2, 9)}@${domain}>`;

            // 2. Personalize Content (Spintax + Variables)
            let subject = processSpintax(campaign.subject);
            subject = replaceVariables(subject, data);

            let html = processSpintax(campaign.htmlContent);
            html = replaceVariables(html, data);

            // 3. AI Rewrite - Generate unique version for each recipient
            const plainText = html
                .replace(/<br\s*\/?>/gi, '\n')
                .replace(/<\/p>/gi, '\n\n')
                .replace(/<\/div>/gi, '\n')
                .replace(/<\/li>/gi, '\n')
                .replace(/<[^>]*>/g, '')
                .trim();

            const rewritten = await aiRewriteEmail(subject, plainText, data, i);
            subject = sanitizeContent(rewritten.subject);

            // Convert rewritten body back to HTML
            html = `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#202124">${sanitizeContent(rewritten.body).replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</div>`;

            let text = sanitizeContent(rewritten.body);

            const info = await transporter.sendMail({
                from: `"${fromName}" <${fromEmail}>`,
                to: email,
                replyTo: fromEmail,
                subject: subject,
                text: text,
                html: html,
                messageId,
                headers: {},
            });

            transporter.close();

            // Log success with email content for preview
            try {
                await dynamoDB.put({
                    TableName: EMAIL_LOGS_TABLE,
                    Item: {
                        id: uuidv4(),
                        campaignId,
                        email,
                        recipientName: data.name || '',
                        status: 'sent',
                        messageId: info.messageId,
                        subject: subject,
                        htmlContent: html,
                        textContent: text,
                        sentAt: new Date().toISOString(),
                    }
                }).promise();
            } catch (dbErr) { /* Ignore */ }

            sentCount++;
            console.log(`[Batch] Sent to ${email} (${i + 1}/${recipientList.length})`);

            // Update Progress in DB every 5 emails
            if (sentCount % 5 === 0) {
                await updateCampaignProgress(campaignId, sentCount, failedCount);
            }

        } catch (err) {
            console.error(`[Batch] Failed to send to ${email}:`, err.message);
            // Log failure
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
async function processEmailsPooled(campaignId, campaign, recipientList, smtpAccountId) {
    let sentCount = 0;
    let failedCount = 0;

    // Normalize input to array of objects just in case
    const recipients = recipientList.map(r => typeof r === 'string' ? { email: r } : r);

    try {
        const { transporter, fromEmail, fromName } = await getTransporter(smtpAccountId);

        for (let idx = 0; idx < recipients.length; idx++) {
            const recipient = recipients[idx];
            const email = recipient.email;

            // ======= REAL-TIME STATUS CHECK =======
            if (idx % 10 === 0) { // Check every 10 emails for pooled (faster)
                try {
                    const statusCheck = await dynamoDB.get({
                        TableName: CAMPAIGNS_TABLE,
                        Key: { id: campaignId },
                        ProjectionExpression: '#status',
                        ExpressionAttributeNames: { '#status': 'status' }
                    }).promise();

                    const currentStatus = statusCheck.Item?.status;
                    if (currentStatus === 'paused' || currentStatus === 'stopped' || currentStatus === 'cancelled') {
                        console.log(`[Pooled] ⏹️ Campaign ${currentStatus} - STOPPING IMMEDIATELY`);
                        transporter.close();
                        await finalizeCampaign(campaignId, sentCount, failedCount);
                        return;
                    }
                } catch (statusErr) { /* Ignore */ }
            }
            // ======= END STATUS CHECK =======

            try {
                // Generate unique message ID
                const domain = fromEmail.split('@')[1] || 'kokorick.uk';
                const messageId = `<${Date.now()}.${Math.random().toString(36).substr(2, 9)}@${domain}>`;

                // Personalize (Spintax + Variables)
                let subject = processSpintax(campaign.subject);
                subject = replaceVariables(subject, recipient);

                let html = processSpintax(campaign.htmlContent);
                html = replaceVariables(html, recipient);

                let text = campaign.textContent;
                if (text) {
                    text = processSpintax(text);
                    text = replaceVariables(text, recipient);
                } else {
                    text = html
                        .replace(/<br\s*\/?>/gi, '\n')
                        .replace(/<\/p>/gi, '\n\n')
                        .replace(/<\/div>/gi, '\n')
                        .replace(/<\/li>/gi, '\n')
                        .replace(/<[^>]*>/g, '')
                        .trim();
                }

                const info = await transporter.sendMail({
                    from: `"${fromName}" <${fromEmail}>`,
                    to: email,
                    replyTo: fromEmail,
                    subject: subject,
                    text: text,
                    html: html,
                    messageId,
                    headers: {},
                });

                // Log success with content (ignore DB errors)
                try {
                    await dynamoDB.put({
                        TableName: EMAIL_LOGS_TABLE,
                        Item: {
                            id: uuidv4(),
                            campaignId,
                            email,
                            recipientName: data.name || '',
                            status: 'sent',
                            messageId: info.messageId,
                            subject: subject,
                            htmlContent: html,
                            textContent: text,
                            sentAt: new Date().toISOString(),
                        }
                    }).promise();
                } catch (dbErr) { /* Ignore */ }

                sentCount++;
                console.log(`[Pooled] Sent to ${email}`);

            } catch (err) {
                console.error(`[Pooled] Failed to send to ${email}:`, err.message);
                // Log failure
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
                } catch (e) { }

                failedCount++;
            }

            // Update progress every 10 emails
            if ((sentCount + failedCount) % 10 === 0) {
                try {
                    await updateCampaignProgress(campaignId, sentCount, failedCount);
                } catch (e) { }
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

// Create a new campaign
router.post('/campaigns', auth, async (req, res) => {
    try {
        const { name, status, leads, totalRecipients, sequence, schedule, options } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Campaign name is required' });
        }

        const campaign = {
            id: uuidv4(),
            name,
            status: status || 'draft',
            totalRecipients: totalRecipients || (leads ? leads.length : 0),
            sentCount: 0,
            failedCount: 0,
            openCount: 0,
            clickCount: 0,
            replyCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: req.user.userId,
            // Accept data from request or initialize as empty
            leads: leads || [],
            sequence: sequence || null,
            schedule: schedule || null,
            options: options || null
        };

        await dynamoDB.put({ TableName: CAMPAIGNS_TABLE, Item: campaign }).promise();
        res.status(201).json(campaign);
    } catch (err) {
        console.error('Error creating campaign:', err);
        res.status(500).json({ error: 'Could not create campaign' });
    }
});

// Update campaign
router.put('/campaigns/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const existing = await dynamoDB.get({
            TableName: CAMPAIGNS_TABLE,
            Key: { id }
        }).promise();

        if (!existing.Item) {
            return res.status(404).json({ error: 'Campaign not found' });
        }

        const updated = {
            ...existing.Item,
            ...updates,
            id, // Preserve ID
            updatedAt: new Date().toISOString()
        };

        await dynamoDB.put({ TableName: CAMPAIGNS_TABLE, Item: updated }).promise();
        res.json(updated);
    } catch (err) {
        console.error('Error updating campaign:', err);
        res.status(500).json({ error: 'Could not update campaign' });
    }
});

// Update campaign leads
router.put('/campaigns/:id/leads', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { leads } = req.body;

        await dynamoDB.update({
            TableName: CAMPAIGNS_TABLE,
            Key: { id },
            UpdateExpression: 'SET leads = :leads, totalRecipients = :count, updatedAt = :updatedAt',
            ExpressionAttributeValues: {
                ':leads': leads || [],
                ':count': (leads || []).length,
                ':updatedAt': new Date().toISOString()
            }
        }).promise();

        res.json({ message: 'Leads updated', count: (leads || []).length });
    } catch (err) {
        console.error('Error updating leads:', err);
        res.status(500).json({ error: 'Could not update leads' });
    }
});

// Update campaign sequence
router.put('/campaigns/:id/sequence', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { sequence } = req.body;

        await dynamoDB.update({
            TableName: CAMPAIGNS_TABLE,
            Key: { id },
            UpdateExpression: 'SET #seq = :sequence, updatedAt = :updatedAt',
            ExpressionAttributeNames: { '#seq': 'sequence' },
            ExpressionAttributeValues: {
                ':sequence': sequence,
                ':updatedAt': new Date().toISOString()
            }
        }).promise();

        res.json({ message: 'Sequence updated' });
    } catch (err) {
        console.error('Error updating sequence:', err);
        res.status(500).json({ error: 'Could not update sequence' });
    }
});

// Update campaign schedule
router.put('/campaigns/:id/schedule', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { schedule } = req.body;

        await dynamoDB.update({
            TableName: CAMPAIGNS_TABLE,
            Key: { id },
            UpdateExpression: 'SET schedule = :schedule, updatedAt = :updatedAt',
            ExpressionAttributeValues: {
                ':schedule': schedule,
                ':updatedAt': new Date().toISOString()
            }
        }).promise();

        res.json({ message: 'Schedule updated' });
    } catch (err) {
        console.error('Error updating schedule:', err);
        res.status(500).json({ error: 'Could not update schedule' });
    }
});

// Update campaign options
router.put('/campaigns/:id/options', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { options } = req.body;

        await dynamoDB.update({
            TableName: CAMPAIGNS_TABLE,
            Key: { id },
            UpdateExpression: 'SET options = :options, updatedAt = :updatedAt',
            ExpressionAttributeValues: {
                ':options': options,
                ':updatedAt': new Date().toISOString()
            }
        }).promise();

        res.json({ message: 'Options updated' });
    } catch (err) {
        console.error('Error updating options:', err);
        res.status(500).json({ error: 'Could not update options' });
    }
});

// Start/Resume a campaign - this actually begins sending emails
router.post('/campaigns/:id/start', auth, async (req, res) => {
    try {
        const { id } = req.params;

        // Get campaign
        const campaign = await dynamoDB.get({
            TableName: CAMPAIGNS_TABLE,
            Key: { id }
        }).promise();

        if (!campaign.Item) {
            return res.status(404).json({ error: 'Campaign not found' });
        }

        // Validate campaign has required data
        if (!campaign.Item.leads || campaign.Item.leads.length === 0) {
            return res.status(400).json({ error: 'Campaign has no leads. Please add leads first.' });
        }

        if (!campaign.Item.sequence || !campaign.Item.sequence.steps || campaign.Item.sequence.steps.length === 0) {
            return res.status(400).json({ error: 'Campaign has no email sequence. Please create at least one step.' });
        }

        // Check if first step has content
        const firstStep = campaign.Item.sequence.steps[0];
        if (!firstStep.subject || !firstStep.body) {
            return res.status(400).json({ error: 'First step must have a subject and body.' });
        }

        // Update campaign status to active
        await dynamoDB.update({
            TableName: CAMPAIGNS_TABLE,
            Key: { id },
            UpdateExpression: 'SET #status = :status, startedAt = :startedAt, updatedAt = :updatedAt',
            ExpressionAttributeNames: { '#status': 'status' },
            ExpressionAttributeValues: {
                ':status': 'active',
                ':startedAt': new Date().toISOString(),
                ':updatedAt': new Date().toISOString()
            }
        }).promise();

        // Execute campaign immediately (in background)
        setImmediate(() => {
            executeCampaign(id).catch(err => {
                console.error('[Campaign Start] Execution error:', err);
            });
        });

        res.json({
            message: 'Campaign started successfully',
            status: 'active',
            totalLeads: campaign.Item.leads.length,
            totalSteps: campaign.Item.sequence.steps.length
        });

    } catch (err) {
        console.error('Error starting campaign:', err);
        res.status(500).json({ error: 'Could not start campaign' });
    }
});

// Pause a campaign
router.post('/campaigns/:id/pause', auth, async (req, res) => {
    try {
        const { id } = req.params;

        await dynamoDB.update({
            TableName: CAMPAIGNS_TABLE,
            Key: { id },
            UpdateExpression: 'SET #status = :status, pausedAt = :pausedAt, updatedAt = :updatedAt',
            ExpressionAttributeNames: { '#status': 'status' },
            ExpressionAttributeValues: {
                ':status': 'paused',
                ':pausedAt': new Date().toISOString(),
                ':updatedAt': new Date().toISOString()
            }
        }).promise();

        res.json({ message: 'Campaign paused', status: 'paused' });

    } catch (err) {
        console.error('Error pausing campaign:', err);
        res.status(500).json({ error: 'Could not pause campaign' });
    }
});

// Get campaign lead progress
router.get('/campaigns/:id/progress', auth, async (req, res) => {
    try {
        const { id } = req.params;

        const data = await dynamoDB.scan({
            TableName: LEAD_PROGRESS_TABLE,
            FilterExpression: 'campaignId = :campaignId',
            ExpressionAttributeValues: { ':campaignId': id }
        }).promise();

        const progress = data.Items || [];

        // Calculate summary
        const summary = {
            total: progress.length,
            pending: progress.filter(p => p.status === 'pending').length,
            inProgress: progress.filter(p => p.status === 'in_progress').length,
            completed: progress.filter(p => p.status === 'completed').length,
            replied: progress.filter(p => p.status === 'replied').length,
            bounced: progress.filter(p => p.status === 'bounced').length
        };

        res.json({ summary, leads: progress });

    } catch (err) {
        console.error('Error fetching campaign progress:', err);
        if (err.code === 'ResourceNotFoundException') {
            return res.json({ summary: { total: 0 }, leads: [] });
        }
        res.status(500).json({ error: 'Could not fetch campaign progress' });
    }
});

// Get routing status for a campaign (intelligent email routing)
router.get('/campaigns/:id/routing', auth, async (req, res) => {
    try {
        const { id } = req.params;

        // Get campaign
        const campaign = await dynamoDB.get({
            TableName: CAMPAIGNS_TABLE,
            Key: { id }
        }).promise();

        if (!campaign.Item) {
            return res.status(404).json({ error: 'Campaign not found' });
        }

        // Import email router dynamically
        const { getRoutingStatus, calculateDistribution } = await import('../services/emailRouter.js');

        // Get all SMTP accounts
        const accountsData = await dynamoDB.scan({
            TableName: SMTP_ACCOUNTS_TABLE
        }).promise();
        const accounts = accountsData.Items || [];

        if (accounts.length === 0) {
            return res.json({
                message: 'No SMTP accounts configured',
                accounts: [],
                distribution: null
            });
        }

        // Get routing config from campaign options
        const options = campaign.Item.options || {};
        const routingConfig = {
            maxEmailsPerAccountPerCampaign: options.maxEmailsPerAccount || 15,
            maxEmailsPerAccountPerDay: options.maxDailyPerAccount || 50,
            rotationStrategy: options.rotationStrategy || 'round-robin'
        };

        // Get current routing status
        const status = await getRoutingStatus(accounts, id, routingConfig);

        // Calculate distribution for total leads
        const totalLeads = campaign.Item.leads?.length || 0;
        const distribution = calculateDistribution(totalLeads, accounts.length, routingConfig);

        res.json({
            campaignId: id,
            totalLeads,
            config: routingConfig,
            distribution,
            accounts: status.accounts,
            summary: {
                totalAccountsAvailable: status.totalAccountsAvailable,
                totalEmailsRemaining: status.totalEmailsRemaining,
                allLimitsReached: status.allLimitsReached,
                canSendAll: distribution.canSendAll
            }
        });

    } catch (err) {
        console.error('Error fetching routing status:', err);
        res.status(500).json({ error: 'Could not fetch routing status' });
    }
});

// Execute campaign on demand (for testing or manual trigger)
router.post('/campaigns/:id/execute', auth, async (req, res) => {
    try {
        const { id } = req.params;

        // Check campaign exists and is active
        const campaign = await dynamoDB.get({
            TableName: CAMPAIGNS_TABLE,
            Key: { id }
        }).promise();

        if (!campaign.Item) {
            return res.status(404).json({ error: 'Campaign not found' });
        }

        if (campaign.Item.status !== 'active') {
            return res.status(400).json({ error: 'Campaign is not active. Start the campaign first.' });
        }

        // Execute synchronously for this request
        const result = await executeCampaign(id);

        res.json({
            message: 'Campaign execution completed',
            result
        });

    } catch (err) {
        console.error('Error executing campaign:', err);
        res.status(500).json({ error: 'Could not execute campaign' });
    }
});

router.delete('/campaigns/:id', auth, async (req, res) => {
    try {
        // Also delete lead progress for this campaign
        try {
            const progressData = await dynamoDB.scan({
                TableName: LEAD_PROGRESS_TABLE,
                FilterExpression: 'campaignId = :campaignId',
                ExpressionAttributeValues: { ':campaignId': req.params.id }
            }).promise();

            for (const item of progressData.Items || []) {
                await dynamoDB.delete({
                    TableName: LEAD_PROGRESS_TABLE,
                    Key: { id: item.id }
                }).promise();
            }
        } catch (e) {
            // Ignore errors deleting progress
        }

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

// ============ LEAD LISTS MANAGEMENT ============

// Get all lead lists
router.get('/lead-lists', auth, async (req, res) => {
    try {
        const data = await dynamoDB.scan({ TableName: LEAD_LISTS_TABLE }).promise();
        const lists = (data.Items || []).sort((a, b) =>
            new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
        );
        res.json({ lists });
    } catch (err) {
        console.error('Error fetching lead lists:', err);
        if (err.code === 'ResourceNotFoundException') {
            return res.json({ lists: [] });
        }
        res.status(500).json({ error: 'Could not load lead lists' });
    }
});

// Create new lead list
router.post('/lead-lists', auth, async (req, res) => {
    try {
        const { name, description, leads, tags } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'List name is required' });
        }

        const list = {
            id: uuidv4(),
            name,
            description: description || '',
            leads: leads || [],
            tags: tags || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            userId: req.userId
        };

        await dynamoDB.put({
            TableName: LEAD_LISTS_TABLE,
            Item: list
        }).promise();

        res.status(201).json({ list });
    } catch (err) {
        console.error('Error creating lead list:', err);
        res.status(500).json({ error: 'Could not create lead list' });
    }
});

// Get single lead list
router.get('/lead-lists/:id', auth, async (req, res) => {
    try {
        const result = await dynamoDB.get({
            TableName: LEAD_LISTS_TABLE,
            Key: { id: req.params.id }
        }).promise();

        if (!result.Item) {
            return res.status(404).json({ error: 'Lead list not found' });
        }

        res.json({ list: result.Item });
    } catch (err) {
        console.error('Error fetching lead list:', err);
        res.status(500).json({ error: 'Could not fetch lead list' });
    }
});

// Update lead list
router.put('/lead-lists/:id', auth, async (req, res) => {
    try {
        const { name, description, leads, tags } = req.body;

        const updateExpression = [];
        const expressionAttributeValues = {};
        const expressionAttributeNames = {};

        if (name !== undefined) {
            updateExpression.push('#name = :name');
            expressionAttributeValues[':name'] = name;
            expressionAttributeNames['#name'] = 'name';
        }
        if (description !== undefined) {
            updateExpression.push('description = :description');
            expressionAttributeValues[':description'] = description;
        }
        if (leads !== undefined) {
            updateExpression.push('leads = :leads');
            expressionAttributeValues[':leads'] = leads;
        }
        if (tags !== undefined) {
            updateExpression.push('tags = :tags');
            expressionAttributeValues[':tags'] = tags;
        }

        updateExpression.push('updatedAt = :updatedAt');
        expressionAttributeValues[':updatedAt'] = new Date().toISOString();

        const params = {
            TableName: LEAD_LISTS_TABLE,
            Key: { id: req.params.id },
            UpdateExpression: 'SET ' + updateExpression.join(', '),
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: 'ALL_NEW'
        };

        if (Object.keys(expressionAttributeNames).length > 0) {
            params.ExpressionAttributeNames = expressionAttributeNames;
        }

        const result = await dynamoDB.update(params).promise();

        res.json({ list: result.Attributes });
    } catch (err) {
        console.error('Error updating lead list:', err);
        res.status(500).json({ error: 'Could not update lead list' });
    }
});

// Delete lead list
router.delete('/lead-lists/:id', auth, async (req, res) => {
    try {
        await dynamoDB.delete({
            TableName: LEAD_LISTS_TABLE,
            Key: { id: req.params.id }
        }).promise();

        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting lead list:', err);
        res.status(500).json({ error: 'Could not delete lead list' });
    }
});

export default router;
