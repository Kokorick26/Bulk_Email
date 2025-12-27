/**
 * Campaign Executor Service
 * 
 * This service handles the execution of multi-step email campaigns with:
 * - Step-by-step email sending
 * - Reply detection via IMAP
 * - Delay-based follow-ups
 * - Stop on reply/click functionality
 * - INTELLIGENT EMAIL ROUTING across multiple SMTP accounts
 */

import Imap from 'imap';
import { simpleParser } from 'mailparser';
import dynamoDB from '../db.js';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import { getNextAccount, markEmailSent, getRoutingStatus, calculateDistribution } from './emailRouter.js';

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

// ============ TIMEZONE-AWARE SENDING SYSTEM ============

// Country to timezone mapping for leads without explicit timezone
const COUNTRY_TO_TIMEZONE = {
    'usa': 'America/New_York',
    'us': 'America/New_York',
    'united states': 'America/New_York',
    'uk': 'Europe/London',
    'united kingdom': 'Europe/London',
    'england': 'Europe/London',
    'india': 'Asia/Kolkata',
    'germany': 'Europe/Berlin',
    'france': 'Europe/Paris',
    'australia': 'Australia/Sydney',
    'canada': 'America/Toronto',
    'japan': 'Asia/Tokyo',
    'china': 'Asia/Shanghai',
    'singapore': 'Asia/Singapore',
    'uae': 'Asia/Dubai',
    'dubai': 'Asia/Dubai',
    'brazil': 'America/Sao_Paulo',
    'mexico': 'America/Mexico_City',
    'spain': 'Europe/Madrid',
    'italy': 'Europe/Rome',
    'netherlands': 'Europe/Amsterdam',
    'sweden': 'Europe/Stockholm',
    'norway': 'Europe/Oslo',
    'denmark': 'Europe/Copenhagen',
    'switzerland': 'Europe/Zurich',
    'south korea': 'Asia/Seoul',
    'korea': 'Asia/Seoul',
    'new zealand': 'Pacific/Auckland',
    'israel': 'Asia/Jerusalem',
    'russia': 'Europe/Moscow',
    'poland': 'Europe/Warsaw',
};

// Get the current time in a specific timezone
function getTimeInTimezone(timezone) {
    try {
        const now = new Date();
        const options = {
            timeZone: timezone,
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            weekday: 'long'
        };
        const formatter = new Intl.DateTimeFormat('en-US', options);
        const parts = formatter.formatToParts(now);

        const hour = parts.find(p => p.type === 'hour')?.value || '12';
        const minute = parts.find(p => p.type === 'minute')?.value || '00';
        const weekday = parts.find(p => p.type === 'weekday')?.value?.toLowerCase() || 'monday';

        return {
            time: `${hour}:${minute}`,
            weekday,
            hour: parseInt(hour, 10),
            minute: parseInt(minute, 10)
        };
    } catch (error) {
        console.error(`[Timezone] Invalid timezone: ${timezone}`, error.message);
        // Fallback to UTC
        const now = new Date();
        return {
            time: `${now.getUTCHours().toString().padStart(2, '0')}:${now.getUTCMinutes().toString().padStart(2, '0')}`,
            weekday: now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(),
            hour: now.getUTCHours(),
            minute: now.getUTCMinutes()
        };
    }
}

// Check if a lead is within their working hours
function isLeadWithinWorkingHours(leadData, campaignSchedule) {
    // Get lead's timezone (from lead data, country inference, or campaign default)
    let timezone = leadData.timezone;

    if (!timezone && leadData.country) {
        timezone = COUNTRY_TO_TIMEZONE[leadData.country.toLowerCase()];
    }

    if (!timezone) {
        timezone = campaignSchedule?.timezone || 'UTC';
    }

    // Get current time in lead's timezone
    const leadTime = getTimeInTimezone(timezone);

    // Get working hours (from lead data or campaign defaults)
    const workingStart = leadData.workingHoursStart || campaignSchedule?.startTime || '09:00';
    const workingEnd = leadData.workingHoursEnd || campaignSchedule?.endTime || '18:00';
    const workingDays = leadData.workingDays || campaignSchedule?.sendDays ||
        ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

    // Check if it's a working day
    if (!workingDays.includes(leadTime.weekday)) {
        console.log(`[Timezone] Lead ${leadData.email}: ${leadTime.weekday} is not a working day in ${timezone}`);
        return false;
    }

    // Check if current time is within working hours
    const currentTime = leadTime.time;
    const isWithin = currentTime >= workingStart && currentTime <= workingEnd;

    if (!isWithin) {
        console.log(`[Timezone] Lead ${leadData.email}: ${currentTime} ${timezone} is outside working hours (${workingStart}-${workingEnd})`);
    } else {
        console.log(`[Timezone] Lead ${leadData.email}: ${currentTime} ${timezone} is WITHIN working hours ✓`);
    }

    return isWithin;
}

// Get detailed timezone info for logging
function getLeadTimezoneInfo(leadData, campaignSchedule) {
    let timezone = leadData.timezone;
    let source = 'lead';

    if (!timezone && leadData.country) {
        timezone = COUNTRY_TO_TIMEZONE[leadData.country.toLowerCase()];
        source = 'country';
    }

    if (!timezone) {
        timezone = campaignSchedule?.timezone || 'UTC';
        source = 'campaign';
    }

    const leadTime = getTimeInTimezone(timezone);

    return {
        timezone,
        source,
        localTime: leadTime.time,
        weekday: leadTime.weekday,
        workingStart: leadData.workingHoursStart || campaignSchedule?.startTime || '09:00',
        workingEnd: leadData.workingHoursEnd || campaignSchedule?.endTime || '18:00',
    };
}

// ============ END TIMEZONE SYSTEM ============


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

        // Extract lead data from progress
        const leadEmail = lead.progress?.leadEmail || lead.leadEmail;
        const leadData = lead.progress?.leadData || lead.leadData || {};

        // Personalize content
        let subject = processSpintax(step.subject);
        subject = replaceVariables(subject, leadData);

        let body = processSpintax(step.body);
        body = replaceVariables(body, leadData);

        // Convert to HTML
        const html = `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#202124">${body.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</div>`;

        // Generate unique message ID
        const domain = fromEmail.split('@')[1] || 'kokorick.uk';
        const messageId = `<${Date.now()}.${Math.random().toString(36).substr(2, 9)}@${domain}>`;

        // Send email
        const info = await transporter.sendMail({
            from: `"${fromName}" <${fromEmail}>`,
            to: leadEmail,
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
                email: leadEmail,
                recipientName: leadData.name || leadData.firstName || '',
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

        console.log(`[CampaignExecutor] Sent step ${stepIndex + 1} to ${leadEmail}`);
        return true;

    } catch (error) {
        const errorEmail = lead.progress?.leadEmail || lead.leadEmail || 'unknown';
        console.error(`[CampaignExecutor] Failed to send to ${errorEmail}:`, error.message);

        // Log the failure
        try {
            await dynamoDB.put({
                TableName: EMAIL_LOGS_TABLE,
                Item: {
                    id: uuidv4(),
                    campaignId: campaign.id,
                    email: lead.progress?.leadEmail || lead.leadEmail || 'unknown',
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

        // ========== INTELLIGENT EMAIL ROUTING ==========
        // Get all available SMTP accounts for this user
        const userId = campaign.userId;
        let allSmtpAccounts = [];

        try {
            const accountsData = await dynamoDB.scan({
                TableName: SMTP_ACCOUNTS_TABLE,
                FilterExpression: 'userId = :userId',
                ExpressionAttributeValues: { ':userId': userId }
            }).promise();
            allSmtpAccounts = accountsData.Items || [];
        } catch (err) {
            console.log('[CampaignExecutor] Error fetching SMTP accounts:', err.message);
        }

        // If no accounts found or intelligentRouting disabled, fall back to single account
        const useIntelligentRouting = options.useIntelligentRouting !== false && allSmtpAccounts.length > 1;
        const routingConfig = {
            maxEmailsPerAccountPerCampaign: options.maxEmailsPerAccount || 15,
            maxEmailsPerAccountPerDay: options.maxDailyPerAccount || 50,
            rotationStrategy: options.rotationStrategy || 'round-robin'
        };

        if (useIntelligentRouting) {
            console.log(`[CampaignExecutor] 🔄 Intelligent Routing ENABLED with ${allSmtpAccounts.length} accounts`);
            console.log(`[CampaignExecutor] Max ${routingConfig.maxEmailsPerAccountPerCampaign} emails per account per campaign`);

            // Show distribution calculation
            const distribution = calculateDistribution(
                campaign.leads.length,
                allSmtpAccounts.length,
                routingConfig
            );
            console.log(`[CampaignExecutor] Distribution: ${JSON.stringify(distribution)}`);
        } else {
            console.log(`[CampaignExecutor] Using single SMTP account (${options.smtpAccountId || 'default'})`);
        }
        // ========== END ROUTING SETUP ==========

        // Initialize lead progress if not already done
        await initializeLeadProgress(campaignId, campaign.leads);

        // Get SMTP account for reply checking (use first account or specified account)
        let smtpAccount = null;
        const primaryAccountId = options.smtpAccountId || (allSmtpAccounts[0]?.id);
        if (primaryAccountId) {
            const accountData = await dynamoDB.get({
                TableName: SMTP_ACCOUNTS_TABLE,
                Key: { id: primaryAccountId }
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

        const schedule = campaign.schedule;

        // Check if we should respect individual lead timezones
        const useLeadTimezones = options.useLeadTimezones !== false; // Default: true

        // Process leads with rate limiting, timezone awareness, AND intelligent routing
        let sentCount = 0;
        let failedCount = 0;
        let skippedCount = 0;
        let routingExhausted = 0; // Leads skipped because all accounts reached limits
        const delayBetweenEmails = schedule?.delayBetweenEmails || 600;
        const dailyLimit = options.dailyLimit || 100;

        // Track which account sent to which lead (for logging)
        const accountUsageMap = new Map();

        console.log(`[CampaignExecutor] Starting sending (intelligentRouting: ${useIntelligentRouting}, timezoneAware: ${useLeadTimezones})`);

        for (let i = 0; i < leadsToProcess.length; i++) {
            const lead = leadsToProcess[i];

            // ======= REAL-TIME STATUS CHECK =======
            // Check if campaign was paused/stopped DURING execution
            if (i % 3 === 0 || i === 0) { // Check every 3 emails to reduce DB calls
                try {
                    const statusCheck = await dynamoDB.get({
                        TableName: CAMPAIGNS_TABLE,
                        Key: { id: campaignId },
                        ProjectionExpression: '#status',
                        ExpressionAttributeNames: { '#status': 'status' }
                    }).promise();

                    const currentStatus = statusCheck.Item?.status;
                    if (currentStatus !== 'active') {
                        console.log(`[CampaignExecutor] ⏹️ Campaign ${currentStatus} - STOPPING IMMEDIATELY`);
                        console.log(`[CampaignExecutor] Progress saved: ${sentCount} sent, ${failedCount} failed`);

                        // Save current progress before stopping
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

                        return {
                            success: true,
                            sent: sentCount,
                            failed: failedCount,
                            stopped: true,
                            reason: `Campaign ${currentStatus}`,
                            accountsUsed: accountUsageMap.size
                        };
                    }
                } catch (statusErr) {
                    console.log('[CampaignExecutor] Could not check status, continuing...');
                }
            }
            // ======= END STATUS CHECK =======

            if (sentCount >= dailyLimit) {
                console.log('[CampaignExecutor] Daily limit reached');
                break;
            }

            const leadData = lead.progress.leadData || {};

            // Calculate when this email is scheduled to be sent
            const scheduledTime = new Date(Date.now() + (sentCount * delayBetweenEmails * 1000));
            console.log(`[CampaignExecutor] Email #${sentCount + 1}: ${leadData.email} scheduled for ${scheduledTime.toISOString()}`);

            // ======= TIMEZONE CHECK =======
            if (useLeadTimezones) {
                const tzInfo = getLeadTimezoneInfo(leadData, schedule);
                console.log(`[CampaignExecutor] Lead ${leadData.email}: TZ=${tzInfo.timezone} (${tzInfo.source}), Local Time=${tzInfo.localTime} ${tzInfo.weekday}`);

                if (!isLeadWithinWorkingHours(leadData, schedule)) {
                    console.log(`[CampaignExecutor] Skipping ${leadData.email} - outside their working hours`);
                    skippedCount++;
                    continue;
                }
            }
            // ======= END TIMEZONE CHECK =======

            // ======= INTELLIGENT ROUTING - SELECT ACCOUNT =======
            let selectedAccountId = options.smtpAccountId; // Default to specified account

            if (useIntelligentRouting) {
                // Get next available account using intelligent routing
                const nextAccount = await getNextAccount(allSmtpAccounts, campaignId, routingConfig);

                if (!nextAccount) {
                    console.log(`[CampaignExecutor] ⚠️ All accounts reached their limits for this campaign`);
                    routingExhausted++;

                    // If all accounts exhausted, we'll continue with remaining leads in next run
                    continue;
                }

                selectedAccountId = nextAccount.id;
                console.log(`[CampaignExecutor] 🔄 Routing to: ${nextAccount.fromEmail}`);
            }
            // ======= END ROUTING =======

            // First email sends immediately, subsequent emails wait for delay
            if (sentCount > 0 && delayBetweenEmails > 0) {
                console.log(`[CampaignExecutor] Waiting ${delayBetweenEmails} seconds before sending to ${leadData.email}...`);
                await new Promise(resolve => setTimeout(resolve, delayBetweenEmails * 1000));
            }

            const success = await sendStepEmail(
                campaign,
                lead,
                lead.step,
                lead.stepIndex,
                selectedAccountId
            );

            if (success) {
                sentCount++;
                console.log(`[CampaignExecutor] ✓ Email ${sentCount} sent to ${leadData.email}`);

                // Track account usage for intelligent routing
                if (useIntelligentRouting && selectedAccountId) {
                    await markEmailSent(selectedAccountId, campaignId);

                    // Update usage map for logging
                    const currentCount = accountUsageMap.get(selectedAccountId) || 0;
                    accountUsageMap.set(selectedAccountId, currentCount + 1);
                }
            } else {
                failedCount++;
                console.log(`[CampaignExecutor] ✗ Failed to send to ${leadData.email}`);
            }
        }

        // Log routing summary
        if (useIntelligentRouting && accountUsageMap.size > 0) {
            console.log('[CampaignExecutor] 📊 Routing Summary:');
            for (const [accountId, count] of accountUsageMap.entries()) {
                const account = allSmtpAccounts.find(a => a.id === accountId);
                console.log(`  - ${account?.fromEmail || accountId}: ${count} emails`);
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

        console.log(`[CampaignExecutor] Completed: ${sentCount} sent, ${failedCount} failed, ${skippedCount} skipped (timezone), ${routingExhausted} exhausted (routing limits)`);
        return {
            success: true,
            sent: sentCount,
            failed: failedCount,
            skipped: skippedCount,
            routingExhausted,
            accountsUsed: accountUsageMap.size
        };

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
