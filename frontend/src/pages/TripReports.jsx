import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    CalendarDays,
    FileText,
    Printer,
    RefreshCw,
    Users,
    Wallet,
    MapPin,
} from "lucide-react";

import api from "../api/api";
import AppLayout from "../components/AppLayout";
import "../styles/trip-reports.css";

function TripReports() {
    const navigate = useNavigate();

    const [trips, setTrips] = useState([]);
    const [selectedTripId, setSelectedTripId] = useState("");
    const [trip, setTrip] = useState(null);
    const [expenses, setExpenses] = useState([]);
    const [budgetSummary, setBudgetSummary] = useState(null);

    const [loadingTrips, setLoadingTrips] = useState(true);
    const [loadingReport, setLoadingReport] = useState(false);
    const [error, setError] = useState("");

    const categories = [
        "Travel",
        "Hotel",
        "Food",
        "Shopping",
        "Activities",
        "Local Transport",
        "Other",
    ];

    const formatCurrency = (amount) => {
        return `₹${Number(amount || 0).toLocaleString("en-IN", {
            maximumFractionDigits: 0,
        })}`;
    };

    const normalizeDate = (value) => {
        if (!value) return "";

        const dateString = String(value).trim();

        // Already YYYY-MM-DD
        const isoMatch = dateString.match(/^(\d{4}-\d{2}-\d{2})/);

        if (isoMatch) {
            return isoMatch[1];
        }

        const parsedDate = new Date(dateString);

        if (Number.isNaN(parsedDate.getTime())) {
            return "";
        }

        const year = parsedDate.getUTCFullYear();
        const month = String(parsedDate.getUTCMonth() + 1).padStart(2, "0");
        const day = String(parsedDate.getUTCDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };

    const formatDate = (value) => {
        const normalized = normalizeDate(value);

        if (!normalized) return "-";

        const [year, month, day] = normalized.split("-").map(Number);

        const date = new Date(year, month - 1, day);

        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const loadTrips = async () => {
        try {
            setLoadingTrips(true);
            setError("");

            const response = await api.get("/api/trips");

            const tripList = response.data?.trips || [];

            setTrips(tripList);

            if (tripList.length > 0) {
                setSelectedTripId(String(tripList[0].id));
            }
        } catch (err) {
            console.error("Trip Reports Error:", err);
            setError("Unable to load your trips.");
        } finally {
            setLoadingTrips(false);
        }
    };

    const loadReport = async (tripId) => {
        if (!tripId) return;

        try {
            setLoadingReport(true);
            setError("");

            const [
                tripResponse,
                expensesResponse,
                summaryResponse,
            ] = await Promise.all([
                api.get(`/api/trips/${tripId}`),
                api.get(`/api/trips/${tripId}/expenses`),
                api.get(`/api/trips/${tripId}/budget-summary`),
            ]);

            setTrip(tripResponse.data?.trip ?? tripResponse.data);
            setExpenses(expensesResponse.data?.expenses ?? []);
            setBudgetSummary(
                summaryResponse.data?.budget ?? summaryResponse.data
            );
        } catch (err) {
            console.error("Trip Report Load Error:", err);
            setError("Unable to load this trip report.");
        } finally {
            setLoadingReport(false);
        }
    };

    useEffect(() => {
        loadTrips();
    }, []);

    useEffect(() => {
        if (selectedTripId) {
            loadReport(selectedTripId);
        }
    }, [selectedTripId]);

    const totalBudget = Number(trip?.total_budget || 0);

    const totalExpenses = Number(
        budgetSummary?.total_expenses || 0
    );

    const remainingBudget = Number(
        budgetSummary?.remaining_budget ??
            totalBudget - totalExpenses
    );

    const usagePercentage = Number(
        budgetSummary?.budget_usage_percentage ??
            (totalBudget > 0
                ? (totalExpenses / totalBudget) * 100
                : 0)
    );

    const isOverBudget = remainingBudget < 0;

    const plannedTotal = useMemo(() => {
        return expenses
            .filter(
                (expense) =>
                    String(expense.expense_type).toLowerCase() ===
                    "planned"
            )
            .reduce(
                (total, expense) =>
                    total + Number(expense.amount || 0),
                0
            );
    }, [expenses]);

    const actualTotal = useMemo(() => {
        return expenses
            .filter(
                (expense) =>
                    String(expense.expense_type).toLowerCase() ===
                    "actual"
            )
            .reduce(
                (total, expense) =>
                    total + Number(expense.amount || 0),
                0
            );
    }, [expenses]);

    const categoryData = useMemo(() => {
        return categories.map((category) => {
            const amount = expenses
                .filter(
                    (expense) =>
                        (expense.category_name ||
                            expense.category ||
                            "Other") === category
                )
                .reduce(
                    (total, expense) =>
                        total + Number(expense.amount || 0),
                    0
                );

            return {
                category,
                amount,
                percentage:
                    totalExpenses > 0
                        ? (amount / totalExpenses) * 100
                        : 0,
            };
        });
    }, [expenses, totalExpenses]);

    const spendingByDate = useMemo(() => {
        const grouped = {};

        expenses.forEach((expense) => {
            const date = normalizeDate(expense.expense_date);

            if (!date) return;

            if (!grouped[date]) {
                grouped[date] = {
                    date,
                    amount: 0,
                };
            }

            grouped[date].amount += Number(expense.amount || 0);
        });

        return Object.values(grouped).sort((a, b) =>
            a.date.localeCompare(b.date)
        );
    }, [expenses]);

    const maxSpending = Math.max(
        ...spendingByDate.map((item) => item.amount),
        1
    );

    const donutGradient = useMemo(() => {
        const colors = [
            "#2F6B5F",
            "#D99A32",
            "#5C7C89",
            "#9B6A8B",
            "#C76B52",
            "#6E8F5D",
            "#77736B",
        ];

        let current = 0;

        const segments = categoryData
            .filter((item) => item.amount > 0)
            .map((item, index) => {
                const start = current;
                current += item.percentage;

                return `${colors[index % colors.length]} ${start}% ${current}%`;
            });

        if (segments.length === 0) {
            return "#E8E5DE";
        }

        return `conic-gradient(${segments.join(", ")})`;
    }, [categoryData]);

    const handlePrint = () => {
        window.print();
    };

    if (loadingTrips) {
        return (
            <AppLayout>
                <div className="trip-report-loading">
                    <RefreshCw
                        size={24}
                        className="report-loading-icon"
                    />
                    <p>Preparing your trip reports...</p>
                </div>
            </AppLayout>
        );
    }

    if (trips.length === 0) {
        return (
            <AppLayout>
                <div className="trip-report-page">
                    <div className="report-empty">
                        <div className="report-empty-icon">
                            <FileText size={30} />
                        </div>

                        <h2>No trips available</h2>

                        <p>
                            Create a trip first to generate an expense
                            report.
                        </p>

                        <button
                            type="button"
                            onClick={() => navigate("/create-trip")}
                        >
                            + Plan a Trip
                        </button>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="trip-report-page">
                {/* HEADER */}
                <header className="report-page-header no-print">
                    <div>
                        <button
                            type="button"
                            className="report-back-button"
                            onClick={() => navigate("/dashboard")}
                        >
                            <ArrowLeft size={17} />
                            Back to Dashboard
                        </button>

                        <p className="report-eyebrow">
                            TRAVEL BUDGET PRO
                        </p>

                        <h1>Trip Reports</h1>

                        <p>
                            Review your complete trip spending and
                            financial summary.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="print-report-button"
                        onClick={handlePrint}
                        disabled={!trip || loadingReport}
                    >
                        <Printer size={18} />
                        Print / Save PDF
                    </button>
                </header>

                {/* TRIP SELECTOR */}
                <section className="report-selector no-print">
                    <div>
                        <span>Select Trip</span>
                        <strong>
                            Choose a trip to generate its report.
                        </strong>
                    </div>

                    <select
                        value={selectedTripId}
                        onChange={(event) =>
                            setSelectedTripId(event.target.value)
                        }
                    >
                        {trips.map((item) => (
                            <option
                                key={item.id}
                                value={item.id}
                            >
                                {item.trip_name}
                            </option>
                        ))}
                    </select>
                </section>

                {error && (
                    <div className="report-error no-print">
                        {error}
                    </div>
                )}

                {loadingReport ? (
                    <div className="trip-report-loading report-card">
                        <RefreshCw
                            size={22}
                            className="report-loading-icon"
                        />
                        <p>Generating report...</p>
                    </div>
                ) : (
                    trip && (
                        <main className="trip-report-document">
                            {/* REPORT TITLE */}
                            <section className="report-cover">
                                <div className="report-cover-top">
                                    <div>
                                        <p className="report-document-label">
                                            TRIP EXPENSE REPORT
                                        </p>

                                        <h2>{trip.trip_name}</h2>

                                        <p className="report-route">
                                            {trip.source}
                                            <span>→</span>
                                            {trip.destination}
                                        </p>
                                    </div>

                                    <div className="report-status">
                                        {trip.status || "Planned"}
                                    </div>
                                </div>

                                <div className="report-trip-meta">
                                    <div>
                                        <CalendarDays size={18} />

                                        <div>
                                            <span>TRAVEL DATES</span>
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

                                    <div>
                                        <Users size={18} />

                                        <div>
                                            <span>TRAVELERS</span>
                                            <strong>
                                                {trip.travelers}{" "}
                                                {Number(
                                                    trip.travelers
                                                ) === 1
                                                    ? "Traveler"
                                                    : "Travelers"}
                                            </strong>
                                        </div>
                                    </div>

                                    <div>
                                        <Wallet size={18} />

                                        <div>
                                            <span>TOTAL BUDGET</span>
                                            <strong>
                                                {formatCurrency(
                                                    totalBudget
                                                )}
                                            </strong>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* BUDGET SUMMARY */}
                            <section className="report-section">
                                <div className="report-section-heading">
                                    <div>
                                        <span>01</span>
                                        <div>
                                            <p>FINANCIAL OVERVIEW</p>
                                            <h3>Budget Summary</h3>
                                        </div>
                                    </div>
                                </div>

                                <div className="report-summary-grid">
                                    <div className="report-summary-card">
                                        <span>Total Budget</span>
                                        <strong>
                                            {formatCurrency(
                                                totalBudget
                                            )}
                                        </strong>
                                    </div>

                                    <div className="report-summary-card">
                                        <span>Total Expenses</span>
                                        <strong>
                                            {formatCurrency(
                                                totalExpenses
                                            )}
                                        </strong>
                                    </div>

                                    <div
                                        className={`report-summary-card ${
                                            isOverBudget
                                                ? "report-over-budget"
                                                : ""
                                        }`}
                                    >
                                        <span>
                                            {isOverBudget
                                                ? "Over Budget"
                                                : "Remaining"}
                                        </span>

                                        <strong>
                                            {formatCurrency(
                                                Math.abs(
                                                    remainingBudget
                                                )
                                            )}
                                        </strong>
                                    </div>

                                    <div className="report-summary-card">
                                        <span>Budget Used</span>
                                        <strong>
                                            {usagePercentage.toFixed(
                                                1
                                            )}
                                            %
                                        </strong>
                                    </div>
                                </div>

                                <div className="report-budget-progress">
                                    <div className="report-progress-header">
                                        <span>Budget Usage</span>
                                        <strong>
                                            {usagePercentage.toFixed(
                                                1
                                            )}
                                            %
                                        </strong>
                                    </div>

                                    <div className="report-progress-track">
                                        <div
                                            className={
                                                isOverBudget
                                                    ? "over"
                                                    : ""
                                            }
                                            style={{
                                                width: `${Math.min(
                                                    Math.max(
                                                        usagePercentage,
                                                        0
                                                    ),
                                                    100
                                                )}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* ANALYTICS */}
                            <section className="report-section">
                                <div className="report-section-heading">
                                    <div>
                                        <span>02</span>
                                        <div>
                                            <p>EXPENSE ANALYTICS</p>
                                            <h3>Spending Analysis</h3>
                                        </div>
                                    </div>
                                </div>

                                <div className="report-analytics-grid">
                                    {/* DONUT */}
                                    <div className="report-chart-card">
                                        <div className="report-chart-heading">
                                            <div>
                                                <h4>
                                                    Expense Breakdown
                                                </h4>
                                                <p>
                                                    Spending by
                                                    category
                                                </p>
                                            </div>
                                        </div>

                                        <div className="report-donut-wrapper">
                                            <div
                                                className="report-donut"
                                                style={{
                                                    background:
                                                        donutGradient,
                                                }}
                                            >
                                                <div>
                                                    <strong>
                                                        {formatCurrency(
                                                            totalExpenses
                                                        )}
                                                    </strong>
                                                    <span>
                                                        Total
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="report-legend">
                                            {categoryData
                                                .filter(
                                                    (item) =>
                                                        item.amount >
                                                        0
                                                )
                                                .map(
                                                    (
                                                        item,
                                                        index
                                                    ) => (
                                                        <div
                                                            key={
                                                                item.category
                                                            }
                                                        >
                                                            <span
                                                                className={`legend-dot legend-${index}`}
                                                            />
                                                            <span>
                                                                {
                                                                    item.category
                                                                }
                                                            </span>
                                                            <strong>
                                                                {formatCurrency(
                                                                    item.amount
                                                                )}
                                                            </strong>
                                                        </div>
                                                    )
                                                )}
                                        </div>
                                    </div>

                                    {/* PLANNED VS ACTUAL */}
                                    <div className="report-chart-card">
                                        <div className="report-chart-heading">
                                            <div>
                                                <h4>
                                                    Planned vs Actual
                                                </h4>
                                                <p>
                                                    Expected versus
                                                    recorded spending
                                                </p>
                                            </div>
                                        </div>

                                        <div className="planned-actual-report">
                                            <div>
                                                <div className="planned-actual-value">
                                                    <span>
                                                        Planned
                                                    </span>
                                                    <strong>
                                                        {formatCurrency(
                                                            plannedTotal
                                                        )}
                                                    </strong>
                                                </div>

                                                <div className="report-bar-track">
                                                    <div
                                                        className="planned-bar"
                                                        style={{
                                                            width: `${
                                                                Math.max(
                                                                    plannedTotal,
                                                                    actualTotal
                                                                ) > 0
                                                                    ? (plannedTotal /
                                                                          Math.max(
                                                                              plannedTotal,
                                                                              actualTotal
                                                                          )) *
                                                                      100
                                                                    : 0
                                                            }%`,
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <div className="planned-actual-value">
                                                    <span>
                                                        Actual
                                                    </span>
                                                    <strong>
                                                        {formatCurrency(
                                                            actualTotal
                                                        )}
                                                    </strong>
                                                </div>

                                                <div className="report-bar-track">
                                                    <div
                                                        className="actual-bar"
                                                        style={{
                                                            width: `${
                                                                Math.max(
                                                                    plannedTotal,
                                                                    actualTotal
                                                                ) > 0
                                                                    ? (actualTotal /
                                                                          Math.max(
                                                                              plannedTotal,
                                                                              actualTotal
                                                                          )) *
                                                                      100
                                                                    : 0
                                                            }%`,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="report-insight">
                                            {actualTotal >
                                            plannedTotal ? (
                                                <>
                                                    Actual spending is
                                                    above your planned
                                                    expenses.
                                                </>
                                            ) : actualTotal <
                                              plannedTotal ? (
                                                <>
                                                    Actual spending is
                                                    currently below
                                                    your planned
                                                    expenses.
                                                </>
                                            ) : (
                                                <>
                                                    Actual spending
                                                    matches your
                                                    planned expenses.
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* SPENDING TREND */}
                                <div className="report-chart-card report-trend-card">
                                    <div className="report-chart-heading">
                                        <div>
                                            <h4>Spending Trend</h4>
                                            <p>
                                                Daily expense movement
                                                during your trip
                                            </p>
                                        </div>

                                        <span className="trend-days">
                                            {
                                                spendingByDate.length
                                            }{" "}
                                            spending{" "}
                                            {spendingByDate.length ===
                                            1
                                                ? "day"
                                                : "days"}
                                        </span>
                                    </div>

                                    {spendingByDate.length === 0 ? (
                                        <div className="trend-empty">
                                            No expense data available.
                                        </div>
                                    ) : (
                                        <div className="report-trend-chart">
                                            <div className="trend-grid-line top">
                                                {formatCurrency(
                                                    maxSpending
                                                )}
                                            </div>

                                            <div className="trend-grid-line middle">
                                                {formatCurrency(
                                                    maxSpending / 2
                                                )}
                                            </div>

                                            <div className="trend-grid-line bottom">
                                                ₹0
                                            </div>

                                            <div className="trend-bars">
                                                {spendingByDate.map(
                                                    (item) => {
                                                        const height =
                                                            (item.amount /
                                                                maxSpending) *
                                                            100;

                                                        return (
                                                            <div
                                                                className="trend-bar-column"
                                                                key={
                                                                    item.date
                                                                }
                                                            >
                                                                <strong>
                                                                    {formatCurrency(
                                                                        item.amount
                                                                    )}
                                                                </strong>

                                                                <div className="trend-bar-area">
                                                                    <div
                                                                        className="trend-bar"
                                                                        style={{
                                                                            height: `${Math.max(
                                                                                height,
                                                                                4
                                                                            )}%`,
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
                                    )}
                                </div>
                            </section>

                            {/* EXPENSE TABLE */}
                            <section className="report-section">
                                <div className="report-section-heading">
                                    <div>
                                        <span>03</span>
                                        <div>
                                            <p>TRANSACTION RECORD</p>
                                            <h3>Expense Details</h3>
                                        </div>
                                    </div>

                                    <strong className="expense-count">
                                        {expenses.length}{" "}
                                        {expenses.length === 1
                                            ? "expense"
                                            : "expenses"}
                                    </strong>
                                </div>

                                {expenses.length === 0 ? (
                                    <div className="report-no-expenses">
                                        No expenses have been recorded
                                        for this trip.
                                    </div>
                                ) : (
                                    <div className="report-expense-table-wrapper">
                                        <table className="report-expense-table">
                                            <thead>
                                                <tr>
                                                    <th>Date</th>
                                                    <th>Expense</th>
                                                    <th>Category</th>
                                                    <th>Type</th>
                                                    <th>Amount</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {expenses.map(
                                                    (expense) => (
                                                        <tr
                                                            key={
                                                                expense.id
                                                            }
                                                        >
                                                            <td>
                                                                {formatDate(
                                                                    expense.expense_date
                                                                )}
                                                            </td>

                                                            <td>
                                                                <strong>
                                                                    {expense.expense_name ||
                                                                        expense.name ||
                                                                        "Expense"}
                                                                </strong>
                                                            </td>

                                                            <td>
                                                                {expense.category_name ||
                                                                    expense.category ||
                                                                    "Other"}
                                                            </td>

                                                            <td>
                                                                <span
                                                                    className={`expense-type-badge ${
                                                                        String(
                                                                            expense.expense_type
                                                                        ).toLowerCase() ===
                                                                        "actual"
                                                                            ? "actual"
                                                                            : "planned"
                                                                    }`}
                                                                >
                                                                    {
                                                                        expense.expense_type
                                                                    }
                                                                </span>
                                                            </td>

                                                            <td>
                                                                <strong>
                                                                    {formatCurrency(
                                                                        expense.amount
                                                                    )}
                                                                </strong>
                                                            </td>
                                                        </tr>
                                                    )
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </section>

                            {/* FINAL SUMMARY */}
                            <section className="report-final-summary">
                                <div>
                                    <p>REPORT SUMMARY</p>

                                    <h3>
                                        {isOverBudget
                                            ? "Budget exceeded"
                                            : "Within budget"}
                                    </h3>

                                    <span>
                                        {isOverBudget
                                            ? `You exceeded your planned budget by ${formatCurrency(
                                                  Math.abs(
                                                      remainingBudget
                                                  )
                                              )}.`
                                            : `You have ${formatCurrency(
                                                  remainingBudget
                                              )} remaining from your planned budget.`}
                                    </span>
                                </div>

                                <div className="report-final-total">
                                    <span>Total Spent</span>
                                    <strong>
                                        {formatCurrency(
                                            totalExpenses
                                        )}
                                    </strong>
                                </div>
                            </section>

                            <footer className="report-footer">
                                <span>
                                    Travel Budget Pro
                                </span>

                                <span>
                                    Plan trips without financial
                                    surprises.
                                </span>
                            </footer>
                        </main>
                    )
                )}
            </div>
        </AppLayout>
    );
}

export default TripReports;