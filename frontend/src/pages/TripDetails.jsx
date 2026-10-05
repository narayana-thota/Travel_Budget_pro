import { useEffect, useState } from "react";

import {
    useNavigate,
    useParams
} from "react-router-dom";

import {
    ArrowLeft,
    CalendarDays,
    Users,
    Wallet,
    MapPin,
    RefreshCw,
    X,
    PiggyBank,
    TrendingUp,
    Trash2,
    CheckCircle,
    XCircle
} from "lucide-react";

import api from "../api/api";
import AppLayout from "../components/AppLayout";
import "../styles/trip-details.css";

function TripDetails() {
    const { tripId } = useParams();
    const navigate = useNavigate();

    const [trip, setTrip] = useState(null);
    const [expenses, setExpenses] = useState([]);
    const [budgetSummary, setBudgetSummary] = useState(null);
    const [estimate, setEstimate] = useState(null);

    const [loading, setLoading] = useState(true);
    const [statusLoading, setStatusLoading] = useState(false);
    const [error, setError] = useState("");

    const [showExpenseForm, setShowExpenseForm] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [expenseLoading, setExpenseLoading] = useState(false);
    const [expenseError, setExpenseError] = useState("");

    const [tripDeleteLoading, setTripDeleteLoading] = useState(false);

    const [expenseForm, setExpenseForm] = useState({
        expense_name: "",
        category: "Travel",
        amount: "",
        expense_date: "",
        expense_type: "Planned",
        description: "",
    });

    /* =========================================================
       CATEGORIES
       ========================================================= */

    const categories = [
        "Travel",
        "Hotel",
        "Food",
        "Shopping",
        "Activities",
        "Local Transport",
        "Other",
    ];

    const categoryIds = {
        Travel: 1,
        Hotel: 2,
        Food: 3,
        Shopping: 4,
        Activities: 5,
        "Local Transport": 6,
        Other: 7,
    };
    const handleMarkCompleted = async () => {
    const confirmed = window.confirm(
        `Mark "${trip?.trip_name || "this trip"}" as completed?`
    );

    if (!confirmed) {
        return;
    }

    try {
        setStatusLoading(true);
        setError("");

        await api.put(`/api/trips/${tripId}`, {
            status: "Completed"
        });

        setTrip((prev) => ({
            ...prev,
            status: "Completed"
        }));

    } catch (err) {
        console.error(
            "Failed to update trip status:",
            err
        );

        setError(
            err.response?.data?.message ||
            err.response?.data?.error ||
            "Failed to update trip status."
        );

    } finally {
        setStatusLoading(false);
    }
};
const handleCancelTrip = async () => {
    const confirmed = window.confirm(
        `Are you sure you want to cancel "${trip?.trip_name || "this trip"}"?`
    );

    if (!confirmed) {
        return;
    }

    try {
        setStatusLoading(true);
        setError("");

        await api.put(`/api/trips/${tripId}`, {
            status: "Cancelled"
        });

        setTrip((prev) => ({
            ...prev,
            status: "Cancelled"
        }));
    } catch (err) {
        console.error(
            "Failed to cancel trip:",
            err
        );

        setError(
            err.response?.data?.message ||
            err.response?.data?.error ||
            "Failed to cancel trip."
        );
    } finally {
        setStatusLoading(false);
    }
};

    /* =========================================================
       DELETE TRIP
       ========================================================= */

    const handleDeleteTrip = async () => {
        const confirmed = window.confirm(
            `Are you sure you want to delete "${trip?.trip_name || "this trip"}"? This action cannot be undone.`
        );

        if (!confirmed) return;

        try {
            setTripDeleteLoading(true);
            setError("");

            await api.delete(`/api/trips/${tripId}`);

            navigate("/my-trips", {
                replace: true,
            });
        } catch (err) {
            console.error(
                "Failed to delete trip:",
                err
            );

            setError(
                err.response?.data?.message ||
                    err.response?.data?.error ||
                    "Failed to delete trip."
            );
        } finally {
            setTripDeleteLoading(false);
        }
    };

    /* =========================================================
       LOAD TRIP DATA
       ========================================================= */

    const loadTripData = async () => {
    try {
        setLoading(true);
        setError("");

        // These three are required for the Trip Details page.
        const [
            tripResponse,
            expensesResponse,
            summaryResponse,
        ] = await Promise.all([
            api.get(`/api/trips/${tripId}`),
            api.get(`/api/trips/${tripId}/expenses`),
            api.get(`/api/trips/${tripId}/budget-summary`),
        ]);

        setTrip(
            tripResponse.data?.trip ??
                tripResponse.data
        );

        setExpenses(
            expensesResponse.data?.expenses ??
                []
        );

        setBudgetSummary(
            summaryResponse.data?.budget ??
                summaryResponse.data
        );

        /*
         * Plantrip estimate is OPTIONAL.
         *
         * New trips may have an estimate.
         * Older trips may not have one.
         *
         * Therefore, failure of this request
         * must NOT prevent the trip from opening.
         */
        try {
            const estimateResponse = await api.get(
                `/api/trips/${tripId}/estimate`
            );

            setEstimate(
                estimateResponse?.data ?? null
            );
        } catch (estimateError) {
            console.warn(
                "No Plantrip estimate available for this trip:",
                estimateError.response?.status
            );

            setEstimate(null);
        }

    } catch (err) {
        console.error(
            "Failed to load trip:",
            err
        );

        setError(
            err.response?.data?.message ||
                "Failed to load trip details."
        );
    } finally {
        setLoading(false);
    }
};
    useEffect(() => {
        loadTripData();
    }, [tripId]);

    /* =========================================================
       FORMATTERS
       ========================================================= */

    const formatCurrency = (amount) => {
        return `₹${Number(
            amount || 0
        ).toLocaleString("en-IN")}`;
    };

    const formatDate = (date) => {
        if (!date) return "-";

        const value = String(date).trim();

        const isoMatch = value.match(
            /^(\d{4})-(\d{2})-(\d{2})/
        );

        if (isoMatch) {
            const [, year, month, day] =
                isoMatch;

            return new Date(
                Number(year),
                Number(month) - 1,
                Number(day)
            ).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            });
        }

        const parsedDate = new Date(value);

        if (
            Number.isNaN(
                parsedDate.getTime()
            )
        ) {
            return "-";
        }

        return parsedDate.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );
    };

    /* =========================================================
       FINANCIAL DATA
       ========================================================= */

    const totalBudget = Number(
        trip?.total_budget || 0
    );

    // Planned = user-entered expenses
    const plannedTotal = expenses
        .filter(
            (expense) =>
                (expense.expense_type ||
                    "Planned") ===
                "Planned"
        )
        .reduce(
            (total, expense) =>
                total +
                Number(
                    expense.amount || 0
                ),
            0
        );

    // Actual = Plantrip API response
    const actualTotal = Number(
        estimate?.budget?.estimated_total ||
            0
    );

    /*
     * BUDGET CHECK
     *
     * Planned budget = the budget entered by the user.
     * Actual = the amount returned by the Plantrip API.
     *
     * Positive difference -> budget is sufficient.
     * Negative difference -> additional amount is needed.
     */
    const budgetDifference = totalBudget - actualTotal;

    const budgetIsSufficient =
        budgetDifference >= 0;

    const additionalAmountNeeded = Math.abs(
        budgetDifference
    );

    const actualCategories =
        estimate?.estimate?.categories ||
        [];

    const totalExpenses = plannedTotal;

    /* =========================================================
       CATEGORY DATA
       ========================================================= */

    const categoryData = categories
        .map((category) => {
            const amount = expenses
                .filter(
                    (expense) =>
                        (expense.category_name ||
                            expense.category) ===
                        category
                )
                .reduce(
                    (total, expense) =>
                        total +
                        Number(
                            expense.amount || 0
                        ),
                    0
                );

            return {
                category,
                amount,
                percentage:
                    totalExpenses > 0
                        ? (amount /
                              totalExpenses) *
                          100
                        : 0,
            };
        })
        .filter(
            (item) => item.amount > 0
        );

    const remainingBudget =
        totalBudget - totalExpenses;

    const usagePercentage =
        totalBudget > 0
            ? (totalExpenses /
                  totalBudget) *
              100
            : 0;

    const isOverBudget =
        remainingBudget < 0;

    /* =========================================================
       PLANNED VS ACTUAL
       ========================================================= */

    const comparisonData = categories.map(
        (category) => {
            const actual = Number(
                actualCategories.find(
                    (item) =>
                        item.category ===
                        category
                )?.estimated_amount || 0
            );

            const planned = expenses
                .filter(
                    (expense) =>
                        (expense.category_name ||
                            expense.category) ===
                            category &&
                        (expense.expense_type ||
                            "Planned") ===
                            "Planned"
                )
                .reduce(
                    (total, expense) =>
                        total +
                        Number(
                            expense.amount || 0
                        ),
                    0
                );

            return {
                category,
                planned,
                actual,
            };
        }
    );

    const comparisonMax = Math.max(
        ...comparisonData.flatMap(
            (item) => [
                item.planned,
                item.actual,
            ]
        ),
        1
    );

    /* =========================================================
       DATE NORMALIZATION
       ========================================================= */

    const normalizeDate = (value) => {
        if (!value) return "";

        const dateString =
            String(value).trim();

        const isoMatch =
            dateString.match(
                /^(\d{4}-\d{2}-\d{2})/
            );

        if (isoMatch) {
            return isoMatch[1];
        }

        const parsedDate =
            new Date(dateString);

        if (
            Number.isNaN(
                parsedDate.getTime()
            )
        ) {
            return "";
        }

        const year =
            parsedDate.getUTCFullYear();

        const month = String(
            parsedDate.getUTCMonth() + 1
        ).padStart(2, "0");

        const day = String(
            parsedDate.getUTCDate()
        ).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };

    /* =========================================================
       SPENDING TREND
       ========================================================= */

    const spendingByDate = Object.values(
        expenses.reduce(
            (groups, expense) => {
                const key = normalizeDate(
                    expense.expense_date
                );

                if (!key) {
                    return groups;
                }

                if (!groups[key]) {
                    groups[key] = {
                        date: key,
                        amount: 0,
                    };
                }

                groups[key].amount +=
                    Number(
                        expense.amount || 0
                    );

                return groups;
            },
            {}
        )
    ).sort((a, b) =>
        a.date.localeCompare(b.date)
    );

    const maxSpending = Math.max(
        ...spendingByDate.map(
            (item) => item.amount
        ),
        0
    );

    /* =========================================================
       FIXED DONUT COLORS
       ========================================================= */

    const chartColors = [
        "#D99A2B",
        "#2E7467",
        "#6D8EAA",
        "#A57B65",
        "#8A7BAF",
        "#7B9B72",
        "#A98A54",
    ];

    /* =========================================================
       DONUT GRADIENT
       ========================================================= */

    const donutGradient = (() => {
        if (!categoryData.length) {
            return "conic-gradient(#E9E7E1 0deg 360deg)";
        }

        let current = 0;

        const stops = categoryData.map(
            (item, index) => {
                const start = current;

                current +=
                    (item.percentage /
                        100) *
                    360;

                const color =
                    chartColors[
                        index %
                            chartColors.length
                    ];

                return `${color} ${start}deg ${current}deg`;
            }
        );

        return `conic-gradient(${stops.join(
            ", "
        )})`;
    })();

    /* =========================================================
       EXPENSE FORM
       ========================================================= */

    const handleExpenseChange = (
        event
    ) => {
        const {
            name,
            value,
        } = event.target;

        setExpenseForm(
            (previous) => ({
                ...previous,
                [name]: value,
            })
        );
    };

    const resetExpenseForm = () => {
        setExpenseForm({
            expense_name: "",
            category: "Travel",
            amount: "",
            expense_date: "",
            expense_type: "Planned",
            description: "",
        });

        setExpenseError("");
    };

    const openExpenseForm = () => {
        setEditingExpense(null);
        resetExpenseForm();
        setShowExpenseForm(true);
    };

    const closeExpenseForm = () => {
        if (expenseLoading) return;

        setShowExpenseForm(false);
        setEditingExpense(null);
        resetExpenseForm();
    };

    /* =========================================================
       SAVE EXPENSE
       ========================================================= */

    const handleSaveExpense = async (
        event
    ) => {
        event.preventDefault();

        setExpenseError("");

        const expenseName =
            expenseForm.expense_name.trim();

        const amount = Number(
            expenseForm.amount
        );

        if (!expenseName) {
            setExpenseError(
                "Expense name is required."
            );
            return;
        }

        if (!expenseForm.category) {
            setExpenseError(
                "Please select a category."
            );
            return;
        }

        if (
            !expenseForm.amount ||
            amount <= 0
        ) {
            setExpenseError(
                "Amount must be greater than ₹0."
            );
            return;
        }

        if (!expenseForm.expense_date) {
            setExpenseError(
                "Expense date is required."
            );
            return;
        }

        try {
            setExpenseLoading(true);

            if (editingExpense) {
                const categoryId =
                    categoryIds[
                        expenseForm.category
                    ];

                if (!categoryId) {
                    setExpenseError(
                        "Invalid expense category."
                    );
                    return;
                }

                await api.put(
                    `/api/expenses/${editingExpense.id}`,
                    {
                        category_id:
                            categoryId,
                        expense_name:
                            expenseName,
                        amount,
                        expense_date:
                            expenseForm.expense_date,
                        expense_type:
                            "Planned",
                        description:
                            expenseForm.description.trim(),
                    }
                );
            } else {
                await api.post(
                    `/api/trips/${tripId}/expenses`,
                    {
                        expense_name:
                            expenseName,
                        category:
                            expenseForm.category,
                        amount,
                        expense_date:
                            expenseForm.expense_date,
                        expense_type:
                            "Planned",
                        description:
                            expenseForm.description.trim(),
                    }
                );
            }

            setShowExpenseForm(false);
            setEditingExpense(null);
            resetExpenseForm();

            await loadTripData();
        } catch (err) {
            console.error(
                "FAILED TO SAVE EXPENSE:",
                err
            );

            setExpenseError(
                err.response?.data
                    ?.message ||
                    err.response?.data
                        ?.error ||
                    "Failed to save expense."
            );
        } finally {
            setExpenseLoading(false);
        }
    };

    /* =========================================================
       GET EXPENSE DATE
       ========================================================= */

    const getExpenseInputDate = (
        date
    ) => {
        if (!date) return "";

        const value = String(date);

        if (
            /^\d{4}-\d{2}-\d{2}/.test(
                value
            )
        ) {
            return value.slice(0, 10);
        }

        const parsedDate =
            new Date(date);

        if (
            Number.isNaN(
                parsedDate.getTime()
            )
        ) {
            return "";
        }

        return parsedDate
            .toISOString()
            .slice(0, 10);
    };

    /* =========================================================
       EDIT EXPENSE
       ========================================================= */

    const handleEditExpense = (
        expense
    ) => {
        const category =
            expense.category_name ||
            expense.category ||
            "Travel";

        setEditingExpense(expense);

        setExpenseForm({
            expense_name:
                expense.expense_name ||
                expense.name ||
                "",
            category,
            amount:
                expense.amount ?? "",
            expense_date:
                getExpenseInputDate(
                    expense.expense_date
                ),
            expense_type:
                "Planned",
            description:
                expense.description || "",
        });

        setExpenseError("");
        setShowExpenseForm(true);
    };

    /* =========================================================
       DELETE EXPENSE
       ========================================================= */

    const handleDeleteExpense = async (
        expenseId
    ) => {
        const confirmed =
            window.confirm(
                "Are you sure you want to delete this expense?"
            );

        if (!confirmed) return;

        try {
            setExpenseLoading(true);
            setExpenseError("");

            await api.delete(
                `/api/expenses/${expenseId}`
            );

            await loadTripData();
        } catch (err) {
            console.error(
                "FAILED TO DELETE EXPENSE:",
                err
            );

            setExpenseError(
                err.response?.data
                    ?.message ||
                    err.response?.data
                        ?.error ||
                    "Failed to delete expense."
            );
        } finally {
            setExpenseLoading(false);
        }
    };

    /* =========================================================
       LOADING
       ========================================================= */

    if (loading) {
        return (
            <AppLayout>
                <div className="trip-details-page">
                    <div className="trip-details-loading">
                        <div className="loading-spinner">
                            <RefreshCw size={24} />
                        </div>

                        <p>
                            Loading trip
                            details...
                        </p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    /* =========================================================
       ERROR
       ========================================================= */

    if (error || !trip) {
        return (
            <AppLayout>
                <div className="trip-details-page">
                    <div className="trip-details-error">

                        <h2>
                            Unable to load trip
                        </h2>

                        <p>
                            {error ||
                                "The requested trip could not be found."}
                        </p>

                        <div className="trip-error-actions">

                            <button
                                type="button"
                                onClick={
                                    loadTripData
                                }
                                className="trip-retry-button"
                            >
                                <RefreshCw
                                    size={17}
                                />
                                Try Again
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    navigate(
                                        "/my-trips"
                                    )
                                }
                                className="trip-back-button"
                            >
                                Back to My Trips
                            </button>

                        </div>

                    </div>
                </div>
            </AppLayout>
        );
    }

    /* =========================================================
       MAIN PAGE
       ========================================================= */

    return (
        <AppLayout>

            <div className="trip-details-page">

                {/* =================================================
                   HEADER
                   ================================================= */}

                <header className="trip-details-header">

                    <button
                        type="button"
                        className="trip-details-back"
                        onClick={() =>
                            navigate(
                                "/my-trips"
                            )
                        }
                    >
                        <ArrowLeft size={18} />
                        Back to My Trips
                    </button>

                    <div className="trip-details-heading">

                        <div>

                            <p className="trip-details-eyebrow">
                                TRIP DETAILS
                            </p>

                            <h1>
                                {trip.trip_name}
                            </h1>

                            <p className="trip-details-description">
                                Review your trip
                                plan, expenses
                                and budget.
                            </p>

                        </div>

                                        <div className="trip-header-actions">

                            <span
                                className={`trip-status-badge ${
                                    trip?.status
                                        ? trip.status.toLowerCase()
                                        : "planned"
                                }`}
                            >
                                {trip?.status || "Planned"}
                            </span>

                            {(!trip?.status || trip.status === "Planned") && (
                                <>
                                    <button
                                        type="button"
                                        className="complete-trip-button"
                                        onClick={handleMarkCompleted}
                                        disabled={statusLoading}
                                    >
                                        <CheckCircle size={16} />
                                        {statusLoading
                                            ? "Updating..."
                                            : "Mark Completed"}
                                    </button>

                                    <button
                                        type="button"
                                        className="cancel-trip-button"
                                        onClick={handleCancelTrip}
                                        disabled={statusLoading}
                                    >
                                        <XCircle size={16} />
                                        {statusLoading
                                            ? "Updating..."
                                            : "Cancel Trip"}
                                    </button>
                                </>
                            )}

                            <button
                                type="button"
                                className="delete-trip-button"
                                onClick={handleDeleteTrip}
                                disabled={tripDeleteLoading}
                            >
                                <Trash2 size={16} />

                                {tripDeleteLoading
                                    ? "Deleting..."
                                    : "Delete Trip"}
                            </button>

                        </div>

                    </div>

                </header>

                {/* =================================================
                   TRIP OVERVIEW
                   ================================================= */}

                <section className="trip-overview-card">

                    <div className="trip-route-section">

                        <div className="trip-location">

                            <span className="location-label">
                                FROM
                            </span>

                            <div className="location-value">

                                <MapPin size={18} />

                                <strong>
                                    {trip.source}
                                </strong>

                            </div>

                        </div>

                        <div className="route-line">
                            <span />
                            <span />
                            <span />
                        </div>

                        <div className="trip-location">

                            <span className="location-label">
                                TO
                            </span>

                            <div className="location-value destination">

                                <MapPin size={18} />

                                <strong>
                                    {
                                        trip.destination
                                    }
                                </strong>

                            </div>

                        </div>

                    </div>

                    <div className="trip-overview-divider" />

                    <div className="trip-meta-grid">

                        <div className="trip-meta-item">

                            <CalendarDays
                                size={19}
                            />

                            <div>

                                <span>
                                    TRAVEL DATES
                                </span>

                                <strong>
                                    {formatDate(
                                        trip.start_date
                                    )}
                                    {" — "}
                                    {formatDate(
                                        trip.end_date
                                    )}
                                </strong>

                            </div>

                        </div>

                        <div className="trip-meta-item">

                            <Users size={19} />

                            <div>

                                <span>
                                    TRAVELERS
                                </span>

                                <strong>
                                    {
                                        trip.travelers
                                    }{" "}
                                    {Number(
                                        trip.travelers
                                    ) === 1
                                        ? "Traveler"
                                        : "Travelers"}
                                </strong>

                            </div>

                        </div>

                    </div>

                </section>

                {/* =================================================
                   FINANCIAL OVERVIEW
                   ================================================= */}

                <section className="financial-overview-section">

                    <div className="section-heading">

                        <div>

                            <p className="section-eyebrow">
                                FINANCIAL OVERVIEW
                            </p>

                            <h2>
                                Trip Budget at a
                                Glance
                            </h2>

                        </div>

                    </div>

                    <div className="financial-cards-grid">

                        <div className="financial-card planned-card">

                            <div className="financial-card-top">

                                <div className="financial-card-icon">
                                    <PiggyBank
                                        size={20}
                                    />
                                </div>

                                <span className="financial-card-label">
                                    PLANNED
                                </span>

                            </div>

                            <strong>
                                {formatCurrency(
                                    plannedTotal
                                )}
                            </strong>

                            <p>
                                Your planned
                                expenses
                            </p>

                        </div>

                        <div className="financial-card actual-card">

                            <div className="financial-card-top">

                                <div className="financial-card-icon">
                                    <TrendingUp
                                        size={20}
                                    />
                                </div>

                                <span className="financial-card-label">
                                    ACTUAL
                                </span>

                            </div>

                            <strong>
                                {estimate
                                    ? formatCurrency(
                                          actualTotal
                                      )
                                    : "Not available"}
                            </strong>

                            <p>
                                Plantrip API
                                response
                            </p>

                        </div>

                    </div>

                </section>

                {/* =================================================
                   BUDGET CHECK
                   ================================================= */}

                {estimate && (
                    <section className="budget-check-section">
                        <div className="section-heading">
                            <div>
                                <p className="section-eyebrow">
                                    BUDGET CHECK
                                </p>

                                <h2>
                                    {budgetIsSufficient
                                        ? "Your budget looks sufficient"
                                        : "Your budget may not be sufficient"}
                                </h2>

                                <p>
                                    Compare your planned trip budget
                                    with the actual estimate returned
                                    by the Plantrip API.
                                </p>
                            </div>

                            <div
                                className={`budget-check-status ${
                                    budgetIsSufficient
                                        ? "sufficient"
                                        : "insufficient"
                                }`}
                            >
                                {budgetIsSufficient ? "✓" : "⚠"}
                            </div>
                        </div>

                        <div
                            className={`budget-check-card ${
                                budgetIsSufficient
                                    ? "budget-sufficient"
                                    : "budget-insufficient"
                            }`}
                        >
                            <div className="budget-check-grid">
                                <div className="budget-check-item">
                                    <span>
                                        YOUR BUDGET
                                    </span>

                                    <strong>
                                        {formatCurrency(
                                            totalBudget
                                        )}
                                    </strong>
                                </div>

                                <div className="budget-check-item">
                                    <span>
                                        ACTUAL ESTIMATE
                                    </span>

                                    <strong>
                                        {formatCurrency(
                                            actualTotal
                                        )}
                                    </strong>
                                </div>

                                <div className="budget-check-item">
                                    <span>
                                        {budgetIsSufficient
                                            ? "REMAINING"
                                            : "ADDITIONAL NEEDED"}
                                    </span>

                                    <strong>
                                        {formatCurrency(
                                            additionalAmountNeeded
                                        )}
                                    </strong>
                                </div>
                            </div>

                            <div className="budget-check-message">
                                {budgetIsSufficient ? (
                                    <>
                                        Your planned budget of {" "}
                                        <strong>
                                            {formatCurrency(
                                                totalBudget
                                            )}
                                        </strong>{" "}
                                        covers the actual estimated
                                        cost of {" "}
                                        <strong>
                                            {formatCurrency(
                                                actualTotal
                                            )}
                                        </strong>
                                        .
                                        <span>
                                            {" "}
                                            You have {" "}
                                            <strong>
                                                {formatCurrency(
                                                    additionalAmountNeeded
                                                )}
                                            </strong>{" "}
                                            remaining.
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        Your actual estimated cost is {" "}
                                        <strong>
                                            {formatCurrency(
                                                actualTotal
                                            )}
                                        </strong>
                                        , which is {" "}
                                        <strong>
                                            {formatCurrency(
                                                additionalAmountNeeded
                                            )}
                                        </strong>{" "}
                                        more than your planned budget
                                        of {" "}
                                        <strong>
                                            {formatCurrency(
                                                totalBudget
                                            )}
                                        </strong>
                                        .
                                    </>
                                )}
                            </div>
                        </div>
                    </section>
                )}

                {/* =================================================
                   CATEGORY COMPARISON
                   ================================================= */}

                <section className="category-comparison-section">

                    <div className="section-heading">

                        <div>

                            <p className="section-eyebrow">
                                CATEGORY
                                COMPARISON
                            </p>

                            <h2>
                                Planned vs Actual
                            </h2>

                            <p>
                                Compare your
                                planned expenses
                                with the amount
                                returned by the
                                Plantrip API.
                            </p>

                        </div>

                    </div>

                    <div className="category-comparison-card">

                        {/* HEADERS */}

                        <div className="category-comparison-header">

                            <div className="comparison-category-heading">
                                Category
                            </div>

                            <div className="comparison-amount-heading">

                                <span className="comparison-heading-dot planned" />

                                <span>
                                    Planned
                                </span>

                            </div>

                            <div className="comparison-amount-heading">

                                <span className="comparison-heading-dot actual" />

                                <span>
                                    Actual
                                </span>

                            </div>

                        </div>

                        {/* BODY */}

                        <div className="category-comparison-body">

                            {comparisonData.map(
                                (item) => (
                                    <div
                                        className="category-comparison-row"
                                        key={
                                            item.category
                                        }
                                    >

                                        <div className="comparison-category-name">
                                            {
                                                item.category
                                            }
                                        </div>

                                        <div className="comparison-value-column">

                                            <div className="comparison-value">
                                                {formatCurrency(
                                                    item.planned
                                                )}
                                            </div>

                                            <div className="comparison-track">

                                                <div
                                                    className="comparison-fill planned"
                                                    style={{
                                                        width: `${
                                                            comparisonMax >
                                                            0
                                                                ? (item.planned /
                                                                      comparisonMax) *
                                                                  100
                                                                : 0
                                                        }%`,
                                                    }}
                                                />

                                            </div>

                                        </div>

                                        <div className="comparison-value-column">

                                            <div className="comparison-value">
                                                {formatCurrency(
                                                    item.actual
                                                )}
                                            </div>

                                            <div className="comparison-track">

                                                <div
                                                    className="comparison-fill actual"
                                                    style={{
                                                        width: `${
                                                            comparisonMax >
                                                            0
                                                                ? (item.actual /
                                                                      comparisonMax) *
                                                                  100
                                                                : 0
                                                        }%`,
                                                    }}
                                                />

                                            </div>

                                        </div>

                                    </div>
                                )
                            )}

                        </div>

                        {/* TOTAL */}

                        <div className="category-comparison-total">

                            <strong>
                                Total
                            </strong>

                            <strong className="total-planned">
                                {formatCurrency(
                                    plannedTotal
                                )}
                            </strong>

                            <strong className="total-actual">
                                {formatCurrency(
                                    actualTotal
                                )}
                            </strong>

                        </div>

                        {/* LEGEND */}

                        <div className="category-comparison-legend">

                            <span>

                                <i className="comparison-legend-dot planned" />

                                Planned

                            </span>

                            <span>

                                <i className="comparison-legend-dot actual" />

                                Actual

                            </span>

                        </div>

                    </div>

                </section>

                {/* =================================================
                   BUDGET SUMMARY
                   ================================================= */}

                <section className="budget-summary-section">

                    <div className="section-heading">

                        <div>

                            <p className="section-eyebrow">
                                FINANCIAL OVERVIEW
                            </p>

                            <h2>
                                Budget Summary
                            </h2>

                        </div>

                    </div>

                    <div className="budget-summary-grid">

                        <div className="budget-card">

                            <div className="budget-card-icon">
                                <Wallet size={20} />
                            </div>

                            <span>
                                Total Budget
                            </span>

                            <strong>
                                {formatCurrency(
                                    totalBudget
                                )}
                            </strong>

                        </div>

                        <div className="budget-card">

                            <div className="budget-card-icon expenses">
                                <Wallet size={20} />
                            </div>

                            <span>
                                Total Expenses
                            </span>

                            <strong>
                                {formatCurrency(
                                    totalExpenses
                                )}
                            </strong>

                        </div>

                        <div
                            className={`budget-card ${
                                isOverBudget
                                    ? "over-budget"
                                    : "remaining"
                            }`}
                        >

                            <div className="budget-card-icon">
                                <Wallet size={20} />
                            </div>

                            <span>
                                {isOverBudget
                                    ? "Over Budget"
                                    : "Remaining Budget"}
                            </span>

                            <strong>
                                {formatCurrency(
                                    Math.abs(
                                        remainingBudget
                                    )
                                )}
                            </strong>

                        </div>

                    </div>

                    <div className="budget-progress-card">

                        <div className="budget-progress-header">

                            <span>
                                Budget Usage
                            </span>

                            <strong>
                                {usagePercentage.toFixed(
                                    2
                                )}
                                %
                            </strong>

                        </div>

                        <div className="budget-progress-track">

                            <div
                                className={`budget-progress-fill ${
                                    isOverBudget
                                        ? "over-budget"
                                        : ""
                                }`}
                                style={{
                                    width: `${Math.min(
                                        usagePercentage,
                                        100
                                    )}%`,
                                }}
                            />

                        </div>

                        <div className="budget-progress-footer">

                            <span>
                                {formatCurrency(
                                    totalExpenses
                                )}{" "}
                                spent
                            </span>

                            <span>
                                {formatCurrency(
                                    totalBudget
                                )}{" "}
                                budget
                            </span>

                        </div>

                    </div>

                    {isOverBudget && (
                        <div className="budget-warning">

                            <strong>
                                Budget exceeded
                            </strong>

                            <span>
                                You are{" "}
                                {formatCurrency(
                                    Math.abs(
                                        remainingBudget
                                    )
                                )}{" "}
                                over your planned
                                budget.
                            </span>

                        </div>
                    )}

                </section>

                {/* =================================================
                   EXPENSES
                   ================================================= */}

                <section className="expenses-section">

                    <div className="section-heading">

                        <div>

                            <p className="section-eyebrow">
                                SPENDING
                            </p>

                            <h2>
                                Expenses
                            </h2>

                        </div>

                        <button
                            type="button"
                            className="add-expense-button"
                            onClick={
                                openExpenseForm
                            }
                        >
                            + Add Expense
                        </button>

                    </div>

                    <div className="expenses-card">

                        {expenses.length ===
                        0 ? (
                            <div className="expenses-empty">

                                <div className="empty-icon">
                                    <Wallet size={24} />
                                </div>

                                <h3>
                                    No expenses yet
                                </h3>

                                <p>
                                    Add your first
                                    expense to
                                    start
                                    tracking your
                                    trip budget.
                                </p>

                                <button
                                    type="button"
                                    className="add-expense-empty-button"
                                    onClick={
                                        openExpenseForm
                                    }
                                >
                                    + Add Expense
                                </button>

                            </div>
                        ) : (
                            <div className="expense-list">

                                {expenses.map(
                                    (
                                        expense
                                    ) => (
                                        <div
                                            className="expense-row"
                                            key={
                                                expense.id
                                            }
                                        >

                                            <div className="expense-main">

                                                <div className="expense-category-icon">
                                                    <Wallet
                                                        size={
                                                            18
                                                        }
                                                    />
                                                </div>

                                                <div className="expense-information">

                                                    <strong>
                                                        {expense.expense_name ||
                                                            expense.name ||
                                                            "Expense"}
                                                    </strong>

                                                    <span>
                                                        {expense.category_name ||
                                                            expense.category ||
                                                            "Other"}
                                                    </span>

                                                </div>

                                            </div>

                                            <div className="expense-date">
                                                {formatDate(
                                                    expense.expense_date
                                                )}
                                            </div>

                                            <div className="expense-type">
                                                {expense.expense_type ||
                                                    "Planned"}
                                            </div>

                                            <strong className="expense-amount">
                                                {formatCurrency(
                                                    expense.amount
                                                )}
                                            </strong>

                                            <div className="expense-actions">

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleEditExpense(
                                                            expense
                                                        )
                                                    }
                                                    disabled={
                                                        expenseLoading
                                                    }
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleDeleteExpense(
                                                            expense.id
                                                        )
                                                    }
                                                    disabled={
                                                        expenseLoading
                                                    }
                                                >
                                                    Delete
                                                </button>

                                            </div>

                                        </div>
                                    )
                                )}

                            </div>
                        )}

                    </div>

                </section>

                {/* =================================================
                   EXPENSE ANALYTICS
                   ================================================= */}

                <section className="analytics-section">

                    <div className="section-heading">

                        <div>

                            <p className="section-eyebrow">
                                EXPENSE
                                ANALYTICS
                            </p>

                            <h2>
                                Where your money
                                is going
                            </h2>

                        </div>

                    </div>

                    <div className="analytics-grid">

                        {/* EXPENSE BREAKDOWN */}

                        <div className="analytics-card expense-breakdown-card">

                            <div className="analytics-card-heading">

                                <div>

                                    <h3>
                                        Expense
                                        Breakdown
                                    </h3>

                                    <p>
                                        Share of your
                                        total trip
                                        spending.
                                    </p>

                                </div>

                            </div>

                            {categoryData.length ===
                            0 ? (
                                <div className="analytics-empty">
                                    Add expenses to
                                    see your
                                    spending
                                    breakdown.
                                </div>
                            ) : (
                                <div className="donut-layout">

                                    {/* DONUT */}

                                    <div
                                        className="expense-donut"
                                        style={{
                                            background:
                                                donutGradient,
                                        }}
                                    >

                                        <div className="expense-donut-center">

                                            <strong>
                                                {formatCurrency(
                                                    totalExpenses
                                                )}
                                            </strong>

                                            <span>
                                                Total spent
                                            </span>

                                        </div>

                                    </div>

                                    {/* LEGEND */}

                                    <div className="donut-legend">

                                        {categoryData.map(
                                            (
                                                item,
                                                index
                                            ) => (
                                                <div
                                                    className="donut-legend-item"
                                                    key={
                                                        item.category
                                                    }
                                                >

                                                    <span
                                                        className="chart-dot"
                                                        style={{
                                                            backgroundColor:
                                                                chartColors[
                                                                    index %
                                                                        chartColors.length
                                                                ],
                                                        }}
                                                    />

                                                    <div>

                                                        <strong>
                                                            {
                                                                item.category
                                                            }
                                                        </strong>

                                                        <span>
                                                            {item.percentage.toFixed(
                                                                1
                                                            )}
                                                            %
                                                        </span>

                                                    </div>

                                                    <b>
                                                        {formatCurrency(
                                                            item.amount
                                                        )}
                                                    </b>

                                                </div>
                                            )
                                        )}

                                    </div>

                                </div>
                            )}

                        </div>

                        {/* PLANNED VS ACTUAL */}

                        <div className="analytics-card planned-actual-card">

                            <div className="analytics-card-heading">

                                <div>

                                    <h3>
                                        Planned vs
                                        Actual
                                    </h3>

                                    <p>
                                        Compare
                                        expected and
                                        recorded
                                        spending.
                                    </p>

                                </div>

                            </div>

                            {expenses.length ===
                            0 ? (
                                <div className="analytics-empty">
                                    Add planned or
                                    actual
                                    expenses to
                                    compare them.
                                </div>
                            ) : (
                                <div className="planned-actual-content">

                                    <div className="planned-actual-total">

                                        <div>

                                            <span>
                                                Planned
                                            </span>

                                            <strong>
                                                {formatCurrency(
                                                    plannedTotal
                                                )}
                                            </strong>

                                        </div>

                                        <div>

                                            <span>
                                                Actual
                                            </span>

                                            <strong>
                                                {formatCurrency(
                                                    actualTotal
                                                )}
                                            </strong>

                                        </div>

                                    </div>

                                    <div className="comparison-bars">

                                        <div className="comparison-row">

                                            <div className="comparison-label">

                                                <span>
                                                    Planned
                                                </span>

                                                <strong>
                                                    {formatCurrency(
                                                        plannedTotal
                                                    )}
                                                </strong>

                                            </div>

                                            <div className="comparison-track">

                                                <div
                                                    className="comparison-fill planned"
                                                    style={{
                                                        width: `${
                                                            Math.max(
                                                                plannedTotal,
                                                                actualTotal,
                                                                totalExpenses
                                                            ) >
                                                            0
                                                                ? Math.min(
                                                                      (plannedTotal /
                                                                          Math.max(
                                                                              plannedTotal,
                                                                              actualTotal,
                                                                              totalExpenses
                                                                          )) *
                                                                          100,
                                                                      100
                                                                  )
                                                                : 0
                                                        }%`,
                                                    }}
                                                />

                                            </div>

                                        </div>

                                        <div className="comparison-row">

                                            <div className="comparison-label">

                                                <span>
                                                    Actual
                                                </span>

                                                <strong>
                                                    {formatCurrency(
                                                        actualTotal
                                                    )}
                                                </strong>

                                            </div>

                                            <div className="comparison-track">

                                                <div
                                                    className="comparison-fill actual"
                                                    style={{
                                                        width: `${
                                                            Math.max(
                                                                plannedTotal,
                                                                actualTotal,
                                                                totalExpenses
                                                            ) >
                                                            0
                                                                ? Math.min(
                                                                      (actualTotal /
                                                                          Math.max(
                                                                              plannedTotal,
                                                                              actualTotal,
                                                                              totalExpenses
                                                                          )) *
                                                                          100,
                                                                      100
                                                                  )
                                                                : 0
                                                        }%`,
                                                    }}
                                                />

                                            </div>

                                        </div>

                                    </div>

                                    <div className="analytics-insight">

                                        <span>
                                            {actualTotal >
                                            plannedTotal
                                                ? "Actual spending is above your planned expenses."
                                                : actualTotal <
                                                  plannedTotal
                                                ? "Actual spending is currently below your planned expenses."
                                                : "Planned and actual spending are currently equal."}
                                        </span>

                                    </div>

                                </div>
                            )}

                        </div>

                    </div>

                    {/* SPENDING TREND */}

                    <div className="analytics-card spending-trend-card">

                        <div className="analytics-card-heading">

                            <div>

                                <h3>
                                    Spending Trend
                                </h3>

                                <p>
                                    Daily expense
                                    movement during
                                    your trip.
                                </p>

                            </div>

                            {spendingByDate.length >
                                0 && (
                                <span className="trend-total">
                                    {
                                        spendingByDate.length
                                    }{" "}
                                    spending day
                                    {spendingByDate.length ===
                                    1
                                        ? ""
                                        : "s"}
                                </span>
                            )}

                        </div>

                        {spendingByDate.length ===
                        0 ? (
                            <div className="analytics-empty">
                                Add dated expenses
                                to see your
                                spending trend.
                            </div>
                        ) : (
                            <div className="trend-chart">

                                <div className="trend-y-labels">

                                    <span>
                                        {formatCurrency(
                                            maxSpending
                                        )}
                                    </span>

                                    <span>
                                        {formatCurrency(
                                            maxSpending /
                                                2
                                        )}
                                    </span>

                                    <span>
                                        ₹0
                                    </span>

                                </div>

                                <div className="trend-visual">

                                    <div className="trend-grid-line top" />
                                    <div className="trend-grid-line middle" />
                                    <div className="trend-grid-line bottom" />

                                    <div className="trend-bars">

                                        {spendingByDate.map(
                                            (
                                                item
                                            ) => {

                                                const height =
                                                    maxSpending >
                                                    0
                                                        ? Math.max(
                                                              (item.amount /
                                                                  maxSpending) *
                                                                  100,
                                                              6
                                                          )
                                                        : 0;

                                                return (
                                                    <div
                                                        className="trend-column"
                                                        key={
                                                            item.date
                                                        }
                                                    >

                                                        <div className="trend-value">
                                                            {formatCurrency(
                                                                item.amount
                                                            )}
                                                        </div>

                                                        <div className="trend-bar-track">

                                                            <div
                                                                className="trend-bar"
                                                                style={{
                                                                    height: `${height}%`,
                                                                }}
                                                            />

                                                        </div>

                                                        <span>
                                                            {formatDate(
                                                                item.date
                                                            )}
                                                        </span>

                                                    </div>
                                                );
                                            }
                                        )}

                                    </div>

                                </div>

                            </div>
                        )}

                    </div>

                </section>

                {/* =================================================
                   EXPENSE MODAL
                   ================================================= */}

                {showExpenseForm && (
                    <div
                        className="expense-modal-overlay"
                        onMouseDown={(
                            event
                        ) => {
                            if (
                                event.target ===
                                event.currentTarget
                            ) {
                                closeExpenseForm();
                            }
                        }}
                    >

                        <div className="expense-modal">

                            <div className="expense-modal-header">

                                <div>

                                    <p className="section-eyebrow">
                                        {editingExpense
                                            ? "EDIT EXPENSE"
                                            : "NEW EXPENSE"}
                                    </p>

                                    <h2>
                                        {editingExpense
                                            ? "Edit Expense"
                                            : "Add Expense"}
                                    </h2>

                                    <p>
                                        {editingExpense
                                            ? "Update the details of this expense."
                                            : "Add a planned expense to this trip."}
                                    </p>

                                </div>

                                <button
                                    type="button"
                                    className="expense-modal-close"
                                    onClick={
                                        closeExpenseForm
                                    }
                                    disabled={
                                        expenseLoading
                                    }
                                    aria-label="Close"
                                >
                                    <X size={20} />
                                </button>

                            </div>

                            <form
                                className="expense-form"
                                onSubmit={
                                    handleSaveExpense
                                }
                            >

                                <div className="expense-form-group">

                                    <label htmlFor="expense_name">
                                        Expense Name
                                    </label>

                                    <input
                                        id="expense_name"
                                        name="expense_name"
                                        type="text"
                                        placeholder="e.g. Bus ticket"
                                        value={
                                            expenseForm.expense_name
                                        }
                                        onChange={
                                            handleExpenseChange
                                        }
                                        disabled={
                                            expenseLoading
                                        }
                                    />

                                </div>

                                <div className="expense-form-row">

                                    <div className="expense-form-group">

                                        <label htmlFor="category">
                                            Category
                                        </label>

                                        <select
                                            id="category"
                                            name="category"
                                            value={
                                                expenseForm.category
                                            }
                                            onChange={
                                                handleExpenseChange
                                            }
                                            disabled={
                                                expenseLoading
                                            }
                                        >

                                            {categories.map(
                                                (
                                                    category
                                                ) => (
                                                    <option
                                                        key={
                                                            category
                                                        }
                                                        value={
                                                            category
                                                        }
                                                    >
                                                        {
                                                            category
                                                        }
                                                    </option>
                                                )
                                            )}

                                        </select>

                                    </div>

                                    <div className="expense-form-group">

                                        <label htmlFor="amount">
                                            Amount
                                        </label>

                                        <div className="amount-input-wrapper">

                                            <span>
                                                ₹
                                            </span>

                                            <input
                                                id="amount"
                                                name="amount"
                                                type="number"
                                                min="0.01"
                                                step="0.01"
                                                placeholder="0.00"
                                                value={
                                                    expenseForm.amount
                                                }
                                                onChange={
                                                    handleExpenseChange
                                                }
                                                disabled={
                                                    expenseLoading
                                                }
                                            />

                                        </div>

                                    </div>

                                </div>

                                <div className="expense-form-row">

                                    <div className="expense-form-group">

                                        <label htmlFor="expense_date">
                                            Expense Date
                                        </label>

                                        <input
                                            id="expense_date"
                                            name="expense_date"
                                            type="date"
                                            value={
                                                expenseForm.expense_date
                                            }
                                            onChange={
                                                handleExpenseChange
                                            }
                                            disabled={
                                                expenseLoading
                                            }
                                        />

                                    </div>

                                </div>

                                <div className="expense-form-group">

                                    <label htmlFor="description">

                                        Description

                                        <span>
                                            {" "}
                                            (Optional)
                                        </span>

                                    </label>

                                    <textarea
                                        id="description"
                                        name="description"
                                        rows="3"
                                        placeholder="Add any notes about this expense..."
                                        value={
                                            expenseForm.description
                                        }
                                        onChange={
                                            handleExpenseChange
                                        }
                                        disabled={
                                            expenseLoading
                                        }
                                    />

                                </div>

                                {expenseError && (
                                    <div className="expense-form-error">
                                        {
                                            expenseError
                                        }
                                    </div>
                                )}

                                <div className="expense-form-actions">

                                    <button
                                        type="button"
                                        className="expense-cancel-button"
                                        onClick={
                                            closeExpenseForm
                                        }
                                        disabled={
                                            expenseLoading
                                        }
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        className="expense-submit-button"
                                        disabled={
                                            expenseLoading
                                        }
                                    >
                                        {expenseLoading
                                            ? editingExpense
                                                ? "Saving..."
                                                : "Adding..."
                                            : editingExpense
                                            ? "Save Changes"
                                            : "Add Expense"}
                                    </button>

                                </div>

                            </form>

                        </div>

                    </div>
                )}

            </div>

        </AppLayout>
    );
}

export default TripDetails;