import { Outlet } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

export default function MarketingLayout() {
    return (
        <div className="min-h-screen bg-[var(--slate-deep)] text-[var(--text-primary)] antialiased selection:bg-[var(--terracotta)]/20 selection:text-[var(--terracotta)]" style={{ fontFamily: 'DM Sans, sans-serif' }}>
            <Navbar />
            <main>
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}
