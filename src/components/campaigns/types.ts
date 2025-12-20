// Campaign System Types - Organized UX Structure

export interface Campaign {
    id: string;
    name: string;
    status: 'draft' | 'active' | 'paused' | 'completed' | 'failed' | 'scheduled';
    createdAt: string;
    updatedAt?: string;
    completedAt?: string;
    scheduledAt?: string;

    // Enhanced Statistics
    totalRecipients: number;
    sentCount: number;
    failedCount: number;
    openCount?: number;
    clickCount?: number;
    replyCount?: number;
    bounceCount?: number;
    unsubscribeCount?: number;
    spamComplaintCount?: number;

    // Progress & Metrics
    progress: number;
    deliveryRate?: number;
    openRate?: number;
    clickRate?: number;
    replyRate?: number;
    
    // Campaign Settings
    timezone?: string;
    sendWindow?: {
        start: string;
        end: string;
        days: string[];
    };
    
    // Enhanced Metadata
    tags?: string[];
    priority?: 'low' | 'normal' | 'high';
    aiGenerated?: boolean;
}

export interface Lead {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    company?: string;
    status: 'pending' | 'sent' | 'opened' | 'clicked' | 'replied' | 'bounced' | 'unsubscribed';
    customFields: Record<string, string>;
    addedAt: string;
}

export interface ColumnMapping {
    columnName: string;
    fieldType: 'email' | 'firstName' | 'lastName' | 'company' | 'custom' | 'ignore';
    customFieldName?: string;
    samples: string[];
}

export interface Sequence {
    id: string;
    campaignId: string;
    steps: SequenceStep[];
}

export interface SequenceStep {
    id: string;
    order: number;
    subject: string;
    body: string;
    delayDays: number;
    delayHours: number;
    variants: EmailVariant[];
}

export interface EmailVariant {
    id: string;
    subject: string;
    body: string;
    weight: number; // For A/B testing
}

export interface CampaignSchedule {
    timezone: string;
    sendDays: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[];
    startTime: string; // HH:mm format
    endTime: string;
    maxEmailsPerDay: number;
    delayBetweenEmails: number; // seconds
}

export interface CampaignOptions {
    trackOpens: boolean;
    trackClicks: boolean;
    stopOnReply: boolean;
    stopOnClick: boolean;
    removeUnsubscribed: boolean;
    smtpAccountId?: string;
}

export type CampaignTab = 'analytics' | 'leads' | 'sequences' | 'schedule' | 'options';

export interface CampaignFilter {
    status: 'all' | Campaign['status'];
    sortBy: 'newest' | 'oldest' | 'name' | 'recipients';
    search: string;
}
