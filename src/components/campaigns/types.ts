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
    // Timezone-aware sending fields
    timezone?: string;              // e.g., "America/New_York", "Europe/London", "Asia/Kolkata"
    workingHoursStart?: string;     // e.g., "09:00" (24h format)
    workingHoursEnd?: string;       // e.g., "18:00" (24h format)
    workingDays?: string[];         // e.g., ["monday", "tuesday", "wednesday", "thursday", "friday"]
    country?: string;               // For timezone inference if timezone not provided
    status: 'pending' | 'sent' | 'opened' | 'clicked' | 'replied' | 'bounced' | 'unsubscribed';
    customFields: Record<string, string>;
    addedAt: string;
}

export interface ColumnMapping {
    columnName: string;
    fieldType: 'email' | 'firstName' | 'lastName' | 'company' | 'timezone' | 'country' | 'workingHoursStart' | 'workingHoursEnd' | 'custom' | 'ignore';
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
