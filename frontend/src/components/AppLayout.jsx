import { useState } from "react";
import { Menu } from "lucide-react";

import Sidebar from "./Sidebar";

function TravelBudgetLogo() {
    return (
        <svg
            className="mobile-app-logo"
            viewBox="0 0 64 64"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Travel Budget Pro logo"
            role="img"
        >
            <rect
                x="3"
                y="3"
                width="58"
                height="58"
                rx="18"
                fill="#2F6B5F"
            />

            <path
                d="M16 45 C22 39 21 30 29 27 C36 24 39 18 47 17"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="1 6"
            />

            <path
                d="M43 13 C37.5 13 33 17.3 33 22.6 C33 30 43 38 43 38 C43 38 53 30 53 22.6 C53 17.3 48.5 13 43 13Z"
                fill="#D99A32"
            />

            <circle
                cx="43"
                cy="22"
                r="3.5"
                fill="#FFFFFF"
            />

            <path
                d="M13 47 L24 47"
                stroke="#D99A32"
                strokeWidth="4"
                strokeLinecap="round"
            />

            <path
                d="M13 53 L20 53"
                stroke="#FFFFFF"
                strokeWidth="3"
                strokeLinecap="round"
            />
        </svg>
    );
}

function AppLayout({ children }) {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="app-shell">
            <Sidebar
                mobileOpen={mobileOpen}
                onClose={() => setMobileOpen(false)}
            />

            <div className="app-main-wrapper">
                <header className="mobile-header">
                    <TravelBudgetLogo />

                    <button
                        className="mobile-menu-button"
                        onClick={() => setMobileOpen(true)}
                        aria-label="Open navigation"
                        type="button"
                    >
                        <Menu size={23} />
                    </button>
                </header>

                <main className="app-main">
                    {children}
                </main>
            </div>
        </div>
    );
}

export default AppLayout;