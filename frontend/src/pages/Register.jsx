import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/api";


/* =========================================================
   TRAVEL BUDGET PRO LOGO
========================================================= */

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


/* =========================================================
   REGISTER PAGE
========================================================= */

function Register() {

    const navigate = useNavigate();

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);


    /* =====================================================
       REGISTER SUBMIT
    ===================================================== */

    async function handleSubmit(event) {

        event.preventDefault();

        setError("");
        setLoading(true);

        try {

            await api.post("/api/register", {
                full_name: fullName,
                email: email,
                password: password
            });

            navigate("/login");

        } catch (err) {

            console.error("Registration Error:", err);

            setError(
                err.response?.data?.message ||
                "Registration failed. Please try again."
            );

        } finally {

            setLoading(false);

        }
    }


    return (
        <main className="login-page register-page">

            {/* Background */}

            <div
                className="login-background"
                aria-hidden="true"
            />


            {/* Main layout */}

            <div className="login-wrapper">


                {/* =================================================
                   BRAND SECTION
                ================================================= */}

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


                {/* =================================================
                   REGISTER SECTION
                ================================================= */}

                <section className="login-form-section">

                    <div className="login-content">

                        <p className="login-eyebrow">
                            TRAVEL BUDGET PRO
                        </p>

                        <h2 className="login-heading">
                            Start with a plan
                        </h2>

                        <p className="login-description">
                            Create your account and start planning
                            your trips with confidence.
                        </p>


                        {/* Register form */}

                        <form
                            className="login-form"
                            onSubmit={handleSubmit}
                        >


                            {/* Error */}

                            {error && (
                                <div
                                    className="login-error"
                                    role="alert"
                                >
                                    {error}
                                </div>
                            )}


                            {/* =================================================
                               FULL NAME
                            ================================================= */}

                            <div className="form-field">

                                <label htmlFor="fullName">
                                    Full Name
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
                                        <circle
                                            cx="12"
                                            cy="8"
                                            r="3.5"
                                        />

                                        <path
                                            d="M5 20c.8-3.2 3.2-5 7-5s6.2 1.8 7 5"
                                        />
                                    </svg>

                                    <input
                                        id="fullName"
                                        name="fullName"
                                        type="text"
                                        value={fullName}
                                        onChange={(event) =>
                                            setFullName(
                                                event.target.value
                                            )
                                        }
                                        placeholder="Your name"
                                        autoComplete="name"
                                        required
                                    />

                                </div>

                            </div>


                            {/* =================================================
                               EMAIL
                            ================================================= */}

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
                                            setEmail(
                                                event.target.value
                                            )
                                        }
                                        placeholder="you@example.com"
                                        autoComplete="email"
                                        required
                                    />

                                </div>

                            </div>


                            {/* =================================================
                               PASSWORD
                            ================================================= */}

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

                                        <path
                                            d="M8 10V7a4 4 0 0 1 8 0v3"
                                        />
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
                                            setPassword(
                                                event.target.value
                                            )
                                        }
                                        placeholder="At least 6 characters"
                                        autoComplete="new-password"
                                        minLength={6}
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


                            {/* =================================================
                               REGISTER BUTTON
                            ================================================= */}

                            <button
                                type="submit"
                                className="login-submit"
                                disabled={loading}
                            >
                                {loading
                                    ? "Creating account..."
                                    : "Create account"}

                                {!loading && (
                                    <span className="button-arrow">
                                        →
                                    </span>
                                )}
                            </button>


                            {/* =================================================
                               LOGIN LINK
                            ================================================= */}

                            <p className="register-prompt">

                                Already have an account?{" "}

                                <Link to="/login">
                                    Log in
                                </Link>

                            </p>

                        </form>

                    </div>

                </section>

            </div>

        </main>
    );
}

export default Register;