import { useState, createContext, useContext, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, LogOut, Menu, X, User, Settings, Search, HelpCircle, Grid3X3, PanelLeftClose, PanelLeft, Sparkles } from 'lucide-react';
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

// Create context for sidebar and navigation
interface DashboardContextType {
    sidebarCollapsed: boolean;
    setSidebarCollapsed: (value: boolean) => void;
    navigateToSettings: () => void;
    setNavigateToSettings: (fn: () => void) => void;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export const useDashboardContext = () => {
    const context = useContext(DashboardContext);
    if (!context) {
        throw new Error('useDashboardContext must be used within DashboardShell');
    }
    return context;
};

export default function DashboardShell() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchFocused, setSearchFocused] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
    const navigateToSettingsRef = useRef<() => void>(() => { });
    const navigate = useNavigate();
    const { theme } = useTheme();

    const setNavigateToSettings = useCallback((fn: () => void) => {
        navigateToSettingsRef.current = fn;
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('bulkEmailToken');
        // Force a full page reload to clear any cached state
        window.location.href = '/';
    };

    const handleSettingsClick = () => {
        navigateToSettingsRef.current();
    };

    return (
        <DashboardContext.Provider value={{
            sidebarCollapsed,
            setSidebarCollapsed,
            navigateToSettings: () => navigateToSettingsRef.current(),
            setNavigateToSettings
        }}>
            <div className={cn(
                "min-h-screen transition-colors",
                theme === 'dark'
                    ? 'bg-[var(--slate-deep)] text-[var(--text-primary)]'
                    : 'bg-gray-50 text-gray-900'
            )} style={{ fontFamily: 'DM Sans, sans-serif' }}>
                <Toaster
                    position="bottom-left"
                    theme={theme === 'dark' ? 'dark' : 'light'}
                    toastOptions={{
                        style: {
                            background: theme === 'dark' ? 'var(--slate-mid)' : '#323232',
                            color: 'white',
                            border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : 'none',
                            borderRadius: '12px',
                            fontFamily: 'DM Sans, sans-serif',
                        },
                    }}
                />

                {/* Premium Header */}
                <header className={cn(
                    "fixed top-0 left-0 right-0 z-50 h-16 border-b transition-all",
                    theme === 'dark'
                        ? 'bg-[var(--slate-rich)]/90 backdrop-blur-xl border-white/5'
                        : 'bg-white/90 backdrop-blur-xl border-gray-200'
                )}>
                    <div className="h-full w-full px-4 flex items-center justify-between gap-4">
                        {/* Left: Logo & Menu */}
                        <div className="flex items-center gap-2 shrink-0">
                            {/* Mobile menu button */}
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className={cn(
                                    "p-2.5 rounded-xl md:hidden transition-colors",
                                    theme === 'dark'
                                        ? 'text-[var(--text-muted)] hover:bg-white/5 hover:text-[var(--text-secondary)]'
                                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                                )}
                            >
                                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>

                            {/* Sidebar collapse toggle */}
                            <button
                                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                                className={cn(
                                    "p-2.5 rounded-xl hidden md:flex transition-colors",
                                    theme === 'dark'
                                        ? 'hover:bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                                        : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                                )}
                                title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                            >
                                {sidebarCollapsed ? (
                                    <PanelLeft className="w-5 h-5" />
                                ) : (
                                    <PanelLeftClose className="w-5 h-5" />
                                )}
                            </button>

                            {/* Logo */}
                            <div
                                className="flex items-center gap-3 cursor-pointer group"
                                onClick={() => navigate('/dashboard')}
                            >
                                <div className="relative">
                                    <div className={cn(
                                        "absolute inset-0 blur-lg opacity-0 group-hover:opacity-40 transition-opacity",
                                        theme === 'dark' ? 'bg-[var(--terracotta)]' : 'bg-blue-500'
                                    )} />
                                    <div className={cn(
                                        "relative w-9 h-9 rounded-xl flex items-center justify-center shadow-lg ring-1 ring-white/10",
                                        theme === 'dark'
                                            ? 'bg-gradient-to-br from-[var(--terracotta)] to-[var(--terracotta-dark)]'
                                            : 'bg-gradient-to-br from-blue-500 to-blue-600'
                                    )}>
                                        <Mail className="w-4 h-4 text-white" />
                                    </div>
                                </div>
                                <span className={cn(
                                    "text-xl font-bold tracking-tight hidden sm:inline",
                                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                                )} style={{ fontFamily: 'Syne, sans-serif' }}>
                                    BulkMail
                                </span>
                            </div>
                        </div>

                        {/* Center: Search Bar */}
                        <div className="flex-1 max-w-[600px] mx-auto hidden md:block">
                            <div className={cn(
                                "flex items-center gap-3 px-4 h-11 rounded-xl transition-all",
                                theme === 'dark'
                                    ? searchFocused
                                        ? 'bg-[var(--slate-deep)] border border-[var(--terracotta)] shadow-lg shadow-[var(--terracotta)]/10'
                                        : 'bg-white/5 border border-white/5 hover:border-white/10'
                                    : searchFocused
                                        ? 'bg-white border border-blue-500 shadow-lg shadow-blue-500/10'
                                        : 'bg-gray-100 border border-gray-200 hover:border-gray-300'
                            )}>
                                <Search className={cn(
                                    "w-4 h-4",
                                    theme === 'dark' ? 'text-[var(--text-muted)]' : 'text-gray-400'
                                )} />
                                <input
                                    type="text"
                                    placeholder="Search mail, campaigns, leads..."
                                    className={cn(
                                        "flex-1 bg-transparent border-0 outline-none text-sm",
                                        theme === 'dark'
                                            ? 'text-white placeholder:text-[var(--text-muted)]'
                                            : 'text-gray-900 placeholder:text-gray-400'
                                    )}
                                    onFocus={() => setSearchFocused(true)}
                                    onBlur={() => setSearchFocused(false)}
                                />
                                <div className={cn(
                                    "text-xs font-mono px-2 py-1 rounded-lg",
                                    theme === 'dark'
                                        ? 'bg-white/5 text-[var(--text-muted)]'
                                        : 'bg-gray-200 text-gray-500'
                                )}>
                                    ⌘K
                                </div>
                            </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                            {/* Help */}
                            <button className={cn(
                                "p-2.5 rounded-xl transition-colors",
                                theme === 'dark'
                                    ? 'hover:bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                                    : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                            )}>
                                <HelpCircle className="w-5 h-5" />
                            </button>

                            {/* Settings */}
                            <button
                                onClick={handleSettingsClick}
                                className={cn(
                                    "p-2.5 rounded-xl transition-colors",
                                    theme === 'dark'
                                        ? 'hover:bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                                        : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                                )}
                            >
                                <Settings className="w-5 h-5" />
                            </button>

                            {/* Apps */}
                            <button className={cn(
                                "p-2.5 rounded-xl transition-colors",
                                theme === 'dark'
                                    ? 'hover:bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                                    : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                            )}>
                                <Grid3X3 className="w-5 h-5" />
                            </button>

                            {/* User Menu */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className={cn(
                                        "ml-2 p-1 rounded-full transition-colors group",
                                        theme === 'dark' ? 'hover:ring-2 ring-white/10' : 'hover:ring-2 ring-gray-200'
                                    )}>
                                        <Avatar className={cn(
                                            "w-9 h-9 border-0 ring-2 transition-all",
                                            theme === 'dark'
                                                ? 'ring-[var(--terracotta)]/30 group-hover:ring-[var(--terracotta)]/50'
                                                : 'ring-blue-500/30 group-hover:ring-blue-500/50'
                                        )}>
                                            <AvatarFallback className={cn(
                                                "text-white text-sm font-semibold",
                                                theme === 'dark'
                                                    ? 'bg-gradient-to-br from-[var(--terracotta)] to-[var(--gold)]'
                                                    : 'bg-gradient-to-br from-blue-500 to-blue-600'
                                            )}>
                                                U
                                            </AvatarFallback>
                                        </Avatar>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    className={cn(
                                        "w-72 rounded-xl shadow-xl p-0 border",
                                        theme === 'dark'
                                            ? 'bg-[var(--slate-mid)] border-white/10'
                                            : 'bg-white border-gray-200'
                                    )}
                                >
                                    <div className={cn(
                                        "p-5 text-center border-b",
                                        theme === 'dark' ? 'border-white/5' : 'border-gray-100'
                                    )}>
                                        <Avatar className={cn(
                                            "w-16 h-16 mx-auto mb-3 border-0 ring-2",
                                            theme === 'dark'
                                                ? 'ring-[var(--terracotta)]/30'
                                                : 'ring-blue-500/30'
                                        )}>
                                            <AvatarFallback className={cn(
                                                "text-white text-2xl font-semibold",
                                                theme === 'dark'
                                                    ? 'bg-gradient-to-br from-[var(--terracotta)] to-[var(--gold)]'
                                                    : 'bg-gradient-to-br from-blue-500 to-blue-600'
                                            )}>
                                                U
                                            </AvatarFallback>
                                        </Avatar>
                                        <p className={cn(
                                            "text-sm font-semibold",
                                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                                        )} style={{ fontFamily: 'Syne, sans-serif' }}>User Account</p>
                                        <p className={cn(
                                            "text-xs",
                                            theme === 'dark' ? 'text-[var(--text-muted)]' : 'text-gray-500'
                                        )}>user@example.com</p>
                                    </div>

                                    <div className="py-2">
                                        <DropdownMenuItem className={cn(
                                            "px-4 py-3 cursor-pointer rounded-lg mx-2",
                                            theme === 'dark'
                                                ? 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-white'
                                                : 'text-gray-700 hover:bg-gray-50'
                                        )}>
                                            <User className={cn(
                                                "w-4 h-4 mr-3",
                                                theme === 'dark' ? 'text-[var(--text-muted)]' : 'text-gray-400'
                                            )} />
                                            Manage your Account
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator className={cn(
                                            "my-2",
                                            theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'
                                        )} />
                                        <DropdownMenuItem
                                            onClick={handleLogout}
                                            className={cn(
                                                "px-4 py-3 cursor-pointer rounded-lg mx-2",
                                                theme === 'dark'
                                                    ? 'text-rose-400 hover:bg-rose-500/10'
                                                    : 'text-red-600 hover:bg-red-50'
                                            )}
                                        >
                                            <LogOut className={cn(
                                                "w-4 h-4 mr-3",
                                                theme === 'dark' ? 'text-rose-400' : 'text-red-500'
                                            )} />
                                            Sign out
                                        </DropdownMenuItem>
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </header>

                {/* Mobile Menu Overlay */}
                {mobileMenuOpen && (
                    <div
                        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        <div
                            className={cn(
                                "absolute left-0 top-16 w-72 h-[calc(100vh-64px)] shadow-xl border-r",
                                theme === 'dark'
                                    ? 'bg-[var(--slate-rich)] border-white/5'
                                    : 'bg-white border-gray-200'
                            )}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Mobile sidebar content will be rendered by UnifiedDashboard */}
                        </div>
                    </div>
                )}

                {/* Main Content */}
                <main className="pt-16 min-h-screen flex flex-col">
                    <UnifiedDashboard />
                </main>
            </div>
        </DashboardContext.Provider>
    );
}
