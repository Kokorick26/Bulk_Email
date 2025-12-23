// AI Sales Discovery Engine Types

export interface DiscoveryFilters {
    industry: string[];
    region: string[];
    companySize: string[];
    targetRole: string[];
    revenueRange: {
        min: number;
        max: number;
    };
    techMaturity: 'low' | 'medium' | 'high' | '';
    platforms: string[];
}

export interface DiscoveryLead {
    id: string;
    companyName: string;
    website: string;
    linkedInUrl?: string;
    industry: string;
    country: string;
    region: string;
    companySize: string;
    description: string;
    aiReasoning: string;
    suggestedRole: string;
    confidenceScore: number;
    matchedCriteria: string[];
    techStack?: string[];
    recentActivity?: string;
    foundOnPlatform: string;
    employees?: Employee[];
}

export interface Employee {
    id: string;
    name: string;
    role: string;
    email?: string;
    emailConfidence?: 'verified' | 'likely' | 'pattern';
    linkedInUrl?: string;
    department?: string;
    source: string;
}

export interface DiscoveryRequest {
    prompt: string;
    filters: DiscoveryFilters;
}

export interface DiscoveryResponse {
    leads: DiscoveryLead[];
    searchSummary: string;
    processingTime: number;
    totalCandidatesEvaluated: number;
}

export interface DiscoveryStep {
    id: number;
    title: string;
    description: string;
    status: 'pending' | 'active' | 'completed';
}

export const DEFAULT_FILTERS: DiscoveryFilters = {
    industry: [],
    region: [],
    companySize: [],
    targetRole: [],
    revenueRange: { min: 0, max: 50 },
    techMaturity: '',
    platforms: ['linkedin', 'websites', 'directories'],
};

export const INDUSTRIES = [
    'SaaS',
    'E-commerce',
    'Healthcare',
    'FinTech',
    'EdTech',
    'MarTech',
    'PropTech',
    'Legal Tech',
    'HR Tech',
    'Manufacturing',
    'Logistics',
    'Retail',
    'Media & Entertainment',
    'Travel & Hospitality',
    'Real Estate',
];

export const REGIONS = [
    { value: 'uk', label: 'United Kingdom' },
    { value: 'usa', label: 'United States' },
    { value: 'europe', label: 'Europe' },
    { value: 'asia', label: 'Asia Pacific' },
    { value: 'middle-east', label: 'Middle East' },
    { value: 'latam', label: 'Latin America' },
    { value: 'canada', label: 'Canada' },
    { value: 'australia', label: 'Australia & NZ' },
];

export const COMPANY_SIZES = [
    { value: 'startup', label: 'Startup (1-10)' },
    { value: 'small', label: 'Small (11-50)' },
    { value: 'sme', label: 'SME (51-200)' },
    { value: 'mid-market', label: 'Mid-Market (201-1000)' },
    { value: 'enterprise', label: 'Enterprise (1000+)' },
];

export const TARGET_ROLES = [
    'Founder / CEO',
    'CTO / Tech Lead',
    'Head of Sales',
    'Head of Marketing',
    'COO / Operations',
    'CFO / Finance',
    'HR Director',
    'Product Manager',
    'VP of Engineering',
    'Growth Lead',
];

export const PLATFORMS = [
    { value: 'linkedin', label: 'LinkedIn', icon: 'linkedin' },
    { value: 'websites', label: 'Company Websites', icon: 'globe' },
    { value: 'directories', label: 'Business Directories', icon: 'book' },
    { value: 'crunchbase', label: 'Crunchbase', icon: 'database' },
];
