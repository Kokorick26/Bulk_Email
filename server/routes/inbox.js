import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import dynamoDB from '../db.js';
import auth from '../middleware/auth.js';
import Imap from 'imap';
import { simpleParser } from 'mailparser';

const router = express.Router();
const SMTP_ACCOUNTS_TABLE = 'SmtpAccounts';
const INBOX_MESSAGES_TABLE = 'InboxMessages';
const EMAIL_LOGS_TABLE = 'EmailLogs';
const CAMPAIGNS_TABLE = 'EmailCampaigns';

// ============ IMAP CONFIGURATION ============

// Direct IMAP test (without existing account - for new account setup)
router.post('/test-imap', auth, async (req, res) => {
    try {
        const { host, port, user, password, tls = true } = req.body;

        if (!host || !user || !password) {
            return res.status(400).json({ error: 'Host, user, and password are required' });
        }

        const imapConfig = {
            user,
            password,
            host,
            port: port || 993,
            tls,
            tlsOptions: { rejectUnauthorized: false },
            connTimeout: 10000,
            authTimeout: 10000,
        };

        console.log('[IMAP Direct Test] Connecting to:', { host, port: imapConfig.port, user });

        const result = await testImapConnection(imapConfig);

        if (result.success) {
            res.json({ message: 'IMAP connection successful!', mailboxes: result.mailboxes });
        } else {
            res.status(400).json({ error: result.error });
        }
    } catch (err) {
        console.error('IMAP test failed:', err);
        res.status(500).json({ error: err.message || 'IMAP test failed' });
    }
});

// Update SMTP account with IMAP settings
router.put('/smtp-accounts/:id/imap', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { imapHost, imapPort, imapUser, imapPassword, imapTls } = req.body;

        if (!imapHost || !imapPort || !imapUser) {
            return res.status(400).json({ error: 'IMAP host, port, and user are required' });
        }

        // Get existing account
        const existing = await dynamoDB.get({
            TableName: SMTP_ACCOUNTS_TABLE,
            Key: { id }
        }).promise();

        if (!existing.Item) {
            return res.status(404).json({ error: 'SMTP account not found' });
        }

        const updated = {
            ...existing.Item,
            imapHost,
            imapPort: Number(imapPort),
            imapUser,
            // Keep existing password if not provided OR if it's the masked placeholder
            imapPassword: (imapPassword && imapPassword !== '********')
                ? imapPassword
                : existing.Item.imapPassword,
            imapTls: imapTls !== undefined ? imapTls : true,
            imapConfigured: true,
            updatedAt: new Date().toISOString(),
        };

        await dynamoDB.put({ TableName: SMTP_ACCOUNTS_TABLE, Item: updated }).promise();

        res.json({
            ...updated,
            password: '********',
            imapPassword: updated.imapPassword ? '********' : '',
        });
    } catch (err) {
        console.error('Error updating IMAP config:', err);
        res.status(500).json({ error: 'Could not update IMAP configuration' });
    }
});

// Test IMAP connection
router.post('/smtp-accounts/:id/test-imap', auth, async (req, res) => {
    try {
        const { id } = req.params;

        const account = await dynamoDB.get({
            TableName: SMTP_ACCOUNTS_TABLE,
            Key: { id }
        }).promise();

        if (!account.Item) {
            return res.status(404).json({ error: 'SMTP account not found' });
        }

        if (!account.Item.imapConfigured) {
            return res.status(400).json({ error: 'IMAP not configured for this account' });
        }

        const imapConfig = {
            user: account.Item.imapUser || account.Item.username,
            password: account.Item.imapPassword || account.Item.password,
            host: account.Item.imapHost,
            port: account.Item.imapPort || 993,
            tls: account.Item.imapTls !== false,
            tlsOptions: { rejectUnauthorized: false },
            connTimeout: 10000,
            authTimeout: 10000,
        };

        console.log('[IMAP Test] Connecting with:', {
            user: imapConfig.user,
            host: imapConfig.host,
            port: imapConfig.port,
            passwordSet: !!imapConfig.password,
            passwordLength: imapConfig.password?.length
        });

        const result = await testImapConnection(imapConfig);

        if (result.success) {
            res.json({ message: 'IMAP connection successful!', mailboxes: result.mailboxes });
        } else {
            res.status(400).json({ error: result.error });
        }
    } catch (err) {
        console.error('IMAP test failed:', err);
        res.status(500).json({ error: err.message || 'IMAP test failed' });
    }
});

// Helper function to test IMAP connection
function testImapConnection(imapConfig) {
    return new Promise((resolve) => {
        const imap = new Imap(imapConfig);
        let mailboxes = [];

        imap.once('ready', () => {
            imap.getBoxes((err, boxes) => {
                if (err) {
                    resolve({ success: false, error: err.message });
                } else {
                    mailboxes = Object.keys(boxes);
                    imap.end();
                    resolve({ success: true, mailboxes });
                }
            });
        });

        imap.once('error', (err) => {
            resolve({ success: false, error: err.message });
        });

        imap.once('end', () => {
            // Connection ended
        });

        try {
            imap.connect();
        } catch (err) {
            resolve({ success: false, error: err.message });
        }

        // Timeout after 15 seconds
        setTimeout(() => {
            try { imap.end(); } catch (e) { }
            resolve({ success: false, error: 'Connection timeout' });
        }, 15000);
    });
}

// ============ INBOX MESSAGES ============

// Folder name mappings for different email providers
const folderMappings = {
    'INBOX': ['INBOX'],
    'Sent': ['Sent', 'Sent Items', 'Sent Mail', '[Gmail]/Sent Mail', 'INBOX.Sent'],
    'Drafts': ['Drafts', '[Gmail]/Drafts', 'Draft', 'INBOX.Drafts'],
    'Archive': ['Archive', '[Gmail]/All Mail', 'All Mail', 'INBOX.Archive'],
    'Spam': ['Spam', 'Junk', 'Junk E-mail', '[Gmail]/Spam', 'INBOX.Spam', 'Bulk Mail'],
    'Trash': ['Trash', 'Deleted Items', 'Deleted', '[Gmail]/Trash', 'INBOX.Trash', 'Deleted Messages']
};

// Get possible folder names for a given folder
function getPossibleFolderNames(folder) {
    return folderMappings[folder] || [folder];
}

// Fetch inbox messages from IMAP
router.post('/fetch/:accountId', auth, async (req, res) => {
    try {
        const { accountId } = req.params;
        const { folder = 'INBOX', limit = 50 } = req.body;

        // Get possible folder names to try
        const possibleFolders = getPossibleFolderNames(folder);

        const account = await dynamoDB.get({
            TableName: SMTP_ACCOUNTS_TABLE,
            Key: { id: accountId }
        }).promise();

        if (!account.Item) {
            return res.status(404).json({ error: 'SMTP account not found' });
        }

        if (!account.Item.imapConfigured) {
            return res.status(400).json({ error: 'IMAP not configured. Please configure IMAP settings first.' });
        }

        const imapConfig = {
            user: account.Item.imapUser || account.Item.username,
            password: account.Item.imapPassword || account.Item.password,
            host: account.Item.imapHost,
            port: account.Item.imapPort || 993,
            tls: account.Item.imapTls !== false,
            tlsOptions: { rejectUnauthorized: false },
            connTimeout: 30000,
            authTimeout: 30000,
        };

        // Try multiple folder names for this folder type
        let messages = [];
        let successFolder = folder;
        let lastError = null;

        for (const tryFolder of possibleFolders) {
            try {
                console.log(`Trying folder: ${tryFolder}`);
                messages = await fetchImapMessages(imapConfig, tryFolder, limit, accountId, req.user.userId);
                successFolder = tryFolder;
                console.log(`Successfully fetched ${messages.length} messages from ${tryFolder}`);
                break;
            } catch (err) {
                console.log(`Folder ${tryFolder} failed: ${err.message}`);
                lastError = err;
            }
        }

        if (messages.length === 0 && lastError) {
            console.log(`All folder variations failed. Last error: ${lastError.message}`);
        }

        // Cache messages to DynamoDB for persistence
        if (messages.length > 0) {
            console.log(`Caching ${messages.length} messages to DynamoDB...`);
            const cachePromises = messages.map(msg =>
                dynamoDB.put({
                    TableName: INBOX_MESSAGES_TABLE,
                    Item: {
                        ...msg,
                        folder: successFolder, // Use the actual folder that worked
                        cachedAt: new Date().toISOString()
                    }
                }).promise().catch(err => {
                    console.error(`Failed to cache message ${msg.id}:`, err.message);
                })
            );
            await Promise.all(cachePromises);
            console.log(`Cached ${messages.length} messages successfully`);
        }

        res.json({ messages, count: messages.length, folder: successFolder });
    } catch (err) {
        console.error('Error fetching inbox:', err);
        res.status(500).json({ error: err.message || 'Could not fetch inbox' });
    }
});

// Helper function to fetch IMAP messages
function fetchImapMessages(imapConfig, folder, limit, accountId, userId) {
    return new Promise((resolve, reject) => {
        const imap = new Imap(imapConfig);
        const messages = [];

        imap.once('ready', () => {
            imap.openBox(folder, true, (err, box) => {
                if (err) {
                    imap.end();
                    return reject(err);
                }

                const totalMessages = box.messages.total;
                if (totalMessages === 0) {
                    imap.end();
                    return resolve([]);
                }

                const start = Math.max(1, totalMessages - limit + 1);
                const fetchRange = `${start}:${totalMessages}`;

                const fetch = imap.seq.fetch(fetchRange, {
                    bodies: '',
                    struct: true,
                });

                fetch.on('message', (msg, seqno) => {
                    let buffer = '';
                    let uid = null;
                    let flags = [];

                    msg.on('body', (stream) => {
                        stream.on('data', (chunk) => {
                            buffer += chunk.toString('utf8');
                        });
                    });

                    msg.on('attributes', (attrs) => {
                        uid = attrs.uid;
                        flags = attrs.flags || [];
                    });

                    msg.once('end', async () => {
                        try {
                            const parsed = await simpleParser(buffer);
                            messages.push({
                                id: `${accountId}-${uid}`,
                                uid,
                                seqno,
                                accountId,
                                userId,
                                folder,
                                from: parsed.from?.text || '',
                                fromName: parsed.from?.value?.[0]?.name || '',
                                fromEmail: parsed.from?.value?.[0]?.address || '',
                                to: parsed.to?.text || '',
                                subject: parsed.subject || '(No Subject)',
                                date: parsed.date?.toISOString() || new Date().toISOString(),
                                text: parsed.text || '',
                                html: parsed.html || '',
                                flags,
                                isRead: flags.includes('\\Seen'),
                                isStarred: flags.includes('\\Flagged'),
                                hasAttachments: parsed.attachments?.length > 0,
                                attachmentCount: parsed.attachments?.length || 0,
                                attachments: (parsed.attachments || []).map((att, idx) => ({
                                    id: `${accountId}-${uid}-${idx}`,
                                    filename: att.filename || `attachment-${idx + 1}`,
                                    contentType: att.contentType || 'application/octet-stream',
                                    size: att.size || 0,
                                    contentId: att.contentId || null,
                                })),
                                snippet: (parsed.text || '').substring(0, 200).replace(/\n/g, ' '),
                                messageId: parsed.messageId || '',
                                inReplyTo: parsed.inReplyTo || '',
                                references: parsed.references || [],
                            });
                        } catch (parseErr) {
                            console.error('Error parsing email:', parseErr);
                        }
                    });
                });

                fetch.once('error', (err) => {
                    console.error('Fetch error:', err);
                });

                fetch.once('end', () => {
                    imap.end();
                    // Sort by date descending (newest first)
                    messages.sort((a, b) => new Date(b.date) - new Date(a.date));
                    resolve(messages);
                });
            });
        });

        imap.once('error', (err) => {
            reject(err);
        });

        imap.connect();
    });
}

// Get cached inbox messages
router.get('/messages/:accountId', auth, async (req, res) => {
    try {
        const { accountId } = req.params;
        const { folder = 'INBOX', limit = 50 } = req.query;

        const data = await dynamoDB.scan({
            TableName: INBOX_MESSAGES_TABLE,
            FilterExpression: 'accountId = :accountId AND folder = :folder',
            ExpressionAttributeValues: {
                ':accountId': accountId,
                ':folder': folder,
            },
        }).promise();

        const messages = (data.Items || [])
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, Number(limit));

        res.json(messages);
    } catch (err) {
        if (err.code === 'ResourceNotFoundException') {
            return res.json([]);
        }
        console.error('Error fetching cached messages:', err);
        res.status(500).json({ error: 'Could not fetch messages' });
    }
});

// Get single message
router.get('/message/:accountId/:messageId', auth, async (req, res) => {
    try {
        const { accountId, messageId } = req.params;
        const fullId = `${accountId}-${messageId}`;

        const data = await dynamoDB.get({
            TableName: INBOX_MESSAGES_TABLE,
            Key: { id: fullId },
        }).promise();

        if (!data.Item) {
            return res.status(404).json({ error: 'Message not found' });
        }

        res.json(data.Item);
    } catch (err) {
        console.error('Error fetching message:', err);
        res.status(500).json({ error: 'Could not fetch message' });
    }
});

// Mark message as read via IMAP
router.post('/message/:accountId/:uid/read', auth, async (req, res) => {
    try {
        const { accountId, uid } = req.params;

        const account = await dynamoDB.get({
            TableName: SMTP_ACCOUNTS_TABLE,
            Key: { id: accountId }
        }).promise();

        if (!account.Item || !account.Item.imapConfigured) {
            return res.status(400).json({ error: 'IMAP not configured' });
        }

        const imapConfig = {
            user: account.Item.imapUser || account.Item.username,
            password: account.Item.imapPassword || account.Item.password,
            host: account.Item.imapHost,
            port: account.Item.imapPort || 993,
            tls: account.Item.imapTls !== false,
            tlsOptions: { rejectUnauthorized: false },
        };

        await markMessageAsRead(imapConfig, Number(uid));
        res.json({ message: 'Marked as read' });
    } catch (err) {
        console.error('Error marking as read:', err);
        res.status(500).json({ error: 'Could not mark as read' });
    }
});

// Helper function to mark as read
function markMessageAsRead(imapConfig, uid) {
    return new Promise((resolve, reject) => {
        const imap = new Imap(imapConfig);

        imap.once('ready', () => {
            imap.openBox('INBOX', false, (err) => {
                if (err) {
                    imap.end();
                    return reject(err);
                }

                imap.addFlags(uid, ['\\Seen'], (err) => {
                    imap.end();
                    if (err) reject(err);
                    else resolve();
                });
            });
        });

        imap.once('error', reject);
        imap.connect();
    });
}

// Delete message via IMAP
router.delete('/message/:accountId/:uid', auth, async (req, res) => {
    try {
        const { accountId, uid } = req.params;

        const account = await dynamoDB.get({
            TableName: SMTP_ACCOUNTS_TABLE,
            Key: { id: accountId }
        }).promise();

        if (!account.Item || !account.Item.imapConfigured) {
            return res.status(400).json({ error: 'IMAP not configured' });
        }

        const imapConfig = {
            user: account.Item.imapUser || account.Item.username,
            password: account.Item.imapPassword || account.Item.password,
            host: account.Item.imapHost,
            port: account.Item.imapPort || 993,
            tls: account.Item.imapTls !== false,
            tlsOptions: { rejectUnauthorized: false },
        };

        await deleteMessage(imapConfig, Number(uid));
        res.json({ message: 'Message deleted' });
    } catch (err) {
        console.error('Error deleting message:', err);
        res.status(500).json({ error: 'Could not delete message' });
    }
});

// Helper function to delete message
function deleteMessage(imapConfig, uid) {
    return new Promise((resolve, reject) => {
        const imap = new Imap(imapConfig);

        imap.once('ready', () => {
            imap.openBox('INBOX', false, (err) => {
                if (err) {
                    imap.end();
                    return reject(err);
                }

                imap.addFlags(uid, ['\\Deleted'], (err) => {
                    if (err) {
                        imap.end();
                        return reject(err);
                    }

                    imap.expunge((err) => {
                        imap.end();
                        if (err) reject(err);
                        else resolve();
                    });
                });
            });
        });

        imap.once('error', reject);
        imap.connect();
    });
}

// ============ SENT EMAILS ============

// Get sent emails (from campaign logs)
router.get('/sent/:accountId', auth, async (req, res) => {
    try {
        const { accountId } = req.params;
        const { limit = 50 } = req.query;

        // Get campaigns that used this SMTP account
        const campaignsData = await dynamoDB.scan({
            TableName: CAMPAIGNS_TABLE,
            FilterExpression: 'smtpAccountId = :accountId',
            ExpressionAttributeValues: { ':accountId': accountId },
        }).promise();

        const campaigns = campaignsData.Items || [];

        // Get all email logs for these campaigns
        const logs = [];
        for (const campaign of campaigns) {
            try {
                const logsData = await dynamoDB.scan({
                    TableName: EMAIL_LOGS_TABLE,
                    FilterExpression: 'campaignId = :campaignId AND #status = :status',
                    ExpressionAttributeNames: { '#status': 'status' },
                    ExpressionAttributeValues: {
                        ':campaignId': campaign.id,
                        ':status': 'sent',
                    },
                }).promise();

                for (const log of (logsData.Items || [])) {
                    logs.push({
                        ...log,
                        subject: campaign.subject,
                        campaignName: campaign.name,
                        htmlContent: campaign.htmlContent?.substring(0, 500),
                    });
                }
            } catch (err) {
                console.log('Error fetching logs for campaign:', campaign.id);
            }
        }

        // Sort by date and limit
        logs.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
        res.json(logs.slice(0, Number(limit)));
    } catch (err) {
        console.error('Error fetching sent emails:', err);
        if (err.code === 'ResourceNotFoundException') {
            return res.json([]);
        }
        res.status(500).json({ error: 'Could not fetch sent emails' });
    }
});

// Get all sent emails across all accounts for the user
router.get('/sent', auth, async (req, res) => {
    try {
        const { limit = 100 } = req.query;

        // Get all campaigns
        const campaignsData = await dynamoDB.scan({
            TableName: CAMPAIGNS_TABLE,
        }).promise();

        const campaigns = campaignsData.Items || [];
        const campaignMap = {};
        campaigns.forEach(c => {
            campaignMap[c.id] = c;
        });

        // Get all sent email logs
        const logsData = await dynamoDB.scan({
            TableName: EMAIL_LOGS_TABLE,
            FilterExpression: '#status = :status',
            ExpressionAttributeNames: { '#status': 'status' },
            ExpressionAttributeValues: { ':status': 'sent' },
        }).promise();

        const logs = (logsData.Items || []).map(log => {
            const campaign = campaignMap[log.campaignId] || {};
            return {
                ...log,
                subject: campaign.subject || 'Unknown',
                campaignName: campaign.name || 'Unknown Campaign',
                fromEmail: campaign.fromEmail || '',
                htmlContent: campaign.htmlContent?.substring(0, 500),
                smtpAccountId: campaign.smtpAccountId,
            };
        });

        // Sort by date and limit
        logs.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
        res.json(logs.slice(0, Number(limit)));
    } catch (err) {
        console.error('Error fetching all sent emails:', err);
        if (err.code === 'ResourceNotFoundException') {
            return res.json([]);
        }
        res.status(500).json({ error: 'Could not fetch sent emails' });
    }
});

// ============ INBOX STATS ============

// Get inbox stats for all configured accounts
router.get('/stats', auth, async (req, res) => {
    try {
        // Get all SMTP accounts with IMAP configured
        const accountsData = await dynamoDB.scan({
            TableName: SMTP_ACCOUNTS_TABLE,
            FilterExpression: 'imapConfigured = :configured',
            ExpressionAttributeValues: { ':configured': true },
        }).promise();

        const accounts = accountsData.Items || [];
        const stats = {
            totalAccounts: accounts.length,
            configuredAccounts: accounts.filter(a => a.imapConfigured).length,
            accounts: accounts.map(a => ({
                id: a.id,
                name: a.name,
                email: a.fromEmail,
                imapConfigured: a.imapConfigured || false,
            })),
        };

        res.json(stats);
    } catch (err) {
        console.error('Error fetching inbox stats:', err);
        res.status(500).json({ error: 'Could not fetch stats' });
    }
});

// Get mailbox folders for an account
router.get('/folders/:accountId', auth, async (req, res) => {
    try {
        const { accountId } = req.params;

        const account = await dynamoDB.get({
            TableName: SMTP_ACCOUNTS_TABLE,
            Key: { id: accountId }
        }).promise();

        if (!account.Item || !account.Item.imapConfigured) {
            return res.status(400).json({ error: 'IMAP not configured' });
        }

        const imapConfig = {
            user: account.Item.imapUser || account.Item.username,
            password: account.Item.imapPassword || account.Item.password,
            host: account.Item.imapHost,
            port: account.Item.imapPort || 993,
            tls: account.Item.imapTls !== false,
            tlsOptions: { rejectUnauthorized: false },
        };

        const folders = await getMailboxFolders(imapConfig);
        res.json(folders);
    } catch (err) {
        console.error('Error fetching folders:', err);
        res.status(500).json({ error: 'Could not fetch folders' });
    }
});

// Helper function to get mailbox folders
function getMailboxFolders(imapConfig) {
    return new Promise((resolve, reject) => {
        const imap = new Imap(imapConfig);

        imap.once('ready', () => {
            imap.getBoxes((err, boxes) => {
                imap.end();
                if (err) reject(err);
                else {
                    const folders = [];
                    const processBoxes = (boxes, prefix = '') => {
                        for (const [name, box] of Object.entries(boxes)) {
                            const fullName = prefix ? `${prefix}${box.delimiter || '/'}${name}` : name;
                            folders.push({
                                name,
                                fullName,
                                delimiter: box.delimiter,
                                hasChildren: !!box.children,
                            });
                            if (box.children) {
                                processBoxes(box.children, fullName);
                            }
                        }
                    };
                    processBoxes(boxes);
                    resolve(folders);
                }
            });
        });

        imap.once('error', reject);
        imap.connect();
    });
}

export default router;
