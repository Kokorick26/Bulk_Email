/**
 * Email Routing Service
 * 
 * Provides intelligent routing of emails across multiple SMTP accounts to:
 * - Distribute emails evenly across accounts
 * - Respect per-account sending limits
 * - Improve deliverability by rotating sender addresses
 * - Track usage per account for rate limiting
 */

import dynamoDB from '../db.js';

const SMTP_ACCOUNTS_TABLE = 'SmtpAccounts';
const ACCOUNT_USAGE_TABLE = 'AccountUsage';

/**
 * Email routing configuration
 */
const DEFAULT_CONFIG = {
    maxEmailsPerAccountPerCampaign: 15,  // Max emails per account per campaign
    maxEmailsPerAccountPerDay: 50,        // Max emails per account per day
    cooldownMinutes: 5,                   // Wait time after hitting per-campaign limit
    rotationStrategy: 'round-robin'       // 'round-robin', 'least-used', 'random'
};

/**
 * Get all available SMTP accounts for a user
 */
export async function getAvailableAccounts(userId) {
    try {
        const data = await dynamoDB.scan({
            TableName: SMTP_ACCOUNTS_TABLE,
            FilterExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            }
        }).promise();

        return data.Items || [];
    } catch (error) {
        console.error('[EmailRouter] Error fetching SMTP accounts:', error);
        return [];
    }
}

/**
 * Get or initialize usage tracking for an account
 */
async function getAccountUsage(accountId, campaignId) {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const usageKey = `${accountId}-${today}`;

    try {
        const data = await dynamoDB.get({
            TableName: ACCOUNT_USAGE_TABLE,
            Key: { id: usageKey }
        }).promise();

        if (data.Item) {
            return data.Item;
        }

        // Initialize new usage record
        const usage = {
            id: usageKey,
            accountId,
            date: today,
            totalSent: 0,
            campaignUsage: {}, // { campaignId: count }
            lastSentAt: null,
            createdAt: new Date().toISOString()
        };

        await dynamoDB.put({
            TableName: ACCOUNT_USAGE_TABLE,
            Item: usage
        }).promise();

        return usage;
    } catch (error) {
        console.error('[EmailRouter] Error getting account usage:', error);
        return {
            id: usageKey,
            accountId,
            date: today,
            totalSent: 0,
            campaignUsage: {},
            lastSentAt: null
        };
    }
}

/**
 * Update usage after sending an email
 */
async function updateAccountUsage(accountId, campaignId) {
    const today = new Date().toISOString().split('T')[0];
    const usageKey = `${accountId}-${today}`;

    try {
        await dynamoDB.update({
            TableName: ACCOUNT_USAGE_TABLE,
            Key: { id: usageKey },
            UpdateExpression: 'SET totalSent = if_not_exists(totalSent, :zero) + :one, lastSentAt = :now, campaignUsage.#campaignId = if_not_exists(campaignUsage.#campaignId, :zero) + :one',
            ExpressionAttributeNames: {
                '#campaignId': campaignId
            },
            ExpressionAttributeValues: {
                ':zero': 0,
                ':one': 1,
                ':now': new Date().toISOString()
            }
        }).promise();
    } catch (error) {
        // If update fails (attribute doesn't exist), try upsert approach
        try {
            const usage = await getAccountUsage(accountId, campaignId);
            usage.totalSent = (usage.totalSent || 0) + 1;
            usage.campaignUsage = usage.campaignUsage || {};
            usage.campaignUsage[campaignId] = (usage.campaignUsage[campaignId] || 0) + 1;
            usage.lastSentAt = new Date().toISOString();

            await dynamoDB.put({
                TableName: ACCOUNT_USAGE_TABLE,
                Item: usage
            }).promise();
        } catch (innerError) {
            console.error('[EmailRouter] Error updating account usage:', innerError);
        }
    }
}

/**
 * Check if an account can send more emails
 */
async function canAccountSend(accountId, campaignId, config) {
    const usage = await getAccountUsage(accountId, campaignId);

    // Check daily limit
    if (usage.totalSent >= config.maxEmailsPerAccountPerDay) {
        console.log(`[EmailRouter] Account ${accountId} hit daily limit (${usage.totalSent}/${config.maxEmailsPerAccountPerDay})`);
        return { canSend: false, reason: 'daily_limit' };
    }

    // Check per-campaign limit
    const campaignSent = usage.campaignUsage?.[campaignId] || 0;
    if (campaignSent >= config.maxEmailsPerAccountPerCampaign) {
        console.log(`[EmailRouter] Account ${accountId} hit campaign limit (${campaignSent}/${config.maxEmailsPerAccountPerCampaign})`);
        return { canSend: false, reason: 'campaign_limit' };
    }

    return { canSend: true };
}

/**
 * Get the next available SMTP account for sending
 * Uses intelligent routing based on the rotation strategy
 */
export async function getNextAccount(accounts, campaignId, config = {}) {
    const routingConfig = { ...DEFAULT_CONFIG, ...config };

    if (!accounts || accounts.length === 0) {
        console.error('[EmailRouter] No SMTP accounts available');
        return null;
    }

    // Get usage for all accounts
    const accountsWithUsage = await Promise.all(
        accounts.map(async (account) => {
            const usage = await getAccountUsage(account.id, campaignId);
            const checkResult = await canAccountSend(account.id, campaignId, routingConfig);
            return {
                account,
                usage,
                canSend: checkResult.canSend,
                reason: checkResult.reason,
                campaignSent: usage.campaignUsage?.[campaignId] || 0,
                totalSent: usage.totalSent || 0
            };
        })
    );

    // Filter to accounts that can send
    const availableAccounts = accountsWithUsage.filter(a => a.canSend);

    if (availableAccounts.length === 0) {
        console.log('[EmailRouter] All accounts have reached their limits');
        return null;
    }

    // Apply rotation strategy
    let selectedAccount;

    switch (routingConfig.rotationStrategy) {
        case 'least-used':
            // Select the account with least emails sent for this campaign
            availableAccounts.sort((a, b) => a.campaignSent - b.campaignSent);
            selectedAccount = availableAccounts[0];
            break;

        case 'random':
            // Randomly select an available account
            selectedAccount = availableAccounts[Math.floor(Math.random() * availableAccounts.length)];
            break;

        case 'round-robin':
        default:
            // Round robin: select account with least recent send and least campaign usage
            availableAccounts.sort((a, b) => {
                // Primary: least campaign usage
                if (a.campaignSent !== b.campaignSent) {
                    return a.campaignSent - b.campaignSent;
                }
                // Secondary: least recent send time
                const aTime = a.usage.lastSentAt ? new Date(a.usage.lastSentAt).getTime() : 0;
                const bTime = b.usage.lastSentAt ? new Date(b.usage.lastSentAt).getTime() : 0;
                return aTime - bTime;
            });
            selectedAccount = availableAccounts[0];
            break;
    }

    console.log(`[EmailRouter] Selected account: ${selectedAccount.account.fromEmail} (${selectedAccount.campaignSent}/${routingConfig.maxEmailsPerAccountPerCampaign} for campaign)`);

    return selectedAccount.account;
}

/**
 * Mark that an email was sent with a specific account
 */
export async function markEmailSent(accountId, campaignId) {
    await updateAccountUsage(accountId, campaignId);
}

/**
 * Get routing status for all accounts in a campaign
 */
export async function getRoutingStatus(accounts, campaignId, config = {}) {
    const routingConfig = { ...DEFAULT_CONFIG, ...config };

    const status = await Promise.all(
        accounts.map(async (account) => {
            const usage = await getAccountUsage(account.id, campaignId);
            const campaignSent = usage.campaignUsage?.[campaignId] || 0;
            const dailySent = usage.totalSent || 0;

            return {
                accountId: account.id,
                email: account.fromEmail,
                campaignSent,
                campaignLimit: routingConfig.maxEmailsPerAccountPerCampaign,
                campaignRemaining: Math.max(0, routingConfig.maxEmailsPerAccountPerCampaign - campaignSent),
                dailySent,
                dailyLimit: routingConfig.maxEmailsPerAccountPerDay,
                dailyRemaining: Math.max(0, routingConfig.maxEmailsPerAccountPerDay - dailySent),
                lastSentAt: usage.lastSentAt,
                canSend: campaignSent < routingConfig.maxEmailsPerAccountPerCampaign &&
                    dailySent < routingConfig.maxEmailsPerAccountPerDay
            };
        })
    );

    const totalRemaining = status.reduce((sum, s) => sum + s.campaignRemaining, 0);
    const accountsAvailable = status.filter(s => s.canSend).length;

    return {
        accounts: status,
        totalAccountsAvailable: accountsAvailable,
        totalEmailsRemaining: totalRemaining,
        allLimitsReached: accountsAvailable === 0
    };
}

/**
 * Calculate optimal distribution for a campaign
 */
export function calculateDistribution(totalLeads, accountCount, config = {}) {
    const routingConfig = { ...DEFAULT_CONFIG, ...config };
    const maxPerAccount = routingConfig.maxEmailsPerAccountPerCampaign;

    // Maximum we can send with current limits
    const maxTotalEmails = accountCount * maxPerAccount;

    // If we have more leads than capacity, we need multiple rounds
    const rounds = Math.ceil(totalLeads / maxTotalEmails);

    // Emails per account (evenly distributed)
    const leadsPerAccount = Math.min(
        Math.ceil(totalLeads / accountCount),
        maxPerAccount
    );

    return {
        totalLeads,
        accountCount,
        maxPerAccount,
        leadsPerAccount,
        maxCapacity: maxTotalEmails,
        rounds,
        canSendAll: totalLeads <= maxTotalEmails,
        distribution: Array(accountCount).fill(0).map((_, i) => {
            const remaining = totalLeads - (i * leadsPerAccount);
            return Math.min(leadsPerAccount, Math.max(0, remaining));
        })
    };
}

/**
 * Reset daily usage (call this at midnight or start of new day)
 *  FIX: Added pagination and batch deletion to prevent memory leaks
 */
export async function resetDailyUsage() {
    // Keep 7 days of history for analytics
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];

    try {
        let lastEvaluatedKey = null;
        let deletedCount = 0;

        do {
            const scanParams = {
                TableName: ACCOUNT_USAGE_TABLE,
                FilterExpression: '#date < :cutoff',
                ExpressionAttributeNames: { '#date': 'date' },
                ExpressionAttributeValues: { ':cutoff': cutoffStr },
                Limit: 25  //  Process in batches to avoid memory issues
            };

            if (lastEvaluatedKey) {
                scanParams.ExclusiveStartKey = lastEvaluatedKey;
            }

            const data = await dynamoDB.scan(scanParams).promise();

            // Batch delete (DynamoDB supports max 25 items per batch)
            if (data.Items && data.Items.length > 0) {
                const deleteRequests = data.Items.map(item => ({
                    DeleteRequest: { Key: { id: item.id } }
                }));

                // Process in batches of 25
                for (let i = 0; i < deleteRequests.length; i += 25) {
                    const batch = deleteRequests.slice(i, i + 25);
                    await dynamoDB.batchWrite({
                        RequestItems: {
                            [ACCOUNT_USAGE_TABLE]: batch
                        }
                    }).promise();
                }

                deletedCount += data.Items.length;
            }

            lastEvaluatedKey = data.LastEvaluatedKey;
        } while (lastEvaluatedKey);

        console.log(`[EmailRouter]  Cleaned up ${deletedCount} old usage records (older than ${cutoffStr})`);
        return { success: true, deleted: deletedCount };
    } catch (error) {
        console.error('[EmailRouter] Error cleaning up old usage:', error);
        return { success: false, error: error.message };
    }
}

export default {
    getAvailableAccounts,
    getNextAccount,
    markEmailSent,
    getRoutingStatus,
    calculateDistribution,
    resetDailyUsage,
    DEFAULT_CONFIG
};
