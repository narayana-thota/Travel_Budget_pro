import {
    ArrowUpRight,
    CalendarDays,
    MapPin,
    Users,
    AlertTriangle,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import BudgetProgress from "./BudgetProgress";


/* =========================================================
   FORMAT CURRENCY
========================================================= */

function formatCurrency(value) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(Number(value) || 0);
}


/* =========================================================
   NORMALIZE DATE
========================================================= */

function normalizeDate(dateValue) {
    if (!dateValue) {
        return "";
    }

    const value = String(dateValue).trim();

    /*
        Already in YYYY-MM-DD format
    */
    const isoMatch = value.match(/^(\d{4}-\d{2}-\d{2})/);

    if (isoMatch) {
        return isoMatch[1];
    }

    /*
        Handle Flask/MySQL date format:

        Sat, 03 Oct 2026 00:00:00 GMT
    */
    const parsedDate = new Date(value);

    if (Number.isNaN(parsedDate.getTime())) {
        return "";
    }

    const year = parsedDate.getUTCFullYear();

    const month = String(
        parsedDate.getUTCMonth() + 1
    ).padStart(2, "0");

    const day = String(
        parsedDate.getUTCDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


/* =========================================================
   FORMAT SINGLE DATE
========================================================= */

function formatDate(dateValue) {
    const normalizedDate = normalizeDate(dateValue);

    if (!normalizedDate) {
        return "";
    }

    const [year, month, day] = normalizedDate
        .split("-")
        .map(Number);

    const date = new Date(
        year,
        month - 1,
        day
    );

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(date);
}


/* =========================================================
   FORMAT DATE RANGE
========================================================= */

function formatDateRange(startDate, endDate) {
    const start = formatDate(startDate);
    const end = formatDate(endDate);

    /*
        If one of the dates is missing,
        don't show "Dates unavailable".
        Show whichever date is available.
    */

    if (!start && !end) {
        return "Dates unavailable";
    }

    if (!start) {
        return end;
    }

    if (!end) {
        return start;
    }

    const startParts = start.split(" ");
    const endParts = end.split(" ");

    /*
        Example:

        3 Oct 2026 — 8 Oct 2026

        becomes:

        3 Oct — 8 Oct 2026
    */

    if (
        startParts.length === 3 &&
        endParts.length === 3 &&
        startParts[2] === endParts[2]
    ) {
        return `${startParts[0]} ${startParts[1]} — ${endParts[0]} ${endParts[1]} ${endParts[2]}`;
    }

    return `${start} — ${end}`;
}


/* =========================================================
   NEXT TRIP CARD
========================================================= */

function NextTripCard({ trip, summary }) {
    const navigate = useNavigate();

    const budget =
        Number(trip?.total_budget) || 0;


    /* =====================================================
       SPENT
    ===================================================== */

    const spent = Number(
        summary?.total_expenses ??
        summary?.total_spent ??
        summary?.planned_expenses ??
        summary?.total_planned ??
        0
    );


    /* =====================================================
       REMAINING
    ===================================================== */

    const remaining = Number(
        summary?.remaining_budget ??
        Math.max(budget - spent, 0)
    );


    /* =====================================================
       BUDGET PERCENTAGE
    ===================================================== */

    const rawPercentage = Number(
        summary?.budget_usage_percentage ??
        summary?.usage_percentage ??
        summary?.budget_used_percentage ??
        (
            budget > 0
                ? (spent / budget) * 100
                : 0
        )
    );

    const percentage = Math.max(
        rawPercentage,
        0
    );


    /* =====================================================
       OVER BUDGET
    ===================================================== */

    const isOverBudget =
        spent > budget &&
        budget > 0;


    /* =====================================================
       RENDER
    ===================================================== */

    return (
        <section className="next-trip-card">

            <div className="next-trip-accent" />


            <div className="next-trip-content">


                {/* =================================================
                   TOP
                ================================================= */}

                <div className="next-trip-top">

                    <div>

                        <span className="section-eyebrow">
                            YOUR NEXT TRIP
                        </span>

                        <h2>
                            {trip?.trip_name}
                        </h2>

                    </div>


                    <div
                        className={`trip-status-badge ${
                            trip?.status?.toLowerCase() ||
                            "planned"
                        }`}
                    >
                        {trip?.status || "Planned"}
                    </div>

                </div>


                {/* =================================================
                   ROUTE
                ================================================= */}

                <div className="next-trip-route">

                    <div className="route-location">

                        <MapPin size={17} />

                        <span>
                            {trip?.source}
                        </span>

                    </div>


                    <span className="route-arrow">
                        →
                    </span>


                    <div className="route-location destination">

                        <MapPin size={17} />

                        <span>
                            {trip?.destination}
                        </span>

                    </div>

                </div>


                {/* =================================================
                   TRIP META
                ================================================= */}

                <div className="next-trip-meta">

                    <div>

                        <CalendarDays size={16} />

                        <span>
                            {formatDateRange(
                                trip?.start_date,
                                trip?.end_date
                            )}
                        </span>

                    </div>


                    <div>

                        <Users size={16} />

                        <span>

                            {trip?.travelers}{" "}

                            {Number(trip?.travelers) === 1
                                ? "Traveler"
                                : "Travelers"}

                        </span>

                    </div>

                </div>


                {/* =================================================
                   BUDGET
                ================================================= */}

                <div className="next-trip-budget">


                    <div className="next-trip-budget-heading">

                        <span>
                            Budget
                        </span>

                        <strong>
                            {formatCurrency(budget)}
                        </strong>

                    </div>


                    <BudgetProgress
                        percentage={percentage}
                    />


                    {/* =================================================
                       FINANCIALS
                    ================================================= */}

                    <div className="next-trip-financials">

                        <div>

                            <span>
                                Spent
                            </span>

                            <strong>
                                {formatCurrency(spent)}
                            </strong>

                        </div>


                        <div>

                            <span>
                                {isOverBudget
                                    ? "Over budget"
                                    : "Remaining"}
                            </span>


                            <strong
                                className={
                                    isOverBudget
                                        ? "amount-danger"
                                        : ""
                                }
                            >

                                {isOverBudget
                                    ? formatCurrency(
                                          spent - budget
                                      )
                                    : formatCurrency(
                                          remaining
                                      )}

                            </strong>

                        </div>

                    </div>


                    {/* =================================================
                       WARNING
                    ================================================= */}

                    {isOverBudget && (

                        <div className="budget-warning">

                            <AlertTriangle size={16} />

                            <span>
                                Budget exceeded for this trip.
                            </span>

                        </div>

                    )}

                </div>


                {/* =================================================
                   FOOTER
                ================================================= */}

                <div className="next-trip-footer">

                    <span className="next-trip-motto">
                        Plan smart. Travel freely.
                    </span>


                    <button
                        type="button"
                        className="open-trip-button"
                        onClick={() =>
                            navigate(
                                `/trip/${trip.id}`
                            )
                        }
                    >

                        Open Trip

                        <ArrowUpRight size={17} />

                    </button>

                </div>

            </div>

        </section>
    );
}


export default NextTripCard;