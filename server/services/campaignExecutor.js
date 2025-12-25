/**
 * Campaign Executor Service
 * 
 * This service handles the execution of multi-step email campaigns with:
 * - Step-by-step email sending
 * - Reply detection via IMAP
 * - Delay-based follow-ups
 * - Stop on reply/click functionality
 */

import Imap from 'imap';
import { simpleParser } from 'mailparser';
import dynamoDB from '../db.js';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';

const CAMPAIGNS_TABLE = 'EmailCampaigns';
const EMAIL_LOGS_TABLE = 'EmailLogs';
const SMTP_ACCOUNTS_TABLE = 'SmtpAccounts';
const LEAD_PROGRESS_TABLE = 'LeadProgress'; // Tracks each lead's progress in campaign

// Process Spintax syntax {option1|option2|option3}
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

// Replace personalization variables
function replaceVariables(text, data) {
    if (!text) return '';
    let result = text;
    const safeData = { name: '', company: '', firstName: '', lastName: '', email: '', ...data };

    Object.keys(safeData).forEach(key => {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'gi');
        result = result.replace(regex, safeData[key] || '');
    });

    return result
        .replace(/—/g, '-')
        .replace(/–/g, '-')
        .replace(/"/g, '"')
        .replace(/"/g, '"')
        .replace(/'/g, "'")
        .replace(/'/g, "'");
}

// Get email transporter for a specific SMTP account
async function getTransporter(smtpAccountId) {
    if (smtpAccountId) {
        const account = await dynamoDB.get({
            TableName: SMTP_ACCOUNTS_TABLE,
            Key: { id: smtpAccountId }
        }).promise();

        if (account.Item) {
            const transporter = nodemailer.createTransport({
                host: account.Item.host,
                port: account.Item.port,
                secure: account.Item.port === 465,
                auth: {
                    user: account.Item.username,
                    pass: account.Item.password,
                },
            });
            return {
                transporter,
                fromEmail: account.Item.fromEmail,
                fromName: account.Item.fromName
            };
        }
    }

    // Fallback to environment SMTP
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
    return {
        transporter,
        fromEmail: process.env.SMTP_FROM || process.env.SMTP_USER,
        fromName: process.env.SMTP_FROM_NAME || 'BulkMail'
    };
}

// Get IMAP connection for reply checking
function getImapConnection(smtpAccount) {
    return new Promise((resolve, reject) => {
        const imap = new Imap({
            user: smtpAccount.imapUser || smtpAccount.username,
            password: smtpAccount.imapPassword || smtpAccount.password,
            host: smtpAccount.imapHost || smtpAccount.host.replace('smtp', 'imap'),
            port: smtpAccount.imapPort || 993,
            tls: smtpAccount.imapTls !== false,
            tlsOptions: { rejectUnauthorized: false }
        });

        imap.once('ready', () => resolve(imap));
        imap.once('error', reject);
        imap.connect();
    });
}

// Check for replies to a specific email
async function checkForReplies(smtpAccount, leadEmail, sinceDate) {
    try {
        const imap = await getImapConnection(smtpAccount);

        return new Promise((resolve, reject) => {
            imap.openBox('INBOX', true, (err, box) => {
                if (err) {
                    imap.end();
                    return resolve(false);
                }

                // Search for emails from the lead since our last email
                const searchCriteria = [
                    ['FROM', leadEmail],
                    ['SINCE', sinceDate]
                ];

                imap.search(searchCriteria, (err, results) => {
                    imap.end();
                    if (err) {
                        console.error('[ReplyCheck] Search error:', err);
                        return resolve(false);
                    }
                    resolve(results.length > 0);
                });
            });
        });
    } catch (error) {
        console.error('[ReplyCheck] Connection error:', error.message);
        return false;
    }
}

// Initialize lead progress for a campaign
async function initializeLeadProgress(campaignId, leads) {
    for (const lead of leads) {
        const progress = {
            id: `${campaignId}-${lead.id || lead.email}`,
            campaignId,
            leadId: lead.id || lead.email,
            leadEmail: lead.email,
            leadData: lead,
            currentStep: 0, // 0 = haven't sent any step yet
            lastStepSentAt: null,
            nextStepScheduledAt: null,
            status: 'pending', // pending, in_progress, completed, replied, bounced, unsubscribed
            hasReplied: false,
            hasClicked: false,
            stepHistory: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        try {
            await dynamoDB.put({
                TableName: LEAD_PROGRESS_TABLE,
                Item: progress,
                ConditionExpression: 'attribute_not_exists(id)' // Don't overwrite existing
            }).promise();
        } catch (err) {
            if (err.code !== 'ConditionalCheckFailedException') {
                console.error('[LeadProgress] Error initializing:', err);
            }
        }
    }
}

// Get all leads that need emails sent for a campaign
async function getLeadsNeedingEmails(campaignId, sequence, options) {
    try {
        const data = await dynamoDB.scan({
            TableName: LEAD_PROGRESS_TABLE,
            FilterExpression: 'campaignId = :campaignId AND #status IN (:pending, :inProgress)',
            ExpressionAttributeNames: { '#status': 'status' },
            ExpressionAttributeValues: {
                ':campaignId': campaignId,
                ':pending': 'pending',
                ':inProgress': 'in_progress'
            }
        }).promise();

        const now = new Date();
        const leadsToProcess = [];

        for (const progress of data.Items || []) {
            // Skip if replied and stopOnReply is enabled
            if (options.stopOnReply && progress.hasReplied) {
                continue;
            }

            // Skip if clicked and stopOnClick is enabled
            if (options.stopOnClick && progress.hasClicked) {
                continue;
            }

            const currentStep = progress.currentStep;
            const totalSteps = sequence.steps.length;

            // Check if all steps completed
            if (currentStep >= totalSteps) {
                continue;
            }

            // For first step (currentStep = 0), send immediately
            if (currentStep === 0) {
                leadsToProcess.push({
                    progress,
                    stepIndex: 0,
                    step: sequence.steps[0]
                });
                continue;
            }

            // For subsequent steps, check if delay has passed
            const previousStep = sequence.steps[currentStep - 1];
            const lastSentAt = new Date(progress.lastStepSentAt);
            const delayMs = ((sequence.steps[currentStep].delayDays || 0) * 24 * 60 +
                (sequence.steps[currentStep].delayHours || 0)) * 60 * 1000;
            const nextSendTime = new Date(lastSentAt.getTime() + delayMs);

            if (now >= nextSendTime) {
                leadsToProcess.push({
                    progress,
                    stepIndex: currentStep,
                    step: sequence.steps[currentStep]
                });
            }
        }

        return leadsToProcess;
    } catch (err) {
        console.error('[CampaignExecutor] Error getting leads:', err);
        return [];
    }
}

// Send a single email for a campaign step
async function sendStepEmail(campaign, lead, step, stepIndex, smtpAccountId) {
    try {
        const { transporter, fromEmail, fromName } = await getTransporter(smtpAccountId);

        // Personalize content
        let subject = processSpintax(step.subject);
        subject = replaceVariables(subject, lead.leadData);

        let body = processSpintax(step.body);
        body = replaceVariables(body, lead.leadData);

        // Convert to HTML
        const html = `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#202124">${body.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</div>`;

        // Generate unique message ID
        const domain = fromEmail.split('@')[1] || 'kokorick.uk';
        const messageId = `<${Date.now()}.${Math.random().toString(36).substr(2, 9)}@${domain}>`;

        // Send email
        const info = await transporter.sendMail({
            from: `"${fromName}" <${fromEmail}>`,
            to: lead.leadEmail,
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
                email: lead.leadEmail,
                recipientName: lead.leadData.name || lead.leadData.firstName || '',
                status: 'sent',
                stepIndex,
                messageId: info.messageId,
                subject: subject,
                htmlContent: html,
                textContent: body,
                sentAt: new Date().toISOString(),
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
                    messageId: info.messageId
                }],
                ':updatedAt': new Date().toISOString()
            }
        }).promise();

        console.log(`[CampaignExecutor] Sent step ${stepIndex + 1} to ${lead.leadEmail}`);
        return true;

    } catch (error) {
        console.error(`[CampaignExecutor] Failed to send to ${lead.leadEmail}:`, error.message);

        // Log the failure
        try {
            await dynamoDB.put({
                TableName: EMAIL_LOGS_TABLE,
                Item: {
                    id: uuidv4(),
                    campaignId: campaign.id,
                    email: lead.leadEmail,
                    status: 'failed',
                    stepIndex,
                    error: error.message,
                    sentAt: new Date().toISOString(),
                }
            }).promise();
        } catch (e) { }

        return false;
    }
}

// Check all leads for replies
async function checkCampaignReplies(campaign, smtpAccount) {
    if (!campaign.options?.stopOnReply) return;

    try {
        const data = await dynamoDB.scan({
            TableName: LEAD_PROGRESS_TABLE,
            FilterExpression: 'campaignId = :campaignId AND hasReplied = :hasReplied AND #status IN (:inProgress, :pending)',
            ExpressionAttributeNames: { '#status': 'status' },
            ExpressionAttributeValues: {
                ':campaignId': campaign.id,
                ':hasReplied': false,
                ':inProgress': 'in_progress',
                ':pending': 'pending'
            }
        }).promise();

        for (const progress of data.Items || []) {
            if (!progress.lastStepSentAt) continue;

            const hasReplied = await checkForReplies(
                smtpAccount,
                progress.leadEmail,
                new Date(progress.lastStepSentAt)
            );

            if (hasReplied) {
                console.log(`[CampaignExecutor] Detected reply from ${progress.leadEmail}`);

                await dynamoDB.update({
                    TableName: LEAD_PROGRESS_TABLE,
                    Key: { id: progress.id },
                    UpdateExpression: 'SET hasReplied = :hasReplied, #status = :status, updatedAt = :updatedAt',
                    ExpressionAttributeNames: { '#status': 'status' },
                    ExpressionAttributeValues: {
                        ':hasReplied': true,
                        ':status': 'replied',
                        ':updatedAt': new Date().toISOString()
                    }
                }).promise();

                // Update campaign reply count
                await dynamoDB.update({
                    TableName: CAMPAIGNS_TABLE,
                    Key: { id: campaign.id },
                    UpdateExpression: 'SET replyCount = if_not_exists(replyCount, :zero) + :one',
                    ExpressionAttributeValues: {
                        ':zero': 0,
                        ':one': 1
                    }
                }).promise();
            }
        }
    } catch (error) {
        console.error('[CampaignExecutor] Error checking replies:', error);
    }
}

// Main campaign execution function
export async function executeCampaign(campaignId) {
    try {
        // Get campaign data
        const campaignData = await dynamoDB.get({
            TableName: CAMPAIGNS_TABLE,
            Key: { id: campaignId }
        }).promise();

        const campaign = campaignData.Item;
        if (!campaign) {
            console.error('[CampaignExecutor] Campaign not found:', campaignId);
            return { success: false, error: 'Campaign not found' };
        }

        if (campaign.status !== 'active') {
            console.log('[CampaignExecutor] Campaign is not active:', campaign.status);
            return { success: false, error: 'Campaign is not active' };
        }

        if (!campaign.sequence?.steps?.length) {
            console.error('[CampaignExecutor] Campaign has no sequence steps');
            return { success: false, error: 'No sequence steps defined' };
        }

        if (!campaign.leads?.length) {
            console.error('[CampaignExecutor] Campaign has no leads');
            return { success: false, error: 'No leads in campaign' };
        }

        console.log(`[CampaignExecutor] Processing campaign: ${campaign.name}`);

        const options = campaign.options || { stopOnReply: true, stopOnClick: false };
        const smtpAccountId = options.smtpAccountId;

        // Initialize lead progress if not already done
        await initializeLeadProgress(campaignId, campaign.leads);

        // Get SMTP account for reply checking
        let smtpAccount = null;
        if (smtpAccountId) {
            const accountData = await dynamoDB.get({
                TableName: SMTP_ACCOUNTS_TABLE,
                Key: { id: smtpAccountId }
            }).promise();
            smtpAccount = accountData.Item;
        }

        // Check for replies before sending new emails
        if (smtpAccount && options.stopOnReply) {
            await checkCampaignReplies(campaign, smtpAccount);
        }

        // Get leads that need emails
        const leadsToProcess = await getLeadsNeedingEmails(campaignId, campaign.sequence, options);
        console.log(`[CampaignExecutor] Found ${leadsToProcess.length} leads needing emails`);

        // Check schedule constraints
        const schedule = campaign.schedule;
        if (schedule) {
            const now = new Date();
            const dayName = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

            if (!schedule.sendDays.includes(dayName)) {
                console.log('[CampaignExecutor] Not a sending day, skipping');
                return { success: true, processed: 0, skipped: 'not_sending_day' };
            }

            const currentTime = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
            if (currentTime < schedule.startTime || currentTime > schedule.endTime) {
                console.log('[CampaignExecutor] Outside sending window, skipping');
                return { success: true, processed: 0, skipped: 'outside_window' };
            }
        }

        // Process leads with rate limiting
        let sentCount = 0;
        let failedCount = 0;
        const delayBetweenEmails = schedule?.delayBetweenEmails || 60; // seconds
        const dailyLimit = options.dailyLimit || 100;

        for (const lead of leadsToProcess) {
            if (sentCount >= dailyLimit) {
                console.log('[CampaignExecutor] Daily limit reached');
                break;
            }

            const success = await sendStepEmail(
                campaign,
                lead,
                lead.step,
                lead.stepIndex,
                smtpAccountId
            );

            if (success) {
                sentCount++;
            } else {
                failedCount++;
            }

            // Delay between emails
            if (delayBetweenEmails > 0 && sentCount < leadsToProcess.length) {
                await new Promise(resolve => setTimeout(resolve, delayBetweenEmails * 1000));
            }
        }

        // Update campaign stats
        await dynamoDB.update({
            TableName: CAMPAIGNS_TABLE,
            Key: { id: campaignId },
            UpdateExpression: 'SET sentCount = if_not_exists(sentCount, :zero) + :sent, failedCount = if_not_exists(failedCount, :zero) + :failed, updatedAt = :updatedAt',
            ExpressionAttributeValues: {
                ':zero': 0,
                ':sent': sentCount,
                ':failed': failedCount,
                ':updatedAt': new Date().toISOString()
            }
        }).promise();

        console.log(`[CampaignExecutor] Completed: ${sentCount} sent, ${failedCount} failed`);
        return { success: true, sent: sentCount, failed: failedCount };

    } catch (error) {
        console.error('[CampaignExecutor] Error:', error);
        return { success: false, error: error.message };
    }
}

// Process all active campaigns
export async function processAllActiveCampaigns() {
    try {
        const data = await dynamoDB.scan({
            TableName: CAMPAIGNS_TABLE,
            FilterExpression: '#status = :active',
            ExpressionAttributeNames: { '#status': 'status' },
            ExpressionAttributeValues: { ':active': 'active' }
        }).promise();

        const campaigns = data.Items || [];
        console.log(`[CampaignExecutor] Found ${campaigns.length} active campaigns`);

        for (const campaign of campaigns) {
            await executeCampaign(campaign.id);
        }

        return { success: true, processedCampaigns: campaigns.length };
    } catch (error) {
        console.error('[CampaignExecutor] Error processing campaigns:', error);
        return { success: false, error: error.message };
    }
}

// Start the campaign scheduler
let schedulerInterval = null;

export function startCampaignScheduler(intervalMinutes = 5) {
    if (schedulerInterval) {
        console.log('[CampaignScheduler] Already running');
        return;
    }

    console.log(`[CampaignScheduler] Starting with ${intervalMinutes} minute interval`);

    // Run immediately
    processAllActiveCampaigns();

    // Then run on interval
    schedulerInterval = setInterval(() => {
        processAllActiveCampaigns();
    }, intervalMinutes * 60 * 1000);
}

export function stopCampaignScheduler() {
    if (schedulerInterval) {
        clearInterval(schedulerInterval);
        schedulerInterval = null;
        console.log('[CampaignScheduler] Stopped');
    }
}

export default {
    executeCampaign,
    processAllActiveCampaigns,
    startCampaignScheduler,
    stopCampaignScheduler
};
