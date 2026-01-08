import { useState, createContext, useContext, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Mail, LogOut, Menu, X, User, Settings, Search, Bell, Crown,
    LayoutDashboard, Megaphone, Target, Users, Server, Inbox,
    ChevronDown, ChevronLeft, Plus, Filter, Clock, CheckCircle,
    Archive, Star, Folder, BarChart2, Send, Zap, FileText,
    Globe, TrendingUp, Activity
} from 'lucide-react';
import { cn } from '../lib/utils';
import UnifiedDashboard from '../components/mail/UnifiedDashboard';
import { Toaster } from 'sonner';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '../components/ui/DropdownMenu';
import { Avatar, AvatarFallback } from '../components/ui/Avatar';
import { useTheme } from '../lib/ThemeContext';
import { ScrollArea } from '../components/ui/ScrollArea';

// ═══════════════════════════════════════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════════════════════════════════════

interface DashboardContextType {
    sidebarCollapsed: boolean;
    setSidebarCollapsed: (value: boolean) => void;
    activeSection: string;
    setActiveSection: (section: string) => void;
    activeSubItem: string;
    setActiveSubItem: (item: string) => void;
    navigateToSettings: () => void;
    setNavigateToSettings: (fn: () => void) => void;
    inboxFilterAccountIds: string[];
    setInboxFilterAccountIds: (ids: string[]) => void;
    inboxFilterCampaignId: string | null;
    setInboxFilterCampaignId: (id: string | null) => void;
    inboxViewMode: 'selection' | 'inbox';
    setInboxViewMode: (mode: 'selection' | 'inbox') => void;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export const useDashboardContext = () => {
    const context = useContext(DashboardContext);
    if (!context) throw new Error('useDashboardContext must be used within DashboardShell');
    return context;
};

// Types
interface InboxCounts {
    all: number;
    unread: number;
    starred: number;
    sent: number;
    drafts: number;
    trash: number;
    archive: number;
    spam: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// NAVIGATION CONFIG
// ═══════════════════════════════════════════════════════════════════════════

const NAV_ITEMS = [
    { id: 'campaigns', icon: Megaphone, label: 'Campaigns' },
    { id: 'inbox', icon: Inbox, label: 'Inbox' },
    { id: 'discovery', icon: Target, label: 'Discovery' },
    { id: 'lead-lists', icon: Users, label: 'Lead Lists' },
    { id: 'analytics', icon: Globe, label: 'Analytics' },
    { id: 'accounts', icon: Server, label: 'Accounts' },
];

// Content configuration for detail sidebar
const SIDEBAR_CONTENT: Record<string, {
    title: string;
    sections: Array<{
        title: string;
        items: Array<{
            icon: any;
            label: string;
            id?: string;
            badge?: string | number;
            children?: Array<{ label: string; id?: string }>;
        }>;
    }>;
}> = {
    campaigns: {
        title: 'Campaigns',
        sections: [
            {
                title: 'Quick Actions',
                items: [
                    { icon: Plus, label: 'New Campaign', id: 'new-campaign' },
                    { icon: Filter, label: 'Filter', id: 'filter' },
                ],
            },
            {
                title: 'Status',
                items: [
                    { icon: Send, label: 'Active', id: 'active' },
                    { icon: Clock, label: 'Scheduled', id: 'scheduled' },
                    { icon: FileText, label: 'Drafts', id: 'drafts' },
                    { icon: CheckCircle, label: 'Completed', id: 'completed' },
                    { icon: Archive, label: 'Archived', id: 'archived' },
                ],
            },
        ],
    },
    analytics: {
        title: 'Analytics',
        sections: [
            {
                title: 'Overview',
                items: [
                    { icon: Globe, label: 'Geographic', id: 'geo' },
                    { icon: Activity, label: 'Engagement', id: 'engagement' },
                ],
            },
            {
                title: 'Reports',
                items: [
                    { icon: FileText, label: 'Download', id: 'download' },
                ],
            },
        ],
    },
    inbox: {
        title: 'Inbox',
        sections: [
            {
                title: 'Folders',
                items: [
                    { icon: Inbox, label: 'All Mail', id: 'all' },
                    { icon: Mail, label: 'Unread', id: 'unread' },
                    { icon: Star, label: 'Starred', id: 'starred' },
                    { icon: Send, label: 'Sent', id: 'sent' },
                    { icon: Archive, label: 'Archive', id: 'archive' },
                ],
            },
            {
                title: 'Labels',
                items: [
                    { icon: Folder, label: 'Important', id: 'important' },
                    { icon: Folder, label: 'Follow Up', id: 'follow-up' },
                ],
            },
        ],
    },
    discovery: {
        title: 'Lead Discovery',
        sections: [
            {
                title: 'Search',
                items: [
                    { icon: Globe, label: 'Find Leads', id: 'find' },
                    { icon: Filter, label: 'Advanced Filters', id: 'filters' },
                ],
            },
            {
                title: 'Saved Searches',
                items: [
                    { icon: Star, label: 'Tech Startups', id: 'tech' },
                    { icon: Star, label: 'SaaS Companies', id: 'saas' },
                    { icon: Star, label: 'E-commerce', id: 'ecommerce' },
                ],
            },
        ],
    },
    'lead-lists': {
        title: 'Lead Lists',
        sections: [
            {
                title: 'Quick Actions',
                items: [
                    { icon: Plus, label: 'New List', id: 'new-list' },
                    { icon: Zap, label: 'Import CSV', id: 'import' },
                ],
            },
            {
                title: 'My Lists',
                items: [
                    { icon: Users, label: 'All Leads', id: 'all' },
                    { icon: Users, label: 'Hot Leads', id: 'hot' },
                    { icon: Users, label: 'Nurturing', id: 'nurturing' },
                ],
            },
        ],
    },
    accounts: {
        title: 'Email Accounts',
        sections: [
            {
                title: 'Quick Actions',
                items: [
                    { icon: Plus, label: 'Add Account', id: 'add' },
                ],
            },
            {
                title: 'Connected',
                items: [
                    { icon: Mail, label: 'Gmail Accounts', id: 'gmail' },
                    { icon: Mail, label: 'Outlook', id: 'outlook' },
                    { icon: Mail, label: 'Custom SMTP', id: 'smtp' },
                ],
            },
            {
                title: 'Health',
                items: [
                    { icon: Activity, label: 'Deliverability', id: 'health' },
                    { icon: BarChart2, label: 'Warmup Status', id: 'warmup' },
                ],
            },
        ],
    },
    settings: {
        title: 'Settings',
        sections: [
            {
                title: 'Account',
                items: [
                    { icon: User, label: 'Profile', id: 'profile' },
                    { icon: Bell, label: 'Notifications', id: 'notifications' },
                ],
            },
            {
                title: 'Workspace',
                items: [
                    { icon: Settings, label: 'Preferences', id: 'preferences' },
                    { icon: Server, label: 'Integrations', id: 'integrations' },
                ],
            },
        ],
    },
};

// Helper to enrich sidebar content with dynamic counts
const enrichSidebarContent = (activeSection: string, counts: InboxCounts) => {
    // Get base content
    const baseContent = SIDEBAR_CONTENT[activeSection] || SIDEBAR_CONTENT.campaigns;

    // Safe shallow copy to preserve icon function references
    const content = {
        ...baseContent,
        sections: baseContent.sections.map((s: any) => ({
            ...s,
            items: s.items.map((i: any) => ({ ...i }))
        }))
    };

    // Only enrich if we have counts and are in a relevant section
    if (activeSection === 'inbox' || activeSection === 'campaigns' || activeSection === 'lead-lists') {
        content.sections.forEach((section: any) => {
            section.items.forEach((item: any) => {
                // Map inbox counts
                if (activeSection === 'inbox') {
                    if (item.id === 'all' && counts.all > 0) item.badge = counts.all;
                    if (item.id === 'unread' && counts.unread > 0) item.badge = counts.unread;
                    if (item.id === 'starred' && counts.starred > 0) item.badge = counts.starred;
                    if (item.id === 'sent' && counts.sent > 0) item.badge = counts.sent;
                    if (item.id === 'drafts' && counts.drafts > 0) item.badge = counts.drafts;
                    if (item.id === 'spam' && counts.spam > 0) item.badge = counts.spam;
                    if (item.id === 'trash' && counts.trash > 0) item.badge = counts.trash;
                }

                // Add logic for other sections if backend provides those counts
                // For now, only inbox counters are implemented in the new endpoint
            });
        });
    }

    return content;
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

// Logo
// Logo
function WarmloLogo() {
    return (
        <img src="/logo.png" alt="Warmlo" className="w-8 h-8 rounded-lg object-contain" />
    );
}

// Icon Navigation Rail
function IconNavRail({
    activeSection,
    onSectionChange,
    isDark,
}: {
    activeSection: string;
    onSectionChange: (section: string) => void;
    isDark: boolean;
}) {
    return (
        <aside className={cn(
            "w-16 flex-shrink-0 flex flex-col items-center py-4 gap-2 border-r",
            isDark ? 'bg-[#0a0a0a] border-neutral-800' : 'bg-white border-gray-200'
        )}>
            {/* Logo - Removed as it's in the Header */}
            {/* <div className="mb-4">
                <WarmloLogo />
            </div> */}
            <div className="mt-4" />

            {/* Nav Items */}
            <div className="flex flex-col gap-1 w-full px-2">
                {NAV_ITEMS.map((item) => {
                    const isActive = activeSection === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onSectionChange(item.id)}
                            title={item.label}
                            className={cn(
                                "w-12 h-10 mx-auto rounded-lg flex items-center justify-center transition-all duration-200",
                                isActive
                                    ? isDark ? 'bg-neutral-800 text-white' : 'bg-gray-100 text-gray-900'
                                    : isDark ? 'text-neutral-500 hover:text-white hover:bg-neutral-800/50' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
                            )}
                        >
                            <item.icon className="w-5 h-5" />
                        </button>
                    );
                })}
            </div>

            <div className="flex-1" />

            {/* Bottom */}
            <div className="flex flex-col gap-1 w-full px-2">
                <button
                    onClick={() => onSectionChange('settings')}
                    title="Settings"
                    className={cn(
                        "w-12 h-10 mx-auto rounded-lg flex items-center justify-center transition-all duration-200",
                        activeSection === 'settings'
                            ? isDark ? 'bg-neutral-800 text-white' : 'bg-gray-100 text-gray-900'
                            : isDark ? 'text-neutral-500 hover:text-white hover:bg-neutral-800/50' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
                    )}
                >
                    <Settings className="w-5 h-5" />
                </button>
            </div>
        </aside>
    );
}

// Detail Sidebar
function DetailSidebar({
    activeSection,
    activeSubItem,
    isCollapsed,
    onToggleCollapse,
    isDark,
    onItemClick,
    inboxCounts = { all: 0, unread: 0, starred: 0, sent: 0, drafts: 0, trash: 0, archive: 0, spam: 0 },
}: {
    activeSection: string;
    activeSubItem: string;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    isDark: boolean;
    onItemClick?: (sectionId: string, itemId: string) => void;
    inboxCounts?: InboxCounts;
}) {
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
    const content = enrichSidebarContent(activeSection, inboxCounts);

    const toggleExpanded = (key: string) => {
        setExpandedItems(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    if (isCollapsed) {
        // Get all unique icons from sections
        const allItems = content.sections.flatMap((s: any) => s.items);

        return (
            <aside className={cn(
                "w-14 flex-shrink-0 flex flex-col items-center py-3 border-r transition-all duration-300",
                isDark ? 'bg-[#0c0c0c] border-neutral-800' : 'bg-gray-50 border-gray-200'
            )}>
                {/* Expand button */}
                <button
                    onClick={onToggleCollapse}
                    title="Expand sidebar"
                    className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center transition-colors mb-2",
                        isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
                    )}
                >
                    <ChevronDown className="w-4 h-4 -rotate-90" />
                </button>

                {/* Icon-only items */}
                <div className="flex flex-col gap-1 w-full px-1">
                    {allItems.slice(0, 8).map((item: any, idx: number) => {
                        const ItemIcon = item.icon;
                        return (
                            <button
                                key={idx}
                                onClick={() => onItemClick?.(activeSection, item.id || item.label)}
                                title={item.label}
                                className={cn(
                                    "w-10 h-10 mx-auto rounded-lg flex items-center justify-center transition-colors relative",
                                    isDark
                                        ? 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                                        : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
                                )}
                            >
                                <ItemIcon className="w-4 h-4" />
                                {item.badge !== undefined && (
                                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-orange-500 text-[9px] font-bold text-white flex items-center justify-center">
                                        {typeof item.badge === 'number' && item.badge > 9 ? '9+' : item.badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </aside>
        );
    }

    return (
        <aside className={cn(
            "w-64 flex-shrink-0 flex flex-col border-r transition-all duration-300",
            isDark ? 'bg-[#0c0c0c] border-neutral-800' : 'bg-gray-50 border-gray-200'
        )}>
            {/* Header */}
            <div className="h-14 flex items-center justify-between px-4 border-b border-neutral-800/50">
                <h2 className={cn("text-[15px] font-semibold", isDark ? 'text-white' : 'text-gray-900')}>
                    {content.title}
                </h2>
                <button
                    onClick={onToggleCollapse}
                    className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                        isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
                    )}
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
            </div>

            {/* Search */}
            <div className="p-3">
                <div className={cn(
                    "flex items-center gap-2 h-9 px-3 rounded-lg",
                    isDark ? 'bg-neutral-900' : 'bg-white border border-gray-200'
                )}>
                    <Search className={cn("w-4 h-4", isDark ? 'text-neutral-500' : 'text-gray-400')} />
                    <input
                        type="text"
                        placeholder="Search..."
                        className={cn(
                            "flex-1 bg-transparent border-0 outline-none text-[13px]",
                            isDark ? 'text-white placeholder:text-neutral-500' : 'text-gray-900 placeholder:text-gray-400'
                        )}
                    />
                </div>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1">
                <div className="px-2 pb-4">
                    {content.sections.map((section: any, sIdx: number) => (
                        <div key={sIdx} className="mb-4">
                            <div className={cn(
                                "px-3 py-2 text-[11px] font-semibold uppercase tracking-wider",
                                isDark ? 'text-neutral-500' : 'text-gray-400'
                            )}>
                                {section.title}
                            </div>
                            <div className="space-y-0.5">
                                {section.items.map((item: any, iIdx: number) => {
                                    const itemKey = `${sIdx}-${iIdx}`;
                                    const isExpanded = expandedItems.has(itemKey);
                                    const ItemIcon = item.icon;
                                    const itemId = item.id || item.label;
                                    const isActive = activeSubItem === itemId;

                                    return (
                                        <div key={iIdx}>
                                            <button
                                                onClick={() => {
                                                    if (item.children) toggleExpanded(itemKey);
                                                    else onItemClick?.(activeSection, itemId);
                                                }}
                                                className={cn(
                                                    "w-full flex items-center gap-3 px-3 h-9 rounded-lg text-left transition-colors",
                                                    isActive
                                                        ? isDark ? 'bg-neutral-800 text-white' : 'bg-gray-200 text-gray-900'
                                                        : isDark
                                                            ? 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                                                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                                )}
                                            >
                                                <ItemIcon className={cn("w-4 h-4 shrink-0", isActive && 'text-orange-500')} />
                                                <span className="flex-1 text-[13px] truncate">{item.label}</span>
                                                {item.badge !== undefined && (
                                                    <span className={cn(
                                                        "text-[11px] px-1.5 py-0.5 rounded",
                                                        isDark ? 'bg-neutral-800 text-neutral-400' : 'bg-gray-200 text-gray-500'
                                                    )}>
                                                        {item.badge}
                                                    </span>
                                                )}
                                                {item.children && (
                                                    <ChevronDown className={cn(
                                                        "w-4 h-4 transition-transform",
                                                        isExpanded && 'rotate-180'
                                                    )} />
                                                )}
                                            </button>
                                            {isExpanded && item.children && (
                                                <div className="ml-6 pl-3 border-l border-neutral-800 mt-1 mb-2 space-y-0.5">
                                                    {item.children.map((child: any, cIdx: number) => {
                                                        const childId = child.id || child.label;
                                                        const isChildActive = activeSubItem === childId;
                                                        return (
                                                            <button
                                                                key={cIdx}
                                                                onClick={() => onItemClick?.(activeSection, childId)}
                                                                className={cn(
                                                                    "w-full text-left px-3 py-1.5 rounded-lg text-[12px] transition-colors",
                                                                    isChildActive
                                                                        ? isDark ? 'bg-neutral-800 text-white' : 'bg-gray-200 text-gray-900'
                                                                        : isDark
                                                                            ? 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                                                                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                                                                )}
                                                            >
                                                                {child.label}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </aside>
    );
}

// Header
function Header({ isDark, onLogout }: { isDark: boolean; onLogout: () => void }) {
    const [searchFocused, setSearchFocused] = useState(false);

    return (
        <header className={cn(
            "h-14 flex items-center justify-between px-4 border-b",
            isDark ? 'bg-[#0a0a0a] border-neutral-800' : 'bg-white border-gray-200'
        )}>
            {/* Left */}
            <div className="flex items-center gap-3">
                <img src="/logo.png" alt="Warmlo" className="w-6 h-6 rounded-md" />
                <span className={cn("text-[15px] font-bold font-heading tracking-tight", isDark ? 'text-white' : 'text-gray-900')}>
                    WARMLO
                </span>
            </div>

            {/* Center: Search */}
            <div className="flex-1 max-w-md mx-8">
                <div className={cn(
                    "flex items-center gap-2 h-9 px-3 rounded-lg transition-all duration-200",
                    searchFocused
                        ? isDark ? 'bg-neutral-800 ring-1 ring-neutral-700' : 'bg-white ring-1 ring-gray-300 shadow-sm'
                        : isDark ? 'bg-neutral-900' : 'bg-gray-100'
                )}>
                    <Search className={cn("w-4 h-4", isDark ? 'text-neutral-500' : 'text-gray-400')} />
                    <input
                        type="text"
                        placeholder="Search campaigns, leads, emails..."
                        className={cn(
                            "flex-1 bg-transparent border-0 outline-none text-[13px]",
                            isDark ? 'text-white placeholder:text-neutral-500' : 'text-gray-900 placeholder:text-gray-400'
                        )}
                        onFocus={() => setSearchFocused(true)}
                        onBlur={() => setSearchFocused(false)}
                    />
                    <kbd className={cn(
                        "text-[10px] font-medium px-1.5 py-0.5 rounded",
                        isDark ? 'bg-neutral-800 text-neutral-500' : 'bg-gray-200 text-gray-500'
                    )}>
                        ⌘K
                    </kbd>
                </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-2">

                <button className={cn(
                    "relative p-2 rounded-lg transition-colors",
                    isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                )}>
                    <Bell className="w-[18px] h-[18px]" />
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-orange-500" />
                </button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="focus:outline-none">
                            <Avatar className={cn(
                                "w-8 h-8 ring-2 transition-all",
                                isDark ? 'ring-neutral-800 hover:ring-neutral-700' : 'ring-gray-200 hover:ring-gray-300'
                            )}>
                                <AvatarFallback className="bg-gradient-to-br from-orange-500 to-pink-500 text-white text-xs font-semibold">
                                    U
                                </AvatarFallback>
                            </Avatar>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        className={cn(
                            "w-56 rounded-xl shadow-xl p-1 border mt-1",
                            isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'
                        )}
                    >
                        <div className={cn("px-3 py-2.5 border-b mb-1", isDark ? 'border-neutral-800' : 'border-gray-100')}>
                            <p className={cn("text-[13px] font-medium", isDark ? 'text-white' : 'text-gray-900')}>User Account</p>
                            <p className={cn("text-[11px] mt-0.5", isDark ? 'text-neutral-500' : 'text-gray-400')}>user@example.com</p>
                        </div>
                        <DropdownMenuItem className={cn(
                            "px-3 py-2 rounded-lg cursor-pointer text-[13px]",
                            isDark ? 'text-neutral-300 hover:bg-neutral-800' : 'text-gray-700 hover:bg-gray-50'
                        )}>
                            <User className="w-4 h-4 mr-2 opacity-50" />
                            Account Settings
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className={isDark ? 'bg-neutral-800' : 'bg-gray-100'} />
                        <DropdownMenuItem
                            onClick={onLogout}
                            className={cn(
                                "px-3 py-2 rounded-lg cursor-pointer text-[13px]",
                                isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50'
                            )}
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Sign out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD SHELL
// ═══════════════════════════════════════════════════════════════════════════

export default function DashboardShell() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [activeSection, setActiveSection] = useState('campaigns');
    const [activeSubItem, setActiveSubItem] = useState('');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const navigateToSettingsRef = useRef<() => void>(() => { });
    const navigate = useNavigate();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const setNavigateToSettings = useCallback((fn: () => void) => {
        navigateToSettingsRef.current = fn;
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('bulkEmailToken');
        window.location.href = '/';
    };

    const [inboxCounts, setInboxCounts] = useState<InboxCounts>({
        all: 0, unread: 0, starred: 0, sent: 0, drafts: 0, trash: 0, archive: 0, spam: 0
    });
    const [inboxFilterAccountIds, setInboxFilterAccountIds] = useState<string[]>([]);
    const [inboxFilterCampaignId, setInboxFilterCampaignId] = useState<string | null>(null);
    const [inboxViewMode, setInboxViewMode] = useState<'selection' | 'inbox'>('selection');

    useEffect(() => {
        // If we have active filters, ensure we are in inbox mode
        if (inboxFilterCampaignId || inboxFilterAccountIds.length > 0) {
            setInboxViewMode('inbox');
        }
    }, [inboxFilterCampaignId, inboxFilterAccountIds]);

    useEffect(() => {
        const fetchCounts = async () => {
            try {
                const token = localStorage.getItem('bulkEmailToken');
                if (!token) return;
                const res = await fetch('/api/inbox/counters', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setInboxCounts(prev => ({ ...prev, ...data }));
                }
            } catch (err) {
                console.error('Failed to fetch inbox counts', err);
            }
        };

        fetchCounts();
        // Poll every minute
        const interval = setInterval(fetchCounts, 60000);
        return () => clearInterval(interval);
    }, []);

    const handleItemClick = (section: string, itemId: string) => {
        console.log('Item clicked:', section, itemId);
        setActiveSubItem(itemId);
    };

    return (
        <DashboardContext.Provider value={{
            sidebarCollapsed,
            setSidebarCollapsed,
            activeSection,
            setActiveSection,
            activeSubItem,
            setActiveSubItem,
            navigateToSettings: () => navigateToSettingsRef.current(),
            setNavigateToSettings,
            inboxFilterAccountIds,
            setInboxFilterAccountIds,
            inboxFilterCampaignId,
            setInboxFilterCampaignId,
            inboxViewMode,
            setInboxViewMode
        }}>
            <div className={cn("h-screen flex flex-col overflow-hidden", isDark ? 'bg-[#0a0a0a]' : 'bg-gray-50')}>
                <Toaster
                    position="bottom-right"
                    theme={isDark ? 'dark' : 'light'}
                    toastOptions={{
                        style: {
                            background: isDark ? '#171717' : '#ffffff',
                            color: isDark ? '#ffffff' : '#111827',
                            border: isDark ? '1px solid #262626' : '1px solid #e5e7eb',
                            borderRadius: '10px',
                            fontSize: '13px',
                        },
                    }}
                />

                {/* Header */}
                <Header isDark={isDark} onLogout={handleLogout} />

                {/* Main Layout - Takes remaining height */}
                <div className="flex-1 flex overflow-hidden min-h-0">
                    {/* Icon Navigation Rail */}
                    <IconNavRail
                        activeSection={activeSection}
                        onSectionChange={setActiveSection}
                        isDark={isDark}
                    />

                    {/* Detail Sidebar - Only show for sections that need it */}
                    {((activeSection === 'inbox' && inboxViewMode === 'inbox') || activeSection === 'settings') && (
                        <DetailSidebar
                            activeSection={activeSection}
                            activeSubItem={activeSubItem}
                            isCollapsed={sidebarCollapsed}
                            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                            isDark={isDark}
                            onItemClick={handleItemClick}
                            inboxCounts={inboxCounts}
                        />
                    )}

                    {/* Main Content */}
                    <main className={cn("flex-1 overflow-hidden", isDark ? 'bg-[#0f0f0f]' : 'bg-white')}>
                        <UnifiedDashboard />
                    </main>
                </div>
            </div>
        </DashboardContext.Provider>
    );
}
