import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, Users, Wallet, MapPin, RefreshCw, X } from "lucide-react";

import api from "../api/api";
import AppLayout from "../components/AppLayout";
import "../styles/trip-details.css";

function TripDetails() {
    const { tripId } = useParams();
    const navigate = useNavigate();

    const [trip, setTrip] = useState(null);
    const [expenses, setExpenses] = useState([]);
    const [budgetSummary, setBudgetSummary] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [showExpenseForm, setShowExpenseForm] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [expenseLoading, setExpenseLoading] = useState(false);
    const [expenseError, setExpenseError] = useState("");

    const [expenseForm, setExpenseForm] = useState({
        expense_name: "",
        category: "Travel",
        amount: "",
        expense_date: "",
        expense_type: "Planned",
        description: "",
    });

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

    const loadTripData = async () => {
        try {
            setLoading(true);
            setError("");

            const [tripResponse, expensesResponse, summaryResponse] = await Promise.all([
                api.get(`/api/trips/${tripId}`),
                api.get(`/api/trips/${tripId}/expenses`),
                api.get(`/api/trips/${tripId}/budget-summary`),
            ]);

            setTrip(tripResponse.data?.trip ?? tripResponse.data);
            setExpenses(expensesResponse.data?.expenses ?? []);
            setBudgetSummary(summaryResponse.data?.budget ?? summaryResponse.data);
        } catch (err) {
            console.error("Failed to load trip:", err);
            setError(err.response?.data?.message || "Failed to load trip details.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTripData();
    }, [tripId]);

    const formatCurrency = (amount) => {
        return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
    };

    const formatDate = (date) => {
        if (!date) return "-";
        const value = String(date).trim();
        // Keep YYYY-MM-DD dates in local time so they do not shift by one day.
        const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (isoMatch) {
            const [, year, month, day] = isoMatch;
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
        // Handle Flask/MySQL strings such as:
        // Sat, 03 Oct 2026 00:00:00 GMT
        const parsedDate = new Date(value);
        if (Number.isNaN(parsedDate.getTime())) {
            return "-";
        }
        return parsedDate.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const totalBudget = Number(trip?.total_budget || 0);
    const totalExpenses = Number(budgetSummary?.total_expenses || 0);
    const remainingBudget = Number(budgetSummary?.remaining_budget ?? totalBudget - totalExpenses);
    const usagePercentage = Number(
        budgetSummary?.budget_usage_percentage ??
        (totalBudget > 0 ? (totalExpenses / totalBudget) * 100 : 0)
    );
    const isOverBudget = remainingBudget < 0;

    const categoryData = categories
        .map((category) => {
            const amount = expenses
                .filter(
                    (expense) =>
                        (expense.category_name || expense.category) === category
                )
                .reduce(
                    (total, expense) => total + Number(expense.amount || 0),
                    0
                );
            return {
                category,
                amount,
                percentage:
                    totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
            };
        })
        .filter((item) => item.amount > 0);

    const plannedTotal = expenses
        .filter((expense) => (expense.expense_type || "Planned") === "Planned")
        .reduce((total, expense) => total + Number(expense.amount || 0), 0);

    const actualTotal = expenses
        .filter((expense) => (expense.expense_type || "Planned") === "Actual")
        .reduce((total, expense) => total + Number(expense.amount || 0), 0);

    const normalizeDate = (value) => {
        if (!value) return "";
        const dateString = String(value).trim();
        // Already YYYY-MM-DD
        const isoMatch = dateString.match(/^(\d{4}-\d{2}-\d{2})/);
        if (isoMatch) {
            return isoMatch[1];
        }
        // Handle Flask/MySQL date format:
        // Sat, 03 Oct 2026 00:00:00 GMT
        const parsedDate = new Date(dateString);
        if (Number.isNaN(parsedDate.getTime())) {
            return "";
        }
        const year = parsedDate.getUTCFullYear();
        const month = String(parsedDate.getUTCMonth() + 1).padStart(2, "0");
        const day = String(parsedDate.getUTCDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const spendingByDate = Object.values(
        expenses.reduce((groups, expense) => {
            const key = normalizeDate(expense.expense_date);
            if (!key) {
                return groups;
            }
            if (!groups[key]) {
                groups[key] = {
                    date: key,
                    amount: 0,
                };
            }
            groups[key].amount += Number(expense.amount || 0);
            return groups;
        }, {})
    ).sort((a, b) => a.date.localeCompare(b.date));

    const maxSpending = Math.max(
        ...spendingByDate.map((item) => item.amount),
        0
    );

    const donutGradient = (() => {
        if (!categoryData.length) {
            return "conic-gradient(#E9E7E1 0deg 360deg)";
        }
        let current = 0;
        const stops = categoryData.map((item) => {
            const start = current;
            current += (item.percentage / 100) * 360;
            return `var(--chart-${categoryData.indexOf(item) + 1}) ${start}deg ${current}deg`;
        });
        return `conic-gradient(${stops.join(", ")})`;
    })();

    const handleExpenseChange = (event) => {
        const { name, value } = event.target;
        setExpenseForm((previous) => ({
            ...previous,
            [name]: value,
        }));
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

    const handleSaveExpense = async (event) => {
        event.preventDefault();
        setExpenseError("");

        const expenseName = expenseForm.expense_name.trim();
        const amount = Number(expenseForm.amount);

        if (!expenseName) {
            setExpenseError("Expense name is required.");
            return;
        }
        if (!expenseForm.category) {
            setExpenseError("Please select a category.");
            return;
        }
        if (!expenseForm.amount || amount <= 0) {
            setExpenseError("Amount must be greater than ₹0.");
            return;
        }
        if (!expenseForm.expense_date) {
            setExpenseError("Expense date is required.");
            return;
        }
        if (!expenseForm.expense_type) {
            setExpenseError("Please select an expense type.");
            return;
        }

        try {
            setExpenseLoading(true);
            if (editingExpense) {
                const categoryId = categoryIds[expenseForm.category];
                if (!categoryId) {
                    setExpenseError("Invalid expense category.");
                    return;
                }
                await api.put(`/api/expenses/${editingExpense.id}`, {
                    category_id: categoryId,
                    expense_name: expenseName,
                    amount: amount,
                    expense_date: expenseForm.expense_date,
                    expense_type: expenseForm.expense_type,
                    description: expenseForm.description.trim(),
                });
            } else {
                await api.post(`/api/trips/${tripId}/expenses`, {
                    expense_name: expenseName,
                    category: expenseForm.category,
                    amount: amount,
                    expense_date: expenseForm.expense_date,
                    expense_type: expenseForm.expense_type,
                    description: expenseForm.description.trim(),
                });
            }
            setShowExpenseForm(false);
            setEditingExpense(null);
            resetExpenseForm();
            await loadTripData();
        } catch (err) {
            console.error("FAILED TO SAVE EXPENSE");
            console.error("Status:", err.response?.status);
            console.error("Response:", err.response?.data);
            console.error("Full error:", err);
            setExpenseError(
                err.response?.data?.message ||
                err.response?.data?.error ||
                "Failed to save expense."
            );
        } finally {
            setExpenseLoading(false);
        }
    };

    const getExpenseInputDate = (date) => {
        if (!date) return "";
        const value = String(date);
        if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
            return value.slice(0, 10);
        }
        const parsedDate = new Date(date);
        if (Number.isNaN(parsedDate.getTime())) {
            return "";
        }
        return parsedDate.toISOString().slice(0, 10);
    };

    const handleEditExpense = (expense) => {
        const category = expense.category_name || expense.category || "Travel";
        setEditingExpense(expense);
        setExpenseForm({
            expense_name: expense.expense_name || expense.name || "",
            category,
            amount: expense.amount ?? "",
            expense_date: getExpenseInputDate(expense.expense_date),
            expense_type: expense.expense_type || "Planned",
            description: expense.description || "",
        });
        setExpenseError("");
        setShowExpenseForm(true);
    };

    const handleDeleteExpense = async (expenseId) => {
        const confirmed = window.confirm("Are you sure you want to delete this expense?");
        if (!confirmed) return;
        try {
            setExpenseLoading(true);
            setExpenseError("");
            await api.delete(`/api/expenses/${expenseId}`);
            await loadTripData();
        } catch (err) {
            console.error("FAILED TO DELETE EXPENSE");
            console.error("Status:", err.response?.status);
            console.error("Response:", err.response?.data);
            console.error("Full error:", err);
            setExpenseError(
                err.response?.data?.message ||
                err.response?.data?.error ||
                "Failed to delete expense."
            );
        } finally {
            setExpenseLoading(false);
        }
    };

    if (loading) {
        return (
            <AppLayout>
                <div className="trip-details-page">
                    <div className="trip-details-loading">
                        <div className="loading-spinner">
                            <RefreshCw size={24} />
                        </div>
                        <p>Loading trip details...</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    if (error || !trip) {
        return (
            <AppLayout>
                <div className="trip-details-page">
                    <div className="trip-details-error">
                        <h2>Unable to load trip</h2>
                        <p>{error || "The requested trip could not be found."}</p>
                        <div className="trip-error-actions">
                            <button type="button" onClick={loadTripData} className="trip-retry-button">
                                <RefreshCw size={17} />
                                Try Again
                            </button>
                            <button type="button" onClick={() => navigate("/my-trips")} className="trip-back-button">
                                Back to My Trips
                            </button>
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="trip-details-page">
                {/* HEADER */}
                <header className="trip-details-header">
                    <button type="button" className="trip-details-back" onClick={() => navigate("/my-trips")}>
                        <ArrowLeft size={18} />
                        Back to My Trips
                    </button>
                    <div className="trip-details-heading">
                        <div>
                            <p className="trip-details-eyebrow">TRIP DETAILS</p>
                            <h1>{trip.trip_name}</h1>
                            <p className="trip-details-description">Review your trip plan, expenses and budget.</p>
                        </div>
                        <span className={`trip-status-badge ${trip.status ? trip.status.toLowerCase() : "planned"}`}>
                            {trip.status || "Planned"}
                        </span>
                    </div>
                </header>

                {/* TRIP OVERVIEW */}
                <section className="trip-overview-card">
                    <div className="trip-route-section">
                        <div className="trip-location">
                            <span className="location-label">FROM</span>
                            <div className="location-value">
                                <MapPin size={18} />
                                <strong>{trip.source}</strong>
                            </div>
                        </div>
                        <div className="route-line">
                            <span />
                            <span />
                            <span />
                        </div>
                        <div className="trip-location">
                            <span className="location-label">TO</span>
                            <div className="location-value destination">
                                <MapPin size={18} />
                                <strong>{trip.destination}</strong>
                            </div>
                        </div>
                    </div>
                    <div className="trip-overview-divider" />
                    <div className="trip-meta-grid">
                        <div className="trip-meta-item">
                            <CalendarDays size={19} />
                            <div>
                                <span>TRAVEL DATES</span>
                                <strong>
                                    {formatDate(trip.start_date)}
                                    {" — "}
                                    {formatDate(trip.end_date)}
                                </strong>
                            </div>
                        </div>
                        <div className="trip-meta-item">
                            <Users size={19} />
                            <div>
                                <span>TRAVELERS</span>
                                <strong>
                                    {trip.travelers}{" "}
                                    {Number(trip.travelers) === 1 ? "Traveler" : "Travelers"}
                                </strong>
                            </div>
                        </div>
                    </div>
                </section>

                {/* BUDGET SUMMARY */}
                <section className="budget-summary-section">
                    <div className="section-heading">
                        <div>
                            <p className="section-eyebrow">FINANCIAL OVERVIEW</p>
                            <h2>Budget Summary</h2>
                        </div>
                    </div>
                    <div className="budget-summary-grid">
                        <div className="budget-card">
                            <div className="budget-card-icon">
                                <Wallet size={20} />
                            </div>
                            <span>Total Budget</span>
                            <strong>{formatCurrency(totalBudget)}</strong>
                        </div>
                        <div className="budget-card">
                            <div className="budget-card-icon expenses">
                                <Wallet size={20} />
                            </div>
                            <span>Total Expenses</span>
                            <strong>{formatCurrency(totalExpenses)}</strong>
                        </div>
                        <div className={`budget-card ${isOverBudget ? "over-budget" : "remaining"}`}>
                            <div className="budget-card-icon">
                                <Wallet size={20} />
                            </div>
                            <span>{isOverBudget ? "Over Budget" : "Remaining Budget"}</span>
                            <strong>{formatCurrency(Math.abs(remainingBudget))}</strong>
                        </div>
                    </div>
                    <div className="budget-progress-card">
                        <div className="budget-progress-header">
                            <span>Budget Usage</span>
                            <strong>{usagePercentage.toFixed(2)}%</strong>
                        </div>
                        <div className="budget-progress-track">
                            <div
                                className={`budget-progress-fill ${isOverBudget ? "over-budget" : ""}`}
                                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                            />
                        </div>
                        <div className="budget-progress-footer">
                            <span>{formatCurrency(totalExpenses)} spent</span>
                            <span>{formatCurrency(totalBudget)} budget</span>
                        </div>
                    </div>
                    {isOverBudget && (
                        <div className="budget-warning">
                            <strong>Budget exceeded</strong>
                            <span>
                                You are {formatCurrency(Math.abs(remainingBudget))} over your planned budget.
                            </span>
                        </div>
                    )}
                </section>

                {/* EXPENSES */}
                <section className="expenses-section">
                    <div className="section-heading">
                        <div>
                            <p className="section-eyebrow">SPENDING</p>
                            <h2>Expenses</h2>
                        </div>
                        <button type="button" className="add-expense-button" onClick={openExpenseForm}>
                            + Add Expense
                        </button>
                    </div>
                    <div className="expenses-card">
                        {expenses.length === 0 ? (
                            <div className="expenses-empty">
                                <div className="empty-icon">
                                    <Wallet size={24} />
                                </div>
                                <h3>No expenses yet</h3>
                                <p>Add your first expense to start tracking your trip budget.</p>
                                <button type="button" className="add-expense-empty-button" onClick={openExpenseForm}>
                                    + Add Expense
                                </button>
                            </div>
                        ) : (
                            <div className="expense-list">
                                {expenses.map((expense) => (
                                    <div className="expense-row" key={expense.id}>
                                        <div className="expense-main">
                                            <div className="expense-category-icon">
                                                <Wallet size={18} />
                                            </div>
                                            <div className="expense-information">
                                                <strong>{expense.expense_name || expense.name || "Expense"}</strong>
                                                <span>{expense.category_name || expense.category || "Other"}</span>
                                            </div>
                                        </div>
                                        <div className="expense-date">{formatDate(expense.expense_date)}</div>
                                        <div className="expense-type">{expense.expense_type || "Planned"}</div>
                                        <strong className="expense-amount">{formatCurrency(expense.amount)}</strong>
                                        <div className="expense-actions">
                                            <button
                                                type="button"
                                                title="Edit expense"
                                                onClick={() => handleEditExpense(expense)}
                                                disabled={expenseLoading}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                title="Delete expense"
                                                onClick={() => handleDeleteExpense(expense.id)}
                                                disabled={expenseLoading}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* EXPENSE ANALYTICS */}
                <section className="analytics-section">
                    <div className="section-heading">
                        <div>
                            <p className="section-eyebrow">EXPENSE ANALYTICS</p>
                            <h2>Where your money is going</h2>
                        </div>
                    </div>

                    <div className="analytics-grid">
                        <div className="analytics-card expense-breakdown-card">
                            <div className="analytics-card-heading">
                                <div>
                                    <h3>Expense Breakdown</h3>
                                    <p>Share of your total trip spending.</p>
                                </div>
                            </div>

                            {categoryData.length === 0 ? (
                                <div className="analytics-empty">
                                    Add expenses to see your spending breakdown.
                                </div>
                            ) : (
                                <div className="donut-layout">
                                    <div
                                        className="expense-donut"
                                        style={{ background: donutGradient }}
                                    >
                                        <div className="expense-donut-center">
                                            <strong>{formatCurrency(totalExpenses)}</strong>
                                            <span>Total spent</span>
                                        </div>
                                    </div>

                                    <div className="donut-legend">
                                        {categoryData.map((item, index) => (
                                            <div className="donut-legend-item" key={item.category}>
                                                <span
                                                    className={`chart-dot chart-dot-${index + 1}`}
                                                />
                                                <div>
                                                    <strong>{item.category}</strong>
                                                    <span>{item.percentage.toFixed(1)}%</span>
                                                </div>
                                                <b>{formatCurrency(item.amount)}</b>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="analytics-card planned-actual-card">
                            <div className="analytics-card-heading">
                                <div>
                                    <h3>Planned vs Actual</h3>
                                    <p>Compare expected and recorded spending.</p>
                                </div>
                            </div>

                            {expenses.length === 0 ? (
                                <div className="analytics-empty">
                                    Add planned or actual expenses to compare them.
                                </div>
                            ) : (
                                <div className="planned-actual-content">
                                    <div className="planned-actual-total">
                                        <div>
                                            <span>Planned</span>
                                            <strong>{formatCurrency(plannedTotal)}</strong>
                                        </div>
                                        <div>
                                            <span>Actual</span>
                                            <strong>{formatCurrency(actualTotal)}</strong>
                                        </div>
                                    </div>

                                    <div className="comparison-bars">
                                        <div className="comparison-row">
                                            <div className="comparison-label">
                                                <span>Planned</span>
                                                <strong>{formatCurrency(plannedTotal)}</strong>
                                            </div>
                                            <div className="comparison-track">
                                                <div
                                                    className="comparison-fill planned"
                                                    style={{
                                                        width: `${
                                                            totalExpenses > 0
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
                                                <span>Actual</span>
                                                <strong>{formatCurrency(actualTotal)}</strong>
                                            </div>
                                            <div className="comparison-track">
                                                <div
                                                    className="comparison-fill actual"
                                                    style={{
                                                        width: `${
                                                            totalExpenses > 0
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
                                            {actualTotal > plannedTotal
                                                ? "Actual spending is above your planned expenses."
                                                : actualTotal < plannedTotal
                                                ? "Actual spending is currently below your planned expenses."
                                                : "Planned and actual spending are currently equal."}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="analytics-card spending-trend-card">
                        <div className="analytics-card-heading">
                            <div>
                                <h3>Spending Trend</h3>
                                <p>Daily expense movement during your trip.</p>
                            </div>
                            {spendingByDate.length > 0 && (
                                <span className="trend-total">
                                    {spendingByDate.length} spending day
                                    {spendingByDate.length === 1 ? "" : "s"}
                                </span>
                            )}
                        </div>

                        {spendingByDate.length === 0 ? (
                            <div className="analytics-empty">
                                Add dated expenses to see your spending trend.
                            </div>
                        ) : (
                            <div className="trend-chart">
                                <div className="trend-y-labels">
                                    <span>{formatCurrency(maxSpending)}</span>
                                    <span>{formatCurrency(maxSpending / 2)}</span>
                                    <span>₹0</span>
                                </div>

                                <div className="trend-visual">
                                    <div className="trend-grid-line top" />
                                    <div className="trend-grid-line middle" />
                                    <div className="trend-grid-line bottom" />

                                    <div className="trend-bars">
                                        {spendingByDate.map((item) => {
                                            const height =
                                                maxSpending > 0
                                                    ? Math.max(
                                                          (item.amount / maxSpending) * 100,
                                                          6
                                                      )
                                                    : 0;

                                            return (
                                                <div className="trend-column" key={item.date}>
                                                    <div className="trend-value">
                                                        {formatCurrency(item.amount)}
                                                    </div>
                                                    <div className="trend-bar-track">
                                                        <div
                                                            className="trend-bar"
                                                            style={{ height: `${height}%` }}
                                                        />
                                                    </div>
                                                    <span>{formatDate(item.date)}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* ADD EXPENSE MODAL */}
                {showExpenseForm && (
                    <div
                        className="expense-modal-overlay"
                        onMouseDown={(event) => {
                            if (event.target === event.currentTarget) {
                                closeExpenseForm();
                            }
                        }}
                    >
                        <div className="expense-modal">
                            <div className="expense-modal-header">
                                <div>
                                    <p className="section-eyebrow">
                                        {editingExpense ? "EDIT EXPENSE" : "NEW EXPENSE"}
                                    </p>
                                    <h2>
                                        {editingExpense ? "Edit Expense" : "Add Expense"}
                                    </h2>
                                    <p>
                                        {editingExpense
                                            ? "Update the details of this expense."
                                            : "Add a planned or actual expense to this trip."}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className="expense-modal-close"
                                    onClick={closeExpenseForm}
                                    disabled={expenseLoading}
                                    aria-label="Close"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <form className="expense-form" onSubmit={handleSaveExpense}>
                                <div className="expense-form-group">
                                    <label htmlFor="expense_name">Expense Name</label>
                                    <input
                                        id="expense_name"
                                        name="expense_name"
                                        type="text"
                                        placeholder="e.g. Bus ticket"
                                        value={expenseForm.expense_name}
                                        onChange={handleExpenseChange}
                                        disabled={expenseLoading}
                                    />
                                </div>
                                <div className="expense-form-row">
                                    <div className="expense-form-group">
                                        <label htmlFor="category">Category</label>
                                        <select
                                            id="category"
                                            name="category"
                                            value={expenseForm.category}
                                            onChange={handleExpenseChange}
                                            disabled={expenseLoading}
                                        >
                                            {categories.map((category) => (
                                                <option key={category} value={category}>
                                                    {category}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="expense-form-group">
                                        <label htmlFor="amount">Amount</label>
                                        <div className="amount-input-wrapper">
                                            <span>₹</span>
                                            <input
                                                id="amount"
                                                name="amount"
                                                type="number"
                                                min="0.01"
                                                step="0.01"
                                                placeholder="0.00"
                                                value={expenseForm.amount}
                                                onChange={handleExpenseChange}
                                                disabled={expenseLoading}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="expense-form-row">
                                    <div className="expense-form-group">
                                        <label htmlFor="expense_date">Expense Date</label>
                                        <input
                                            id="expense_date"
                                            name="expense_date"
                                            type="date"
                                            value={expenseForm.expense_date}
                                            onChange={handleExpenseChange}
                                            disabled={expenseLoading}
                                        />
                                    </div>
                                    <div className="expense-form-group">
                                        <label>Expense Type</label>
                                        <div className="expense-type-options">
                                            <label className="radio-option">
                                                <input
                                                    type="radio"
                                                    name="expense_type"
                                                    value="Planned"
                                                    checked={expenseForm.expense_type === "Planned"}
                                                    onChange={handleExpenseChange}
                                                    disabled={expenseLoading}
                                                />
                                                <span>Planned</span>
                                            </label>
                                            <label className="radio-option">
                                                <input
                                                    type="radio"
                                                    name="expense_type"
                                                    value="Actual"
                                                    checked={expenseForm.expense_type === "Actual"}
                                                    onChange={handleExpenseChange}
                                                    disabled={expenseLoading}
                                                />
                                                <span>Actual</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div className="expense-form-group">
                                    <label htmlFor="description">
                                        Description<span> (Optional)</span>
                                    </label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        rows="3"
                                        placeholder="Add any notes about this expense..."
                                        value={expenseForm.description}
                                        onChange={handleExpenseChange}
                                        disabled={expenseLoading}
                                    />
                                </div>
                                {expenseError && (
                                    <div className="expense-form-error">{expenseError}</div>
                                )}
                                <div className="expense-form-actions">
                                    <button
                                        type="button"
                                        className="expense-cancel-button"
                                        onClick={closeExpenseForm}
                                        disabled={expenseLoading}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="expense-submit-button"
                                        disabled={expenseLoading}
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