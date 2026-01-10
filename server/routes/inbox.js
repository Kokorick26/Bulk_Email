import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import dynamoDB from '../db.js';
import auth from '../middleware/auth.js';
import Imap from 'imap';
import { simpleParser } from 'mailparser';
import { emitToUser } from '../services/socketService.js';

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

            // Emit real-time event to user
            if (req.user && req.user.userId) {
                emitToUser(req.user.userId, 'NEW_EMAILS', {
                    accountId,
                    folder: successFolder,
                    messages: messages
                });
            }
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

// Get inbox counters (unread, starred, etc.)
router.get('/counters', auth, async (req, res) => {
    try {
        const userId = req.user.userId;

        // Scan all messages for this user
        // Note: For production with large datasets, use a GSI on userId
        const params = {
            TableName: INBOX_MESSAGES_TABLE,
            FilterExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            }
        };

        const data = await dynamoDB.scan(params).promise();
        const messages = data.Items || [];

        const counters = {
            all: 0,
            unread: 0,
            starred: 0,
            sent: 0,
            drafts: 0,
            trash: 0,
            archive: 0,
            spam: 0,
            important: 0
        };

        messages.forEach(msg => {
            const folderLower = (msg.folder || '').toLowerCase();
            const flags = msg.flags || [];

            // Unread count (Global)
            if (!msg.isRead) {
                counters.unread++;
            }

            // Starred count
            if (msg.isStarred) {
                counters.starred++;
            }

            // Important label count (if applicable, though usually this is a folder or flag)
            // For now, we don't have explicit 'important' flag logic in fetch, but let's check labels if any

            // Folder mapping
            // Note: 'All Mail' in UI maps to INBOX folder currently
            if (folderLower.includes('inbox')) {
                counters.all++;
            } else if (folderLower.includes('sent')) {
                counters.sent++;
            } else if (folderLower.includes('draft')) {
                counters.drafts++;
            } else if (folderLower.includes('trash') || folderLower.includes('deleted')) {
                counters.trash++;
            } else if (folderLower.includes('spam') || folderLower.includes('bulk')) {
                counters.spam++;
            } else if (folderLower.includes('archive') || folderLower.includes('all') && !folderLower.includes('inbox')) {
                counters.archive++;
            }
        });

        res.json(counters);
    } catch (err) {
        console.error('Error fetching counters:', err);
        // Return zeros on error
        res.json({ all: 0, unread: 0, starred: 0 });
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

// ============ DRAFTS TABLE ============
const DRAFTS_TABLE = 'EmailDrafts';

// ============ COMPOSE & SEND EMAIL ============

// Send a new email (compose)
router.post('/send', auth, async (req, res) => {
    try {
        const { accountId, to, cc, bcc, subject, htmlContent, textContent, attachments, inReplyTo, references, threadId } = req.body;
        const userId = req.user.userId;

        if (!accountId || !to || !subject) {
            return res.status(400).json({ error: 'Account, recipient, and subject are required' });
        }

        // Get account details
        const account = await dynamoDB.get({
            TableName: SMTP_ACCOUNTS_TABLE,
            Key: { id: accountId }
        }).promise();

        if (!account.Item) {
            return res.status(404).json({ error: 'SMTP account not found' });
        }

        const nodemailer = (await import('nodemailer')).default;

        // Create transporter
        const transporter = nodemailer.createTransport({
            host: account.Item.host,
            port: account.Item.port,
            secure: account.Item.port === 465,
            auth: {
                user: account.Item.username,
                pass: account.Item.password,
            },
        });

        // Build email options
        const mailOptions = {
            from: `"${account.Item.fromName || account.Item.name}" <${account.Item.fromEmail}>`,
            to: Array.isArray(to) ? to.join(', ') : to,
            subject,
            text: textContent || '',
            html: htmlContent || '',
        };

        if (cc) mailOptions.cc = Array.isArray(cc) ? cc.join(', ') : cc;
        if (bcc) mailOptions.bcc = Array.isArray(bcc) ? bcc.join(', ') : bcc;
        if (inReplyTo) mailOptions.inReplyTo = inReplyTo;
        if (references) mailOptions.references = Array.isArray(references) ? references.join(' ') : references;

        // Handle attachments
        if (attachments && attachments.length > 0) {
            mailOptions.attachments = attachments.map(att => ({
                filename: att.filename,
                content: Buffer.from(att.content, 'base64'),
                contentType: att.contentType,
            }));
        }

        // Send email
        const info = await transporter.sendMail(mailOptions);

        // Log the sent email
        const emailLog = {
            id: uuidv4(),
            userId,
            accountId,
            to: mailOptions.to,
            cc: mailOptions.cc || '',
            bcc: mailOptions.bcc || '',
            subject,
            messageId: info.messageId,
            status: 'sent',
            sentAt: new Date().toISOString(),
            threadId: threadId || null,
            inReplyTo: inReplyTo || null,
        };

        await dynamoDB.put({
            TableName: EMAIL_LOGS_TABLE,
            Item: emailLog,
        }).promise();

        res.json({
            success: true,
            messageId: info.messageId,
            message: 'Email sent successfully'
        });
    } catch (err) {
        console.error('Error sending email:', err);
        res.status(500).json({ error: err.message || 'Failed to send email' });
    }
});

// ============ REPLY & FORWARD ============

// Reply to an email
router.post('/reply', auth, async (req, res) => {
    try {
        const { accountId, originalMessage, replyContent, replyAll, htmlContent } = req.body;
        const userId = req.user.userId;

        if (!accountId || !originalMessage || !replyContent) {
            return res.status(400).json({ error: 'Account, original message, and reply content are required' });
        }

        const account = await dynamoDB.get({
            TableName: SMTP_ACCOUNTS_TABLE,
            Key: { id: accountId }
        }).promise();

        if (!account.Item) {
            return res.status(404).json({ error: 'SMTP account not found' });
        }

        const nodemailer = (await import('nodemailer')).default;

        const transporter = nodemailer.createTransport({
            host: account.Item.host,
            port: account.Item.port,
            secure: account.Item.port === 465,
            auth: {
                user: account.Item.username,
                pass: account.Item.password,
            },
        });

        // Build recipients
        let to = originalMessage.fromEmail;
        let cc = '';

        if (replyAll) {
            // Include all original recipients except self
            const originalTo = originalMessage.to?.split(',').map(e => e.trim()) || [];
            const originalCc = originalMessage.cc?.split(',').map(e => e.trim()) || [];
            const allRecipients = [...originalTo, ...originalCc].filter(
                email => email && email !== account.Item.fromEmail
            );
            cc = allRecipients.join(', ');
        }

        // Build quoted content
        const quotedContent = `
            <br><br>
            <div style="border-left: 2px solid #ccc; padding-left: 10px; margin-left: 10px; color: #666;">
                <p>On ${new Date(originalMessage.date).toLocaleString()}, ${originalMessage.from} wrote:</p>
                ${originalMessage.html || `<p>${originalMessage.text}</p>`}
            </div>
        `;

        const fullHtml = (htmlContent || `<p>${replyContent.replace(/\n/g, '<br>')}</p>`) + quotedContent;

        // Build references chain
        const references = originalMessage.references || [];
        if (originalMessage.messageId && !references.includes(originalMessage.messageId)) {
            references.push(originalMessage.messageId);
        }

        const mailOptions = {
            from: `"${account.Item.fromName || account.Item.name}" <${account.Item.fromEmail}>`,
            to,
            cc: cc || undefined,
            subject: originalMessage.subject.startsWith('Re:') ? originalMessage.subject : `Re: ${originalMessage.subject}`,
            text: replyContent,
            html: fullHtml,
            inReplyTo: originalMessage.messageId,
            references: references.join(' '),
        };

        const info = await transporter.sendMail(mailOptions);

        // Log the reply
        await dynamoDB.put({
            TableName: EMAIL_LOGS_TABLE,
            Item: {
                id: uuidv4(),
                userId,
                accountId,
                to: mailOptions.to,
                cc: mailOptions.cc || '',
                subject: mailOptions.subject,
                messageId: info.messageId,
                status: 'sent',
                sentAt: new Date().toISOString(),
                inReplyTo: originalMessage.messageId,
                isReply: true,
            },
        }).promise();

        res.json({
            success: true,
            messageId: info.messageId,
            message: 'Reply sent successfully'
        });
    } catch (err) {
        console.error('Error sending reply:', err);
        res.status(500).json({ error: err.message || 'Failed to send reply' });
    }
});

// Forward an email
router.post('/forward', auth, async (req, res) => {
    try {
        const { accountId, originalMessage, to, cc, additionalContent, htmlContent, includeAttachments } = req.body;
        const userId = req.user.userId;

        if (!accountId || !originalMessage || !to) {
            return res.status(400).json({ error: 'Account, original message, and recipient are required' });
        }

        const account = await dynamoDB.get({
            TableName: SMTP_ACCOUNTS_TABLE,
            Key: { id: accountId }
        }).promise();

        if (!account.Item) {
            return res.status(404).json({ error: 'SMTP account not found' });
        }

        const nodemailer = (await import('nodemailer')).default;

        const transporter = nodemailer.createTransport({
            host: account.Item.host,
            port: account.Item.port,
            secure: account.Item.port === 465,
            auth: {
                user: account.Item.username,
                pass: account.Item.password,
            },
        });

        // Build forwarded content
        const forwardedContent = `
            <br><br>
            <div style="border-top: 1px solid #ccc; padding-top: 10px;">
                <p><strong>---------- Forwarded message ---------</strong></p>
                <p><strong>From:</strong> ${originalMessage.from}</p>
                <p><strong>Date:</strong> ${new Date(originalMessage.date).toLocaleString()}</p>
                <p><strong>Subject:</strong> ${originalMessage.subject}</p>
                <p><strong>To:</strong> ${originalMessage.to}</p>
                <br>
                ${originalMessage.html || `<p>${originalMessage.text}</p>`}
            </div>
        `;

        const additionalHtml = htmlContent || (additionalContent ? `<p>${additionalContent.replace(/\n/g, '<br>')}</p>` : '');
        const fullHtml = additionalHtml + forwardedContent;

        const mailOptions = {
            from: `"${account.Item.fromName || account.Item.name}" <${account.Item.fromEmail}>`,
            to: Array.isArray(to) ? to.join(', ') : to,
            cc: cc ? (Array.isArray(cc) ? cc.join(', ') : cc) : undefined,
            subject: originalMessage.subject.startsWith('Fwd:') ? originalMessage.subject : `Fwd: ${originalMessage.subject}`,
            text: additionalContent || '',
            html: fullHtml,
        };

        // TODO: Include attachments if requested and available

        const info = await transporter.sendMail(mailOptions);

        await dynamoDB.put({
            TableName: EMAIL_LOGS_TABLE,
            Item: {
                id: uuidv4(),
                userId,
                accountId,
                to: mailOptions.to,
                subject: mailOptions.subject,
                messageId: info.messageId,
                status: 'sent',
                sentAt: new Date().toISOString(),
                isForward: true,
            },
        }).promise();

        res.json({
            success: true,
            messageId: info.messageId,
            message: 'Email forwarded successfully'
        });
    } catch (err) {
        console.error('Error forwarding email:', err);
        res.status(500).json({ error: err.message || 'Failed to forward email' });
    }
});

// ============ STAR/FLAG TOGGLE ============

// Toggle star/flag on a message
router.post('/message/:accountId/:uid/star', auth, async (req, res) => {
    try {
        const { accountId, uid } = req.params;
        const { starred } = req.body; // true = add star, false = remove star

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

        await toggleStarOnMessage(imapConfig, Number(uid), starred);

        // Update cached message in DynamoDB
        const fullId = `${accountId}-${uid}`;
        try {
            await dynamoDB.update({
                TableName: INBOX_MESSAGES_TABLE,
                Key: { id: fullId },
                UpdateExpression: 'SET isStarred = :starred',
                ExpressionAttributeValues: { ':starred': starred },
            }).promise();
        } catch (e) {
            console.log('Could not update cache:', e.message);
        }

        res.json({ success: true, starred });
    } catch (err) {
        console.error('Error toggling star:', err);
        res.status(500).json({ error: 'Could not toggle star' });
    }
});

// Helper function to toggle star
function toggleStarOnMessage(imapConfig, uid, addStar) {
    return new Promise((resolve, reject) => {
        const imap = new Imap(imapConfig);

        imap.once('ready', () => {
            imap.openBox('INBOX', false, (err) => {
                if (err) {
                    imap.end();
                    return reject(err);
                }

                const method = addStar ? 'addFlags' : 'delFlags';
                imap[method](uid, ['\\Flagged'], (err) => {
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

// ============ MOVE TO FOLDER ============

// Move message to a different folder
router.post('/message/:accountId/:uid/move', auth, async (req, res) => {
    try {
        const { accountId, uid } = req.params;
        const { fromFolder = 'INBOX', toFolder } = req.body;

        if (!toFolder) {
            return res.status(400).json({ error: 'Target folder is required' });
        }

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

        await moveMessage(imapConfig, Number(uid), fromFolder, toFolder);

        // Remove from cache since it moved
        const fullId = `${accountId}-${uid}`;
        try {
            await dynamoDB.delete({
                TableName: INBOX_MESSAGES_TABLE,
                Key: { id: fullId },
            }).promise();
        } catch (e) {
            console.log('Could not delete from cache:', e.message);
        }

        res.json({ success: true, message: `Moved to ${toFolder}` });
    } catch (err) {
        console.error('Error moving message:', err);
        res.status(500).json({ error: 'Could not move message' });
    }
});

// Helper function to move message
function moveMessage(imapConfig, uid, fromFolder, toFolder) {
    return new Promise((resolve, reject) => {
        const imap = new Imap(imapConfig);

        imap.once('ready', () => {
            // First, try to find the correct folder name
            imap.getBoxes((err, boxes) => {
                if (err) {
                    imap.end();
                    return reject(err);
                }

                // Check if target folder exists
                const allFolders = Object.keys(boxes);
                let actualToFolder = toFolder;

                // Try common folder name variations
                const folderMappings = {
                    'Archive': ['Archive', '[Gmail]/All Mail', 'All Mail', 'INBOX.Archive'],
                    'Trash': ['Trash', '[Gmail]/Trash', 'Deleted Items', 'INBOX.Trash'],
                    'Spam': ['Spam', '[Gmail]/Spam', 'Junk', 'INBOX.Spam'],
                };

                if (folderMappings[toFolder]) {
                    for (const variation of folderMappings[toFolder]) {
                        if (allFolders.includes(variation) || boxes[variation]) {
                            actualToFolder = variation;
                            break;
                        }
                    }
                }

                imap.openBox(fromFolder, false, (err) => {
                    if (err) {
                        imap.end();
                        return reject(err);
                    }

                    imap.move(uid, actualToFolder, (err) => {
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

// ============ DRAFTS MANAGEMENT ============

// Save draft
router.post('/drafts', auth, async (req, res) => {
    try {
        const { id, accountId, to, cc, bcc, subject, htmlContent, textContent, inReplyTo, threadId } = req.body;
        const userId = req.user.userId;

        if (!accountId) {
            return res.status(400).json({ error: 'Account is required' });
        }

        const draft = {
            id: id || uuidv4(),
            userId,
            accountId,
            to: to || '',
            cc: cc || '',
            bcc: bcc || '',
            subject: subject || '',
            htmlContent: htmlContent || '',
            textContent: textContent || '',
            inReplyTo: inReplyTo || null,
            threadId: threadId || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        await dynamoDB.put({
            TableName: DRAFTS_TABLE,
            Item: draft,
        }).promise();

        res.json({ success: true, draft });
    } catch (err) {
        console.error('Error saving draft:', err);
        res.status(500).json({ error: 'Could not save draft' });
    }
});

// Get all drafts
router.get('/drafts', auth, async (req, res) => {
    try {
        const userId = req.user.userId;

        const data = await dynamoDB.scan({
            TableName: DRAFTS_TABLE,
            FilterExpression: 'userId = :userId',
            ExpressionAttributeValues: { ':userId': userId },
        }).promise();

        const drafts = (data.Items || []).sort((a, b) =>
            new Date(b.updatedAt) - new Date(a.updatedAt)
        );

        res.json(drafts);
    } catch (err) {
        if (err.code === 'ResourceNotFoundException') {
            return res.json([]);
        }
        console.error('Error fetching drafts:', err);
        res.status(500).json({ error: 'Could not fetch drafts' });
    }
});

// Get single draft
router.get('/drafts/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;

        const data = await dynamoDB.get({
            TableName: DRAFTS_TABLE,
            Key: { id },
        }).promise();

        if (!data.Item) {
            return res.status(404).json({ error: 'Draft not found' });
        }

        res.json(data.Item);
    } catch (err) {
        console.error('Error fetching draft:', err);
        res.status(500).json({ error: 'Could not fetch draft' });
    }
});

// Delete draft
router.delete('/drafts/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;

        await dynamoDB.delete({
            TableName: DRAFTS_TABLE,
            Key: { id },
        }).promise();

        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting draft:', err);
        res.status(500).json({ error: 'Could not delete draft' });
    }
});

// ============ ATTACHMENT HANDLING ============

// Get attachment content
router.get('/attachment/:accountId/:uid/:attachmentIndex', auth, async (req, res) => {
    try {
        const { accountId, uid, attachmentIndex } = req.params;

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

        const attachment = await fetchAttachment(imapConfig, Number(uid), Number(attachmentIndex));

        if (!attachment) {
            return res.status(404).json({ error: 'Attachment not found' });
        }

        res.setHeader('Content-Type', attachment.contentType || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${attachment.filename}"`);
        res.send(attachment.content);
    } catch (err) {
        console.error('Error fetching attachment:', err);
        res.status(500).json({ error: 'Could not fetch attachment' });
    }
});

// Helper function to fetch attachment
function fetchAttachment(imapConfig, uid, attachmentIndex) {
    return new Promise((resolve, reject) => {
        const imap = new Imap(imapConfig);
        let attachment = null;

        imap.once('ready', () => {
            imap.openBox('INBOX', true, (err) => {
                if (err) {
                    imap.end();
                    return reject(err);
                }

                const fetch = imap.fetch(uid, { bodies: '', struct: true });

                fetch.on('message', (msg) => {
                    let buffer = '';

                    msg.on('body', (stream) => {
                        stream.on('data', (chunk) => {
                            buffer += chunk.toString('utf8');
                        });
                    });

                    msg.once('end', async () => {
                        try {
                            const parsed = await simpleParser(buffer);
                            if (parsed.attachments && parsed.attachments[attachmentIndex]) {
                                const att = parsed.attachments[attachmentIndex];
                                attachment = {
                                    filename: att.filename,
                                    contentType: att.contentType,
                                    content: att.content,
                                };
                            }
                        } catch (e) {
                            console.error('Error parsing for attachment:', e);
                        }
                    });
                });

                fetch.once('error', (err) => {
                    imap.end();
                    reject(err);
                });

                fetch.once('end', () => {
                    imap.end();
                    setTimeout(() => resolve(attachment), 100);
                });
            });
        });

        imap.once('error', reject);
        imap.connect();
    });
}

// ============ THREAD/CONVERSATION VIEW ============

// Get conversation thread
router.get('/thread/:accountId', auth, async (req, res) => {
    try {
        const { accountId } = req.params;
        const { messageId, references } = req.query;

        // Get all messages for this account
        const data = await dynamoDB.scan({
            TableName: INBOX_MESSAGES_TABLE,
            FilterExpression: 'accountId = :accountId',
            ExpressionAttributeValues: { ':accountId': accountId },
        }).promise();

        const allMessages = data.Items || [];

        // Find all messages in the same thread
        const threadMessages = allMessages.filter(msg => {
            if (msg.messageId === messageId) return true;
            if (msg.inReplyTo === messageId) return true;
            if (references) {
                const refList = references.split(',').map(r => r.trim());
                if (refList.includes(msg.messageId)) return true;
                if (msg.references && msg.references.some(r => refList.includes(r))) return true;
            }
            return false;
        });

        // Sort by date
        threadMessages.sort((a, b) => new Date(a.date) - new Date(b.date));

        res.json(threadMessages);
    } catch (err) {
        console.error('Error fetching thread:', err);
        res.status(500).json({ error: 'Could not fetch thread' });
    }
});

// ============ SIGNATURES ============

// Get/Update signature for account
router.get('/signature/:accountId', auth, async (req, res) => {
    try {
        const { accountId } = req.params;

        const account = await dynamoDB.get({
            TableName: SMTP_ACCOUNTS_TABLE,
            Key: { id: accountId }
        }).promise();

        if (!account.Item) {
            return res.status(404).json({ error: 'Account not found' });
        }

        res.json({ signature: account.Item.signature || '' });
    } catch (err) {
        console.error('Error fetching signature:', err);
        res.status(500).json({ error: 'Could not fetch signature' });
    }
});

router.put('/signature/:accountId', auth, async (req, res) => {
    try {
        const { accountId } = req.params;
        const { signature } = req.body;

        await dynamoDB.update({
            TableName: SMTP_ACCOUNTS_TABLE,
            Key: { id: accountId },
            UpdateExpression: 'SET signature = :signature, updatedAt = :updatedAt',
            ExpressionAttributeValues: {
                ':signature': signature || '',
                ':updatedAt': new Date().toISOString(),
            },
        }).promise();

        res.json({ success: true });
    } catch (err) {
        console.error('Error updating signature:', err);
        res.status(500).json({ error: 'Could not update signature' });
    }
});

// ============ BACKGROUND INBOX POLLING ============

// Track last known UID for each account+folder to detect new emails
const lastKnownUids = new Map(); // Map<accountId-folder, lastUid>

// Folders to poll for real-time updates
const POLL_FOLDERS = ['INBOX', 'Sent', 'Trash', 'Spam'];

/**
 * Check for new emails across all configured IMAP accounts
 * Emits WebSocket events for real-time updates
 */
export async function checkForNewEmails() {
    console.log('[InboxPoller] Checking for new emails...');

    try {
        // Get all SMTP accounts with IMAP configured
        const accountsData = await dynamoDB.scan({
            TableName: SMTP_ACCOUNTS_TABLE,
            FilterExpression: 'imapConfigured = :configured',
            ExpressionAttributeValues: { ':configured': true },
        }).promise();

        const accounts = accountsData.Items || [];
        console.log(`[InboxPoller] Found ${accounts.length} IMAP-configured accounts`);

        for (const account of accounts) {
            const imapConfig = {
                user: account.imapUser || account.username,
                password: account.imapPassword || account.password,
                host: account.imapHost,
                port: account.imapPort || 993,
                tls: account.imapTls !== false,
                tlsOptions: { rejectUnauthorized: false },
                connTimeout: 15000,
                authTimeout: 15000,
            };

            // Check multiple folders for new emails
            for (const folder of POLL_FOLDERS) {
                try {
                    const newMessages = await checkNewMessagesForAccount(imapConfig, account.id, account.userId, folder);

                    if (newMessages.length > 0) {
                        console.log(`[InboxPoller] Found ${newMessages.length} new email(s) in ${folder} for ${account.fromEmail}`);

                        // Cache new messages
                        for (const msg of newMessages) {
                            await dynamoDB.put({
                                TableName: INBOX_MESSAGES_TABLE,
                                Item: {
                                    ...msg,
                                    cachedAt: new Date().toISOString()
                                }
                            }).promise().catch(err => {
                                console.error(`[InboxPoller] Failed to cache message:`, err.message);
                            });
                        }

                        // Emit WebSocket event to user
                        if (account.userId) {
                            emitToUser(account.userId, 'NEW_EMAILS', {
                                accountId: account.id,
                                folder: folder,
                                messages: newMessages
                            });
                        }
                    }
                } catch (folderErr) {
                    // Folder might not exist for this provider, that's okay
                }
            }
        }
    } catch (err) {
        console.error('[InboxPoller] Error:', err.message);
    }
}

/**
 * Check for new messages for a specific account and folder
 * Only fetches messages newer than the last known UID
 */
function checkNewMessagesForAccount(imapConfig, accountId, userId, folder = 'INBOX') {
    return new Promise((resolve) => {
        const imap = new Imap(imapConfig);
        const messages = [];
        let timeout;
        const uidKey = `${accountId}-${folder}`; // Unique key for account+folder

        imap.once('ready', () => {
            imap.openBox(folder, true, (err, box) => {
                if (err) {
                    imap.end();
                    return resolve([]);
                }

                const totalMessages = box.messages.total;
                if (totalMessages === 0) {
                    imap.end();
                    return resolve([]);
                }

                // Get last known UID for this account+folder
                const lastUid = lastKnownUids.get(uidKey) || 0;

                // Fetch only messages with UID greater than last known
                const searchCriteria = lastUid > 0
                    ? [['UID', `${lastUid + 1}:*`]]
                    : [['UID', `${Math.max(1, totalMessages - 5)}:*`]]; // First run: last 5 messages

                imap.search(searchCriteria, (err, uids) => {
                    if (err || !uids || uids.length === 0) {
                        imap.end();
                        return resolve([]);
                    }

                    // Filter out the last known UID if it was included
                    const newUids = uids.filter(uid => uid > lastUid);
                    if (newUids.length === 0) {
                        imap.end();
                        return resolve([]);
                    }

                    const fetch = imap.fetch(newUids, {
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

                            // Update last known UID for this account+folder
                            const currentLast = lastKnownUids.get(uidKey) || 0;
                            if (uid > currentLast) {
                                lastKnownUids.set(uidKey, uid);
                            }
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
                                    folder: 'INBOX',
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
                                    snippet: (parsed.text || '').substring(0, 200).replace(/\n/g, ' '),
                                    messageId: parsed.messageId || '',
                                });
                            } catch (parseErr) {
                                console.error('[InboxPoller] Error parsing email:', parseErr.message);
                            }
                        });
                    });

                    fetch.once('error', () => {
                        imap.end();
                    });

                    fetch.once('end', () => {
                        imap.end();
                        // Sort by date descending (newest first)
                        messages.sort((a, b) => new Date(b.date) - new Date(a.date));
                        resolve(messages);
                    });
                });
            });
        });

        imap.once('error', () => {
            resolve([]);
        });

        // Timeout after 20 seconds
        timeout = setTimeout(() => {
            try { imap.end(); } catch (e) { }
            resolve([]);
        }, 20000);

        imap.once('end', () => {
            clearTimeout(timeout);
        });

        try {
            imap.connect();
        } catch (e) {
            resolve([]);
        }
    });
}

export default router;

