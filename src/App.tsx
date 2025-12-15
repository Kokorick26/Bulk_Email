import { useState, useEffect } from 'react';
import { Toaster } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import BulkEmailManager from './components/BulkEmailManager';
import Login from './components/Login';
import { Mail, LogOut, Menu, X, LayoutDashboard, Send, Settings, History, Sparkles } from 'lucide-react';
import { cn } from './lib/utils';

type PageType = 'dashboard' | 'compose' | 'accounts' | 'history' | 'templates';

interface NavItem {
    id: PageType;
    label: string;
    icon: typeof Mail;
}

const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'compose', label: 'Compose', icon: Send },
    { id: 'accounts', label: 'Accounts', icon: Settings },
    { id: 'history', label: 'History', icon: History },
    { id: 'templates', label: 'Templates', icon: Sparkles },
];

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('bulkEmailToken');
        if (token) {
            setIsAuthenticated(true);
        }
        setLoading(false);
    }, []);

    const handleLogin = (token: string) => {
        localStorage.setItem('bulkEmailToken', token);
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        localStorage.removeItem('bulkEmailToken');
        setIsAuthenticated(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-10 h-10 rounded-lg bg-white flex items-center justify-center"
                >
                    <Mail className="w-5 h-5 text-black" />
                </motion.div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <>
                <Toaster position="top-right" theme="dark" toastOptions={{
                    style: { background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)', color: 'white' }
                }} />
                <Login onLogin={handleLogin} />
            </>
        );
    }

    return (
        <>
            <Toaster position="top-right" theme="dark" toastOptions={{
                style: { background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)', color: 'white' }
            }} />

            <div className="min-h-screen bg-black">
                {/* Header */}
                <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-black/80 backdrop-blur-xl border-b border-white/[0.05]">
                    <div className="h-full max-w-7xl mx-auto px-4 flex items-center justify-between">
                        {/* Logo */}
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center">
                                <Mail className="w-4.5 h-4.5 text-black" />
                            </div>
                            <span className="text-lg font-semibold text-white tracking-tight hidden sm:block">Bulk Email</span>
                        </div>

                        {/* Desktop Nav */}
                        <nav className="hidden md:flex items-center gap-1">
                            {navItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setCurrentPage(item.id)}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                        currentPage === item.id
                                            ? "bg-white text-black"
                                            : "text-white/50 hover:text-white hover:bg-white/[0.05]"
                                    )}
                                >
                                    <item.icon className="w-4 h-4" />
                                    {item.label}
                                </button>
                            ))}
                        </nav>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleLogout}
                                className="hidden md:flex items-center gap-2 px-3 py-2 text-sm text-white/50 hover:text-white hover:bg-white/[0.05] rounded-lg transition-all"
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </button>

                            {/* Mobile menu button */}
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="md:hidden p-2 text-white/50 hover:text-white"
                            >
                                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    {/* Mobile Menu */}
                    <AnimatePresence>
                        {mobileMenuOpen && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="md:hidden bg-black/95 backdrop-blur-xl border-b border-white/[0.05]"
                            >
                                <nav className="p-4 space-y-1">
                                    {navItems.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => {
                                                setCurrentPage(item.id);
                                                setMobileMenuOpen(false);
                                            }}
                                            className={cn(
                                                "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all",
                                                currentPage === item.id
                                                    ? "bg-white text-black"
                                                    : "text-white/50 hover:text-white hover:bg-white/[0.05]"
                                            )}
                                        >
                                            <item.icon className="w-5 h-5" />
                                            {item.label}
                                        </button>
                                    ))}
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-white/50 hover:text-red-400 hover:bg-red-400/10 transition-all"
                                    >
                                        <LogOut className="w-5 h-5" />
                                        Logout
                                    </button>
                                </nav>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </header>

                {/* Main Content */}
                <main className="pt-16 min-h-screen">
                    <div className="max-w-7xl mx-auto px-4 py-8">
                        <motion.div
                            key={currentPage}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <BulkEmailManager currentPage={currentPage} setCurrentPage={setCurrentPage} />
                        </motion.div>
                    </div>
                </main>
            </div>
        </>
    );
}

export default App;
