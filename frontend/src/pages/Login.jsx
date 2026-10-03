import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function TravelBudgetLogo() {
    return (
        <svg
            className="travel-logo"
            viewBox="0 0 64 64"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Travel Budget Pro logo"
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

function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();

        setError("");
        setLoading(true);

        try {
            await login(email, password);

            // TEMPORARY: session testing
            navigate("/dashboard");

        } catch (err) {
            console.error("Login Error:", err);

            setError(
                err.response?.data?.message ||
                "Invalid email or password."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="login-page">

            <div
                className="login-background"
                aria-hidden="true"
            />

            <div className="login-wrapper">

                <section className="login-brand-section">
                    <div className="brand-content">

                        <div className="logo-container">
                            <TravelBudgetLogo />
                        </div>

                        <h1 className="brand-name">
                            Travel Budget <span>Pro</span>
                        </h1>

                        <p className="brand-tagline">
                            Plan trips without financial surprises.
                        </p>

                    </div>
                </section>

                <section className="login-form-section">

                    <div className="login-content">

                        <p className="login-eyebrow">
                            TRAVEL BUDGET PRO
                        </p>

                        <h2 className="login-heading">
                            Welcome back
                        </h2>

                        <p className="login-description">
                            Pick up where you left off and keep your next
                            trip in view.
                        </p>

                        <form
                            className="login-form"
                            onSubmit={handleSubmit}
                        >

                            {error && (
                                <div
                                    className="login-error"
                                    role="alert"
                                >
                                    {error}
                                </div>
                            )}

                            <div className="form-field">

                                <label htmlFor="email">
                                    Email
                                </label>

                                <div className="input-wrapper">

                                    <svg
                                        className="input-icon"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                        aria-hidden="true"
                                    >
                                        <rect
                                            x="3"
                                            y="5"
                                            width="18"
                                            height="14"
                                            rx="2"
                                        />

                                        <path d="M3 7L12 13L21 7" />
                                    </svg>

                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={email}
                                        onChange={(event) =>
                                            setEmail(event.target.value)
                                        }
                                        placeholder="you@example.com"
                                        autoComplete="email"
                                        required
                                    />

                                </div>
                            </div>

                            <div className="form-field">

                                <label htmlFor="password">
                                    Password
                                </label>

                                <div className="input-wrapper">

                                    <svg
                                        className="input-icon"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                        aria-hidden="true"
                                    >
                                        <rect
                                            x="5"
                                            y="10"
                                            width="14"
                                            height="10"
                                            rx="2"
                                        />

                                        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                                    </svg>

                                    <input
                                        id="password"
                                        name="password"
                                        type={
                                            showPassword
                                                ? "text"
                                                : "password"
                                        }
                                        value={password}
                                        onChange={(event) =>
                                            setPassword(event.target.value)
                                        }
                                        placeholder="Your password"
                                        autoComplete="current-password"
                                        required
                                    />

                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() =>
                                            setShowPassword(
                                                !showPassword
                                            )
                                        }
                                        aria-label={
                                            showPassword
                                                ? "Hide password"
                                                : "Show password"
                                        }
                                    >
                                        {showPassword
                                            ? "Hide"
                                            : "Show"}
                                    </button>

                                </div>
                            </div>

                            <button
                                type="submit"
                                className="login-submit"
                                disabled={loading}
                            >
                                {loading
                                    ? "Logging in..."
                                    : "Log in"}

                                {!loading && (
                                    <span className="button-arrow">
                                        →
                                    </span>
                                )}
                            </button>

                            <p className="register-prompt">
                                New here?{" "}

                                <Link to="/register">
                                    Create an account
                                </Link>
                            </p>

                        </form>

                    </div>

                </section>

            </div>

        </main>
    );
}

export default Login;