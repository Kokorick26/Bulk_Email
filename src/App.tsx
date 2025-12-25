import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from './lib/ThemeContext';
import MarketingLayout from './layouts/MarketingLayout';
import Home from './pages/landing/Home';
import Features from './pages/landing/Features';
import Pricing from './pages/landing/Pricing';
import About from './pages/landing/About';
import Contact from './pages/landing/Contact';
import Changelog from './pages/landing/Changelog';
import Login from './components/Login';
import DashboardShell from './layouts/DashboardShell';

// Protected Route Component
const RequireAuth = ({ children }: { children: JSX.Element }) => {
    const token = localStorage.getItem('bulkEmailToken');
    const location = useLocation();

    if (!token) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

// Login Wrapper to handle redirect after login
const LoginRoute = () => {
    const token = localStorage.getItem('bulkEmailToken');
    if (token) {
        return <Navigate to="/dashboard" replace />;
    }

    const handleLogin = (token: string) => {
        localStorage.setItem('bulkEmailToken', token);
        window.location.href = '/dashboard';
    };

    return (
        <>
            <Toaster position="bottom-left" theme="light" toastOptions={{
                style: {
                    background: '#323232',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px'
                }
            }} />
            <Login onLogin={handleLogin} />
        </>
    );
};

function App() {
    return (
        <ThemeProvider>
            <BrowserRouter>
                <Routes>
                    {/* Public Website Routes */}
                    <Route element={<MarketingLayout />}>
                        <Route path="/" element={<Home />} />
                        <Route path="/features" element={<Features />} />
                        <Route path="/pricing" element={<Pricing />} />
                        <Route path="/about" element={<About />} />
                        <Route path="/contact" element={<Contact />} />
                        <Route path="/changelog" element={<Changelog />} />
                    </Route>

                    {/* Auth Routes */}
                    <Route path="/login" element={<LoginRoute />} />
                    <Route path="/signup" element={<LoginRoute />} />

                    {/* Protected Dashboard Routes */}
                    <Route
                        path="/dashboard/*"
                        element={
                            <RequireAuth>
                                <DashboardShell />
                            </RequireAuth>
                        }
                    />

                    {/* Catch all - redirect to home */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </ThemeProvider>
    );
}

export default App;
