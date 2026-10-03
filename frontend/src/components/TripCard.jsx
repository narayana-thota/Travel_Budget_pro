import {
    ArrowUpRight,
    CalendarDays,
    MapPin,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import BudgetProgress from "./BudgetProgress";

function formatCurrency(value) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(Number(value) || 0);
}

function formatShortDate(value) {
    if (!value) {
        return "";
    }

    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
    }).format(date);
}

function TripCard({ trip, summary }) {
    const navigate = useNavigate();

    const budget = Number(trip?.total_budget) || 0;

    const spent = Number(
        summary?.total_expenses ??
        summary?.total_spent ??
        summary?.planned_expenses ??
        summary?.total_planned ??
        0
    );

    const percentage =
        budget > 0 ? (spent / budget) * 100 : 0;

    return (
        <article className="trip-card">
            <div className="trip-card-top">
                <div className="trip-card-icon">
                    <MapPin size={18} />
                </div>

                <span
                    className={`trip-status-badge ${
                        trip.status?.toLowerCase() || "planned"
                    }`}
                >
                    {trip.status || "Planned"}
                </span>
            </div>

            <div className="trip-card-main">
                <h3>{trip.trip_name}</h3>

                <div className="trip-card-route">
                    <span>{trip.source}</span>
                    <span className="trip-card-arrow">→</span>
                    <span>{trip.destination}</span>
                </div>

                <div className="trip-card-date">
                    <CalendarDays size={15} />

                    <span>
                        {formatShortDate(trip.start_date)}
                        {" — "}
                        {formatShortDate(trip.end_date)}
                    </span>
                </div>
            </div>

            <div className="trip-card-budget">
                <div>
                    <span>Budget</span>
                    <strong>{formatCurrency(budget)}</strong>
                </div>

                <BudgetProgress
                    percentage={percentage}
                    showPercentage={false}
                    compact
                />

                <div className="trip-card-progress-label">
                    <span>
                        {Math.min(
                            Math.max(percentage, 0),
                            100
                        ).toFixed(0)}
                        % used
                    </span>

                    <span>
                        {formatCurrency(spent)} spent
                    </span>
                </div>
            </div>

            <button
                type="button"
                className="trip-card-open"
                onClick={() =>
                    navigate(`/trip/${trip.id}`)
                }
            >
                Open Trip
                <ArrowUpRight size={16} />
            </button>
        </article>
    );
}

export default TripCard;