import { Outlet } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

export default function MarketingLayout() {
    return (
        <div className="min-h-screen bg-brand-dark text-white antialiased selection:bg-brand-pink selection:text-white font-body">
            <Navbar />
            <main>
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}
