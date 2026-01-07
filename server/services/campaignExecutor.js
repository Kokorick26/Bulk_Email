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
const USERS_TABLE = 'BulkEmailUsers';

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

// Update lead status in campaign's leads array
async function updateLeadStatusInCampaign(campaignId, leadEmail, newStatus) {
    try {
        // First get the campaign to find the lead
        const campaign = await dynamoDB.get({
            TableName: CAMPAIGNS_TABLE,
            Key: { id: campaignId }
        }).promise();

        if (!campaign.Item?.leads) return;

        // Find the lead and update their status
        const leads = campaign.Item.leads;
        const leadIndex = leads.findIndex(l => l.email === leadEmail);

        if (leadIndex === -1) return;

        // Update the lead status using DynamoDB set operation
        await dynamoDB.update({
            TableName: CAMPAIGNS_TABLE,
            Key: { id: campaignId },
            UpdateExpression: `SET leads[${leadIndex}].#status = :status, updatedAt = :updatedAt`,
            ExpressionAttributeNames: { '#status': 'status' },
            ExpressionAttributeValues: {
                ':status': newStatus,
                ':updatedAt': new Date().toISOString()
            }
        }).promise();

        console.log(`[CampaignExecutor] Updated lead ${leadEmail} status to ${newStatus}`);
    } catch (err) {
        console.error(`[CampaignExecutor] Failed to update lead status:`, err.message);
    }
}

// Replace personalization variables
function replaceVariables(text, data, senderProfile = {}) {
    if (!text) return '';
    let result = text;

    // Helper to clean empty strings - treats empty strings as null for fallback logic
    const cleanValue = (val) => {
        if (val === null || val === undefined) return '';
        const cleaned = String(val).trim();
        return cleaned === '' ? null : cleaned;  // Convert empty strings to null for || fallback
    };

    // Merge recipient data with sender profile mapping
    const safeData = {
        name: cleanValue(data.name),
        company: cleanValue(data.company),
        firstName: cleanValue(data.firstName),
        lastName: cleanValue(data.lastName),
        email: cleanValue(data.email),

        // Sender Profile Mappings (Handle {{senderName}} style)
        senderName: cleanValue(senderProfile.senderFullName || senderProfile.fromName),
        senderFullName: cleanValue(senderProfile.senderFullName || senderProfile.fromName),
        senderPosition: cleanValue(senderProfile.senderPosition),
        senderCompany: cleanValue(senderProfile.senderCompany),
        senderPhone: cleanValue(senderProfile.senderPhone),
        senderWebsite: cleanValue(senderProfile.senderWebsite),
        senderLinkedIn: cleanValue(senderProfile.senderLinkedIn),
        senderAddress: cleanValue(senderProfile.senderAddress),
        senderSignature: cleanValue(senderProfile.senderSignature),
    };

    // Handle {{First Name}}, {{Last Name}}, {{Company Name}} etc with spaces
    const spacedMappings = {
        'First Name': safeData.firstName || safeData.name?.split(' ')[0] || '',
        'Last Name': safeData.lastName || safeData.name?.split(' ').slice(1).join(' ') || '',
        'Full Name': safeData.name || `${safeData.firstName || ''} ${safeData.lastName || ''}`.trim() || '',
        'Company Name': safeData.company || '',
        'Company': safeData.company || '',
        'Email': safeData.email || '',
        'Sender Name': safeData.senderFullName || '',
        'Sender Position': safeData.senderPosition || '',
        'Sender Company': safeData.senderCompany || '',
        'Sender Phone': safeData.senderPhone || '',
        'Sender Website': safeData.senderWebsite || '',
    };

    // Replace spaced variable names first (before camelCase)
    Object.entries(spacedMappings).forEach(([key, value]) => {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'gi');
        result = result.replace(regex, value || '');
    });

    // Standard Handlebars-style {{key}} replacement (camelCase)
    Object.keys(safeData).forEach(key => {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'gi');
        result = result.replace(regex, safeData[key] || '');
    });

    // Square Bracket [Your Name] Style Replacement
    const bracketMappings = {
        'Your Name': safeData.senderFullName,
        'My Name': safeData.senderFullName,
        'Name': safeData.senderFullName,

        'Your Position': safeData.senderPosition,
        'My Position': safeData.senderPosition,
        'Position': safeData.senderPosition,
        'Job Title': safeData.senderPosition,

        'Your Company': safeData.senderCompany,
        'My Company': safeData.senderCompany,
        'Company': safeData.senderCompany,
        'Company Name': safeData.senderCompany,

        'Your Phone': safeData.senderPhone,
        'My Phone': safeData.senderPhone,
        'Phone': safeData.senderPhone,

        'Your Website': safeData.senderWebsite,
        'My Website': safeData.senderWebsite,
        'Website': safeData.senderWebsite,

        'LinkedIn': safeData.senderLinkedIn,
        'Address': safeData.senderAddress
    };

    Object.entries(bracketMappings).forEach(([key, value]) => {
        // Match [Key], [key], [KEY]
        const regex = new RegExp(`\\[${key}\\]`, 'gi');
        result = result.replace(regex, value || '');
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
    const workingDays = leadData.workingDays || campaignSchedule?.days ||
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
        console.log(`[Timezone] Lead ${leadData.email}: ${currentTime} ${timezone} is WITHIN working hours `);
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
                fromName: account.Item.fromName,
                senderProfile: account.Item // Return full item to access sender fields
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
        fromName: process.env.SMTP_FROM_NAME || process.env.SMTP_USER?.split('@')[0] || 'Support',
        senderProfile: {} // No profile for env fallback
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
                    return resolve({ hasReplied: false });
                }

                // Search for emails from the lead since our last email
                const searchCriteria = [
                    ['FROM', leadEmail],
                    ['SINCE', sinceDate]
                ];

                imap.search(searchCriteria, (err, results) => {
                    if (err) {
                        console.error('[ReplyCheck] Search error:', err);
                        imap.end();
                        return resolve({ hasReplied: false });
                    }

                    if (results.length === 0) {
                        imap.end();
                        return resolve({ hasReplied: false });
                    }

                    // Fetch the most recent reply
                    const fetch = imap.fetch(results[results.length - 1], {
                        bodies: ['HEADER', 'TEXT'],
                        struct: true
                    });

                    let replyData = {
                        hasReplied: true,
                        from: leadEmail,
                        subject: '',
                        body: '',
                        receivedAt: new Date().toISOString()
                    };

                    fetch.on('message', (msg) => {
                        msg.on('body', (stream, info) => {
                            let buffer = '';
                            stream.on('data', (chunk) => {
                                buffer += chunk.toString('utf8');
                            });
                            stream.once('end', () => {
                                if (info.which === 'HEADER') {
                                    const Imap = require('imap');
                                    const header = Imap.parseHeader(buffer);
                                    replyData.subject = header.subject ? header.subject[0] : '';
                                    replyData.receivedAt = header.date ? new Date(header.date[0]).toISOString() : new Date().toISOString();
                                } else if (info.which === 'TEXT') {
                                    // Clean up the body text
                                    replyData.body = buffer.substring(0, 1000); // Limit to 1000 chars
                                }
                            });
                        });
                    });

                    fetch.once('error', (err) => {
                        console.error('[ReplyCheck] Fetch error:', err);
                        imap.end();
                        resolve({ hasReplied: false });
                    });

                    fetch.once('end', () => {
                        imap.end();
                        console.log(`[ReplyCheck] Found reply from ${leadEmail}: "${replyData.subject}"`);
                        resolve(replyData);
                    });
                });
            });
        });
    } catch (error) {
        console.error('[ReplyCheck] Connection error:', error.message);
        return { hasReplied: false };
    }
}

// Initialize lead progress for a campaign
async function initializeLeadProgress(campaignId, leads, smtpAccounts = []) {
    //  FIX: Deduplicate leads by email to prevent duplicate sends
    const seenEmails = new Set();
    const uniqueLeads = [];
    const duplicates = [];

    for (const lead of leads) {
        const email = lead.email.toLowerCase().trim();
        if (seenEmails.has(email)) {
            duplicates.push(lead);
        } else {
            seenEmails.add(email);
            uniqueLeads.push(lead);
        }
    }

    if (duplicates.length > 0) {
        console.log(`[LeadProgress]  Removed ${duplicates.length} duplicate email(s)`);

        // Update campaign to reflect deduplicated leads
        try {
            await dynamoDB.update({
                TableName: CAMPAIGNS_TABLE,
                Key: { id: campaignId },
                UpdateExpression: 'SET leads = :leads, duplicatesRemoved = if_not_exists(duplicatesRemoved, :zero) + :count',
                ExpressionAttributeValues: {
                    ':leads': uniqueLeads,
                    ':count': duplicates.length,
                    ':zero': 0
                }
            }).promise();
        } catch (err) {
            console.error('[LeadProgress] Error updating campaign with deduplicated leads:', err);
        }
    }

    // Process unique leads only
    for (let i = 0; i < uniqueLeads.length; i++) {
        const lead = uniqueLeads[i];
        const progressId = `${campaignId}-${lead.id || lead.email}`;

        // Assign account round-robin if not already assigned and accounts are available
        let assignedAccountId = lead.sendingAccountId;
        if (!assignedAccountId && smtpAccounts.length > 0) {
            assignedAccountId = smtpAccounts[i % smtpAccounts.length].id;
            console.log(`[LeadProgress] Auto-assigned account ${smtpAccounts[i % smtpAccounts.length].fromEmail} to ${lead.email}`);
        }

        // First, try to check if record exists and needs sendingAccountId update
        try {
            const existing = await dynamoDB.get({
                TableName: LEAD_PROGRESS_TABLE,
                Key: { id: progressId }
            }).promise();

            if (existing.Item) {
                // Record exists - update it if missing sendingAccountId
                if (!existing.Item.sendingAccountId && assignedAccountId) {
                    await dynamoDB.update({
                        TableName: LEAD_PROGRESS_TABLE,
                        Key: { id: progressId },
                        UpdateExpression: 'SET sendingAccountId = :accountId, updatedAt = :now',
                        ExpressionAttributeValues: {
                            ':accountId': assignedAccountId,
                            ':now': new Date().toISOString()
                        }
                    }).promise();
                    console.log(`[LeadProgress] Updated existing record with account for ${lead.email}`);
                }
                continue; // Already exists, move to next lead
            }
        } catch (err) {
            // If get fails, try to create new
        }

        // Create new progress record
        const progress = {
            id: progressId,
            campaignId,
            leadId: lead.id || lead.email,
            leadEmail: lead.email,
            leadData: lead,
            sendingAccountId: assignedAccountId, // Store the assigned account
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
                Item: progress
            }).promise();
        } catch (err) {
            console.error('[LeadProgress] Error creating:', err);
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
        const { transporter, fromEmail, fromName, senderProfile } = await getTransporter(smtpAccountId);

        // Validate that we have a proper email configuration
        if (!fromEmail || !transporter) {
            throw new Error(`No valid SMTP configuration found for account ${smtpAccountId || 'default'}. Please configure an SMTP account.`);
        }

        // Extract lead data from progress
        const leadEmail = lead.progress?.leadEmail || lead.leadEmail;
        const leadData = lead.progress?.leadData || lead.leadData || {};

        //  ENHANCED DEBUG LOGGING
        console.log(`\n[CampaignExecutor] ========== EMAIL PREPARATION ==========`);
        console.log(`[CampaignExecutor] Lead: ${leadEmail}`);
        console.log(`[CampaignExecutor] SMTP Account: ${smtpAccountId} (${fromEmail})`);
        console.log(`[CampaignExecutor] Lead Data:`, {
            firstName: leadData.firstName,
            lastName: leadData.lastName,
            name: leadData.name,
            company: leadData.company,
            email: leadData.email
        });
        console.log(`[CampaignExecutor] Sender Profile:`, {
            senderFullName: senderProfile.senderFullName,
            fromName: senderProfile.fromName,
            senderPosition: senderProfile.senderPosition,
            senderCompany: senderProfile.senderCompany
        });

        // Personalize content
        let subject = processSpintax(step.subject);
        console.log(`[CampaignExecutor] Subject BEFORE replacement: "${subject}"`);
        subject = replaceVariables(subject, leadData, senderProfile);
        console.log(`[CampaignExecutor] Subject AFTER replacement: "${subject}"`);

        let body = processSpintax(step.body);
        console.log(`[CampaignExecutor] Body BEFORE (first 200 chars): "${body.substring(0, 200)}"`);
        body = replaceVariables(body, leadData, senderProfile);
        console.log(`[CampaignExecutor] Body AFTER (first 200 chars): "${body.substring(0, 200)}"`);

        // Convert to HTML
        const html = `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#202124">${body.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</div>`;

        // Generate unique message ID - safely handle undefined fromEmail
        const domain = (fromEmail && fromEmail.includes('@')) ? fromEmail.split('@')[1] : 'kokorick.uk';
        const messageId = `<${Date.now()}.${Math.random().toString(36).substr(2, 9)}@${domain}>`;

        //  FINAL EMAIL PREVIEW
        console.log(`\n[CampaignExecutor]  FINAL EMAIL PREVIEW:`);
        console.log(`  To: ${leadEmail}`);
        console.log(`  From: "${fromName}" <${fromEmail}>`);
        console.log(`  Subject: ${subject}`);
        console.log(`  Body Preview: ${body.substring(0, 300).replace(/\n/g, ' ')}...`);
        console.log(`[CampaignExecutor] ==========================================\n`);

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
                smtpAccountId: smtpAccountId,  //  Track which account sent it
                fromEmail: fromEmail  //  Track sender email
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
                    messageId: info.messageId,
                    smtpAccountId: smtpAccountId,  //  Track in history
                    fromEmail: fromEmail
                }],
                ':updatedAt': new Date().toISOString()
            }
        }).promise();

        // Update lead status in campaign's leads array so UI reflects actual status
        await updateLeadStatusInCampaign(campaign.id, leadEmail, 'sent');

        console.log(`[CampaignExecutor]  Successfully sent step ${stepIndex + 1} to ${leadEmail} from ${fromEmail}`);
        return true;

    } catch (error) {
        const errorEmail = lead.progress?.leadEmail || lead.leadEmail || 'unknown';
        console.error(`[CampaignExecutor]  Failed to send to ${errorEmail}:`, error.message);
        console.error(`[CampaignExecutor] Error stack:`, error.stack);

        // Log the failure
        try {
            await dynamoDB.put({
                TableName: EMAIL_LOGS_TABLE,
                Item: {
                    id: uuidv4(),
                    campaignId: campaign.id,
                    email: errorEmail,
                    status: 'failed',
                    stepIndex,
                    error: error.message,
                    errorStack: error.stack,  //  Include stack trace
                    sentAt: new Date().toISOString(),
                    smtpAccountId: smtpAccountId  //  Track which account failed
                }
            }).promise();

            // Update lead status in campaign to 'bounced' to indicate failure
            await updateLeadStatusInCampaign(campaign.id, errorEmail, 'bounced');
        } catch (e) {
            console.error(`[CampaignExecutor] Failed to log error:`, e);
        }

        return false;
    }
}

// Check all leads for replies (always track replies for analytics)
async function checkCampaignReplies(campaign, smtpAccount, stopOnReply = true) {
    // Always check for replies to track them, stopOnReply controls whether to stop the sequence

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

            const replyResult = await checkForReplies(
                smtpAccount,
                progress.leadEmail,
                new Date(progress.lastStepSentAt)
            );

            if (replyResult.hasReplied) {
                console.log(`[CampaignExecutor] Detected reply from ${progress.leadEmail}: "${replyResult.subject}"`);

                await dynamoDB.update({
                    TableName: LEAD_PROGRESS_TABLE,
                    Key: { id: progress.id },
                    UpdateExpression: 'SET hasReplied = :hasReplied, #status = :status, updatedAt = :updatedAt, replyReceivedAt = :replyReceivedAt, replySubject = :replySubject, replyBody = :replyBody, replyFrom = :replyFrom',
                    ExpressionAttributeNames: { '#status': 'status' },
                    ExpressionAttributeValues: {
                        ':hasReplied': true,
                        // Only mark as 'replied' (stopping sequence) if stopOnReply is enabled
                        ':status': stopOnReply ? 'replied' : 'in_progress',
                        ':updatedAt': new Date().toISOString(),
                        ':replyReceivedAt': replyResult.receivedAt,
                        ':replySubject': replyResult.subject,
                        ':replyBody': replyResult.body,
                        ':replyFrom': replyResult.from
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
        // Get all available SMTP accounts for this campaign
        // Note: campaigns use 'createdBy' field, not 'userId'
        const userId = campaign.userId || campaign.createdBy;
        let allSmtpAccounts = [];

        try {
            // If selectedAccountIds is specified, we need to fetch ALL accounts first
            // so we can filter by the specific IDs (accounts may not have userId set)
            let hasSelectedAccounts = options.selectedAccountIds && Array.isArray(options.selectedAccountIds) && options.selectedAccountIds.length > 0;

            // Debug: Log what's in campaign.leads
            const leads = campaign.leads || [];
            console.log(`[CampaignExecutor] DEBUG: campaign.leads has ${leads.length} items`);
            if (leads.length > 0) {
                console.log(`[CampaignExecutor] DEBUG: First lead keys:`, Object.keys(leads[0]));
                console.log(`[CampaignExecutor] DEBUG: First lead:`, JSON.stringify(leads[0]).substring(0, 500));
            }

            // Check multiple possible field names for account ID
            const leadAccountIds = [...new Set(leads.map(l =>
                l.sendingAccountId || l.smtpAccountId || l.accountId
            ).filter(Boolean))];
            console.log(`[CampaignExecutor] DEBUG: Found ${leadAccountIds.length} account IDs from leads`);

            if (leadAccountIds.length > 0 && !hasSelectedAccounts) {
                console.log(`[CampaignExecutor] Found ${leadAccountIds.length} account IDs from leads: ${leadAccountIds.join(', ')}`);
                options.selectedAccountIds = leadAccountIds;
                hasSelectedAccounts = true;
            }

            // Always scan ALL SMTP accounts first (needed for round-robin assignment)
            let scanParams = { TableName: SMTP_ACCOUNTS_TABLE };

            console.log(`[CampaignExecutor] Scanning ALL SMTP accounts for round-robin assignment`);

            const accountsData = await dynamoDB.scan(scanParams).promise();
            allSmtpAccounts = accountsData.Items || [];
            console.log(`[CampaignExecutor] Fetched ${allSmtpAccounts.length} total SMTP accounts`);

            // FILTER ACCOUNTS BASED ON SELECTED ACCOUNT IDS
            if (hasSelectedAccounts) {
                console.log(`[CampaignExecutor] Filtering to ${options.selectedAccountIds.length} selected accounts: ${options.selectedAccountIds.join(', ')}`);
                allSmtpAccounts = allSmtpAccounts.filter(acc =>
                    options.selectedAccountIds.includes(acc.id)
                );
            } else if (options.smtpAccountId) {
                // Fallback for single account selection (legacy)
                console.log(`[CampaignExecutor] Filtering for single account: ${options.smtpAccountId}`);
                allSmtpAccounts = allSmtpAccounts.filter(acc => acc.id === options.smtpAccountId);
            }

            console.log(`[CampaignExecutor] Found ${allSmtpAccounts.length} accounts available for campaign`);

        } catch (err) {
            console.log('[CampaignExecutor] Error fetching SMTP accounts:', err.message);
        }

        // If no accounts found or intelligentRouting disabled, fall back to single account
        const useIntelligentRouting = options.useIntelligentRouting !== false && allSmtpAccounts.length > 1;

        // Fetch user settings for email limits
        let userSettings = {
            maxEmailsPerAccountPerDay: 15  // Default: 15 emails per account per day to avoid spam
        };

        try {
            if (!userId) {
                throw new Error('No userId available');
            }
            const userData = await dynamoDB.get({
                TableName: USERS_TABLE,
                Key: { id: userId }
            }).promise();

            if (userData.Item?.settings?.maxEmailsPerAccountPerDay) {
                userSettings.maxEmailsPerAccountPerDay = userData.Item.settings.maxEmailsPerAccountPerDay;
                console.log(`[CampaignExecutor] Using user settings: ${userSettings.maxEmailsPerAccountPerDay} emails per account per day`);
            }
        } catch (err) {
            console.log('[CampaignExecutor] Could not fetch user settings, using defaults');
        }

        // For intelligent routing: daily limit is the key constraint
        // Per-campaign limit = daily limit since campaigns continue across multiple days
        const accountDailyLimit = options.maxDailyPerAccount || userSettings.maxEmailsPerAccountPerDay;
        const routingConfig = {
            maxEmailsPerAccountPerCampaign: accountDailyLimit,  // Same as daily limit - campaigns span days
            maxEmailsPerAccountPerDay: accountDailyLimit,
            rotationStrategy: options.rotationStrategy || 'round-robin'
        };

        if (useIntelligentRouting) {
            console.log(`[CampaignExecutor]  Intelligent Routing ENABLED with ${allSmtpAccounts.length} accounts`);
            console.log(`[CampaignExecutor] Max ${routingConfig.maxEmailsPerAccountPerDay} emails per account per day`);

            // Show distribution calculation
            const distribution = calculateDistribution(
                campaign.leads.length,
                allSmtpAccounts.length,
                routingConfig
            );
            console.log(`[CampaignExecutor] Distribution: ${JSON.stringify(distribution)}`);
        } else {
            console.log(`[CampaignExecutor] Using single SMTP account (${options.smtpAccountId || 'default'}) with ${accountDailyLimit} emails/day limit`);
        }
        // ========== END ROUTING SETUP ==========

        // Initialize lead progress if not already done
        await initializeLeadProgress(campaignId, campaign.leads, allSmtpAccounts);

        //  FIX: Wait for DynamoDB eventual consistency (100ms is usually enough)
        await new Promise(resolve => setTimeout(resolve, 100));

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

        // Check for replies before sending new emails (always check for analytics)
        if (smtpAccount) {
            await checkCampaignReplies(campaign, smtpAccount, options.stopOnReply);
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
        // Time between emails: options.timeBetweenEmails is in MINUTES, convert to seconds
        const delayBetweenEmailsMinutes = options.timeBetweenEmails || schedule?.delayBetweenEmails || 10;
        const delayBetweenEmails = delayBetweenEmailsMinutes * 60; // Convert to seconds
        const dailyLimit = options.dailyLimit || 15;

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
                        console.log(`[CampaignExecutor]  Campaign ${currentStatus} - STOPPING IMMEDIATELY`);
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
            // Priority: 1. Progress's assigned account (from round-robin), 2. Lead's manual assignment, 3. Intelligent routing, 4. Campaign default
            let selectedAccountId = lead.progress?.sendingAccountId || lead.sendingAccountId || leadData.sendingAccountId || options.smtpAccountId;

            // Log lead's account assignment
            if (selectedAccountId) {
                console.log(`[CampaignExecutor] Lead ${leadData.email} using account: ${selectedAccountId}`);
            }

            if (!selectedAccountId && useIntelligentRouting) {
                // Get next available account using intelligent routing
                const nextAccount = await getNextAccount(allSmtpAccounts, campaignId, routingConfig);

                if (!nextAccount) {
                    console.log(`[CampaignExecutor]  All accounts reached their limits for this campaign`);
                    routingExhausted++;

                    // If all accounts exhausted, we'll continue with remaining leads in next run
                    continue;
                }

                selectedAccountId = nextAccount.id;
                console.log(`[CampaignExecutor]  Routing to: ${nextAccount.fromEmail}`);
            }
            // ======= END ROUTING =======

            // First email sends immediately, subsequent emails wait for delay
            if (sentCount > 0 && delayBetweenEmails > 0) {
                console.log(`[CampaignExecutor] Waiting ${delayBetweenEmailsMinutes} minutes before sending to ${leadData.email}...`);
                //  FIX: Convert minutes to milliseconds (was treating as seconds!)
                await new Promise(resolve => setTimeout(resolve, delayBetweenEmails * 60 * 1000));
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
                console.log(`[CampaignExecutor]  Email ${sentCount} sent to ${leadData.email}`);

                // Track account usage for intelligent routing
                if (useIntelligentRouting && selectedAccountId) {
                    await markEmailSent(selectedAccountId, campaignId);

                    // Update usage map for logging
                    const currentCount = accountUsageMap.get(selectedAccountId) || 0;
                    accountUsageMap.set(selectedAccountId, currentCount + 1);
                }
            } else {
                failedCount++;
                console.log(`[CampaignExecutor]  Failed to send to ${leadData.email}`);
            }
        }

        // Log routing summary
        if (useIntelligentRouting && accountUsageMap.size > 0) {
            console.log('[CampaignExecutor]  Routing Summary:');
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

        //  FIX: Reschedule skipped leads to prevent infinite loops
        if (skippedCount > 0 || routingExhausted > 0) {
            const totalSkipped = skippedCount + routingExhausted;
            console.log(`[CampaignExecutor]  Rescheduling ${totalSkipped} skipped leads for next run`);

            // Set next run time (30 minutes from now for timezone skips, 60 minutes for routing exhaustion)
            const nextRunDelay = routingExhausted > 0 ? 60 : 30;  // minutes
            const nextRunAt = new Date(Date.now() + nextRunDelay * 60 * 1000).toISOString();

            await dynamoDB.update({
                TableName: CAMPAIGNS_TABLE,
                Key: { id: campaignId },
                UpdateExpression: 'SET skippedCount = if_not_exists(skippedCount, :zero) + :skipped, nextRunAt = :nextRun',
                ExpressionAttributeValues: {
                    ':zero': 0,
                    ':skipped': totalSkipped,
                    ':nextRun': nextRunAt
                }
            }).promise();

            console.log(`[CampaignExecutor] Next run scheduled for: ${new Date(nextRunAt).toLocaleString()}`);
        }

        console.log(`[CampaignExecutor] Completed: ${sentCount} sent, ${failedCount} failed, ${skippedCount} skipped (timezone), ${routingExhausted} exhausted (routing limits)`);

        //  FIX: Check if campaign is complete (all leads processed)
        const allLeadsComplete = leadsToProcess.length === 0 ||
            (sentCount === 0 && skippedCount === 0 && routingExhausted === 0);

        if (allLeadsComplete && leadsToProcess.length === 0) {
            console.log(`[CampaignExecutor]  Campaign completed - all leads processed!`);

            await dynamoDB.update({
                TableName: CAMPAIGNS_TABLE,
                Key: { id: campaignId },
                UpdateExpression: 'SET #status = :completed, completedAt = :now',
                ExpressionAttributeNames: { '#status': 'status' },
                ExpressionAttributeValues: {
                    ':completed': 'completed',
                    ':now': new Date().toISOString()
                }
            }).promise();
        }

        return {
            success: true,
            sent: sentCount,
            failed: failedCount,
            skipped: skippedCount,
            routingExhausted,
            accountsUsed: accountUsageMap.size,
            completed: allLeadsComplete && leadsToProcess.length === 0  //  Signal completion
        };

    } catch (error) {
        console.error('[CampaignExecutor] Error:', error);
        return { success: false, error: error.message };
    }
}

// Process all active campaigns
export async function processAllActiveCampaigns() {
    try {
        //  FIX: Only process campaigns that are ready to run (respect nextRunAt)
        const now = new Date().toISOString();
        const data = await dynamoDB.scan({
            TableName: CAMPAIGNS_TABLE,
            FilterExpression: '#status = :active AND (attribute_not_exists(nextRunAt) OR nextRunAt <= :now)',
            ExpressionAttributeNames: { '#status': 'status' },
            ExpressionAttributeValues: {
                ':active': 'active',
                ':now': now
            }
        }).promise();

        const campaigns = data.Items || [];
        console.log(`[CampaignExecutor] Found ${campaigns.length} active campaigns ready to process`);

        for (const campaign of campaigns) {
            try {
                console.log(`[CampaignExecutor] Processing campaign: ${campaign.name} (${campaign.id})`);
                await executeCampaign(campaign.id);
            } catch (error) {
                console.error(`[CampaignExecutor] Error processing campaign ${campaign.id}:`, error);
            }
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

// Check all active campaigns for replies
export async function checkAllCampaignsForReplies() {
    try {
        console.log('[ReplyChecker] Checking all campaigns for replies...');

        // Get all active campaigns
        const campaignsData = await dynamoDB.scan({
            TableName: CAMPAIGNS_TABLE,
            FilterExpression: '#status IN (:active, :paused)',
            ExpressionAttributeNames: { '#status': 'status' },
            ExpressionAttributeValues: {
                ':active': 'active',
                ':paused': 'paused'
            }
        }).promise();

        const campaigns = campaignsData.Items || [];
        console.log(`[ReplyChecker] Found ${campaigns.length} active campaigns`);

        for (const campaign of campaigns) {
            // Get first SMTP account for this campaign
            const smtpAccountId = campaign.smtpAccountIds?.[0];
            if (!smtpAccountId) continue;

            const smtpData = await dynamoDB.get({
                TableName: SMTP_ACCOUNTS_TABLE,
                Key: { id: smtpAccountId }
            }).promise();

            if (!smtpData.Item) continue;

            // Check for replies (stopOnReply = true to stop sequences)
            await checkCampaignReplies(campaign, smtpData.Item, true);
        }

        console.log('[ReplyChecker] Reply check complete');
    } catch (error) {
        console.error('[ReplyChecker] Error:', error);
    }
}

export default {
    executeCampaign,
    processAllActiveCampaigns,
    startCampaignScheduler,
    stopCampaignScheduler,
    checkAllCampaignsForReplies
};
