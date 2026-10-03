import { NavLink, useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    Map,
    PlusCircle,
    FileText,
    LogOut,
    UserCircle,
    X,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

function TravelBudgetLogo() {
    return (
        <svg
            className="app-logo"
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

function Sidebar({ mobileOpen, onClose }) {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    async function handleLogout() {
        await logout();
        navigate("/login");
    }

    return (
        <>
            {mobileOpen && (
                <button
                    className="sidebar-overlay"
                    onClick={onClose}
                    aria-label="Close navigation"
                />
            )}

            <aside
                className={`app-sidebar ${
                    mobileOpen ? "app-sidebar-open" : ""
                }`}
            >
                <div className="sidebar-top">
                    <div className="sidebar-brand">
                        <TravelBudgetLogo />

                        <div className="sidebar-brand-text">
                            <span>Travel</span>
                            <strong>Budget Pro</strong>
                        </div>

                        <button
                            className="mobile-close-button"
                            onClick={onClose}
                            aria-label="Close navigation"
                            type="button"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="sidebar-divider" />

                    <nav className="sidebar-navigation">

                        <NavLink
                            to="/dashboard"
                            onClick={onClose}
                            className={({ isActive }) =>
                                `sidebar-nav-item ${
                                    isActive ? "active" : ""
                                }`
                            }
                        >
                            <LayoutDashboard size={19} />
                            <span>Dashboard</span>
                        </NavLink>

                        <NavLink
                            to="/my-trips"
                            onClick={onClose}
                            className={({ isActive }) =>
                                `sidebar-nav-item ${
                                    isActive ? "active" : ""
                                }`
                            }
                        >
                            <Map size={19} />
                            <span>My Trips</span>
                        </NavLink>

                        <NavLink
                            to="/create-trip"
                            onClick={onClose}
                            className={({ isActive }) =>
                                `sidebar-nav-item ${
                                    isActive ? "active" : ""
                                }`
                            }
                        >
                            <PlusCircle size={19} />
                            <span>Plan Trip</span>
                        </NavLink>

                        <NavLink
                            to="/trip-reports"
                            onClick={onClose}
                            className={({ isActive }) =>
                                `sidebar-nav-item ${
                                    isActive ? "active" : ""
                                }`
                            }
                        >
                            <FileText size={19} />
                            <span>Trip Reports</span>
                        </NavLink>

                    </nav>
                </div>

                <div className="sidebar-bottom">
                    <div className="sidebar-divider" />

                    <div className="sidebar-user">
                        <div className="sidebar-user-icon">
                            <UserCircle size={22} />
                        </div>

                        <div className="sidebar-user-details">
                            <strong>{user?.full_name || "User"}</strong>
                            <span>{user?.email || ""}</span>
                        </div>
                    </div>

                    <button
                        className="sidebar-logout"
                        onClick={handleLogout}
                        type="button"
                    >
                        <LogOut size={18} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
}

export default Sidebar;