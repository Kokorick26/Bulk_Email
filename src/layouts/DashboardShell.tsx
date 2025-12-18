import { useState, createContext, useContext, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, LogOut, Menu, X, User, Settings, Search, HelpCircle, Grid3X3, PanelLeftClose, PanelLeft } from 'lucide-react';
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
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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
                "min-h-screen font-sans transition-colors",
                theme === 'dark'
                    ? 'bg-[#202124] text-[#e8eaed]'
                    : 'bg-white text-[#202124]'
            )}>
                <Toaster
                    position="bottom-left"
                    theme={theme === 'dark' ? 'dark' : 'light'}
                    toastOptions={{
                        style: {
                            background: theme === 'dark' ? '#3c4043' : '#323232',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                        },
                    }}
                />

                {/* Gmail-style Header */}
                <header className={cn(
                    "fixed top-0 left-0 right-0 z-50 h-16 border-b transition-colors",
                    theme === 'dark'
                        ? 'bg-[#202124] border-[#3c4043]'
                        : 'bg-white border-[#dadce0]'
                )}>
                    <div className="h-full w-full px-4 flex items-center justify-between gap-4">
                        {/* Left: Logo & Menu */}
                        <div className="flex items-center gap-2 shrink-0">
                            {/* Mobile menu button */}
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className={cn(
                                    "p-2 rounded-full md:hidden",
                                    theme === 'dark'
                                        ? 'text-[#9aa0a6] hover:bg-[#3c4043]'
                                        : 'text-[#5f6368] hover:bg-[#f1f3f4]'
                                )}
                            >
                                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>

                            {/* Sidebar collapse toggle */}
                            <button
                                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                                className={cn(
                                    "p-3 rounded-full hidden md:flex",
                                    theme === 'dark'
                                        ? 'hover:bg-[#3c4043]'
                                        : 'hover:bg-[#f1f3f4]'
                                )}
                                title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                            >
                                {sidebarCollapsed ? (
                                    <PanelLeft className={cn("w-5 h-5", theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]')} />
                                ) : (
                                    <PanelLeftClose className={cn("w-5 h-5", theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]')} />
                                )}
                            </button>

                            {/* Logo */}
                            <div
                                className="flex items-center gap-2 cursor-pointer"
                                onClick={() => navigate('/dashboard')}
                            >
                                <Mail className="w-8 h-8 text-[#c5221f]" />
                                {!sidebarCollapsed && (
                                    <span className={cn(
                                        "text-[22px] font-normal tracking-tight hidden sm:inline",
                                        theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                                    )}>
                                        BulkMail
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Center: Search Bar */}
                        <div className="flex-1 max-w-[720px] mx-auto hidden md:block">
                            <div className={cn(
                                "flex items-center gap-3 px-4 h-12 rounded-full transition-all",
                                theme === 'dark'
                                    ? searchFocused
                                        ? 'bg-[#303134] shadow-lg'
                                        : 'bg-[#303134]'
                                    : searchFocused
                                        ? 'bg-white shadow-lg'
                                        : 'bg-[#f1f3f4]'
                            )}>
                                <Search className={cn("w-5 h-5", theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]')} />
                                <input
                                    type="text"
                                    placeholder="Search mail"
                                    className={cn(
                                        "flex-1 bg-transparent border-0 outline-none text-[15px]",
                                        theme === 'dark'
                                            ? 'text-[#e8eaed] placeholder:text-[#9aa0a6]'
                                            : 'text-[#202124] placeholder:text-[#5f6368]'
                                    )}
                                    onFocus={() => setSearchFocused(true)}
                                    onBlur={() => setSearchFocused(false)}
                                />
                            </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                            {/* Help */}
                            <button className={cn(
                                "p-3 rounded-full",
                                theme === 'dark' ? 'hover:bg-[#3c4043]' : 'hover:bg-[#f1f3f4]'
                            )}>
                                <HelpCircle className={cn("w-5 h-5", theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]')} />
                            </button>

                            {/* Settings */}
                            <button
                                onClick={handleSettingsClick}
                                className={cn(
                                    "p-3 rounded-full",
                                    theme === 'dark' ? 'hover:bg-[#3c4043]' : 'hover:bg-[#f1f3f4]'
                                )}
                            >
                                <Settings className={cn("w-5 h-5", theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]')} />
                            </button>

                            {/* Google Apps */}
                            <button className={cn(
                                "p-3 rounded-full",
                                theme === 'dark' ? 'hover:bg-[#3c4043]' : 'hover:bg-[#f1f3f4]'
                            )}>
                                <Grid3X3 className={cn("w-5 h-5", theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]')} />
                            </button>

                            {/* User Menu */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className={cn(
                                        "ml-2 p-1 rounded-full transition-colors",
                                        theme === 'dark' ? 'hover:bg-[#3c4043]' : 'hover:bg-[#f1f3f4]'
                                    )}>
                                        <Avatar className="w-8 h-8 border-0">
                                            <AvatarFallback className="bg-[#1a73e8] text-white text-sm font-medium">
                                                U
                                            </AvatarFallback>
                                        </Avatar>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    className={cn(
                                        "w-72 rounded-lg shadow-lg p-0",
                                        theme === 'dark'
                                            ? 'bg-[#303134] border-[#3c4043]'
                                            : 'bg-white border-[#dadce0]'
                                    )}
                                >
                                    <div className={cn(
                                        "p-4 text-center border-b",
                                        theme === 'dark' ? 'border-[#3c4043]' : 'border-[#dadce0]'
                                    )}>
                                        <Avatar className="w-16 h-16 mx-auto mb-3 border-0">
                                            <AvatarFallback className="bg-[#1a73e8] text-white text-2xl font-medium">
                                                U
                                            </AvatarFallback>
                                        </Avatar>
                                        <p className={cn(
                                            "text-sm font-medium",
                                            theme === 'dark' ? 'text-[#e8eaed]' : 'text-[#202124]'
                                        )}>User Account</p>
                                        <p className={cn(
                                            "text-xs",
                                            theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                                        )}>user@example.com</p>
                                    </div>

                                    <div className="py-2">
                                        <DropdownMenuItem className={cn(
                                            "px-4 py-3 cursor-pointer",
                                            theme === 'dark'
                                                ? 'text-[#e8eaed] hover:bg-[#3c4043]'
                                                : 'text-[#202124] hover:bg-[#f1f3f4]'
                                        )}>
                                            <User className={cn(
                                                "w-4 h-4 mr-3",
                                                theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
                                            )} />
                                            Manage your Account
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator className={theme === 'dark' ? 'bg-[#3c4043]' : 'bg-[#dadce0]'} />
                                        <DropdownMenuItem
                                            onClick={handleLogout}
                                            className={cn(
                                                "px-4 py-3 cursor-pointer",
                                                theme === 'dark'
                                                    ? 'text-[#e8eaed] hover:bg-[#3c4043]'
                                                    : 'text-[#202124] hover:bg-[#f1f3f4]'
                                            )}
                                        >
                                            <LogOut className={cn(
                                                "w-4 h-4 mr-3",
                                                theme === 'dark' ? 'text-[#9aa0a6]' : 'text-[#5f6368]'
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
                        className="fixed inset-0 z-40 bg-black/20 md:hidden"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        <div
                            className={cn(
                                "absolute left-0 top-16 w-72 h-[calc(100vh-64px)] shadow-lg",
                                theme === 'dark' ? 'bg-[#202124]' : 'bg-white'
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
