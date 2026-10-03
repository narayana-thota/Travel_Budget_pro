import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    Search,
    Plus,
    CalendarDays,
    Users,
    Wallet,
    ArrowRight,
    RefreshCw,
    MapPin,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import api from "../api/api";
import AppLayout from "../components/AppLayout";

import "../styles/my-trips.css";


function MyTrips() {
    const navigate = useNavigate();

    const [trips, setTrips] = useState([]);
    const [tripSummaries, setTripSummaries] = useState({});

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");


    /* =========================================
       LOAD TRIPS
    ========================================= */

    const loadTrips = useCallback(async (showRefreshState = false) => {
        try {
            if (showRefreshState) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const response = await api.get("/api/trips");

            const receivedTrips = Array.isArray(
                response.data?.trips
            )
                ? response.data.trips
                : Array.isArray(response.data)
                ? response.data
                : [];


            setTrips(receivedTrips);


            /* =========================================
               LOAD BUDGET SUMMARIES
            ========================================= */

            if (receivedTrips.length === 0) {
                setTripSummaries({});
                return;
            }


            const summaryEntries = await Promise.all(
                receivedTrips.map(async (trip) => {
                    try {
                        const summaryResponse = await api.get(
                            `/api/trips/${trip.id}/budget-summary`
                        );

                        /*
                         * IMPORTANT:
                         * Backend returns budget, not summary.
                         */

                        const summary =
                            summaryResponse.data?.budget ??
                            summaryResponse.data ??
                            {};

                        return [
                            trip.id,
                            summary,
                        ];

                    } catch (summaryError) {
                        console.error(
                            `SUMMARY ERROR FOR TRIP ${trip.id}:`,
                            summaryError
                        );

                        return [
                            trip.id,
                            {},
                        ];
                    }
                })
            );


            setTripSummaries(
                Object.fromEntries(summaryEntries)
            );

        } catch (err) {
            console.error(
                "MY TRIPS ERROR:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Unable to load your trips. Please try again."
            );

        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);


    /* =========================================
       INITIAL LOAD
    ========================================= */

    useEffect(() => {
        loadTrips();
    }, [loadTrips]);


    /* =========================================
       REFRESH WHEN USER RETURNS TO PAGE
    ========================================= */

    useEffect(() => {
        const handleWindowFocus = () => {
            loadTrips(true);
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                loadTrips(true);
            }
        };


        window.addEventListener(
            "focus",
            handleWindowFocus
        );

        document.addEventListener(
            "visibilitychange",
            handleVisibilityChange
        );


        return () => {
            window.removeEventListener(
                "focus",
                handleWindowFocus
            );

            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange
            );
        };
    }, [loadTrips]);


    /* =========================================
       SEARCH + FILTER
    ========================================= */

    const filteredTrips = useMemo(() => {
        return trips.filter((trip) => {
            const searchText =
                search.trim().toLowerCase();


            const matchesSearch =
                !searchText ||
                trip.trip_name
                    ?.toLowerCase()
                    .includes(searchText) ||
                trip.source
                    ?.toLowerCase()
                    .includes(searchText) ||
                trip.destination
                    ?.toLowerCase()
                    .includes(searchText);


            const matchesStatus =
                statusFilter === "All" ||
                trip.status?.toLowerCase() ===
                    statusFilter.toLowerCase();


            return (
                matchesSearch &&
                matchesStatus
            );
        });
    }, [
        trips,
        search,
        statusFilter,
    ]);


    /* =========================================
       STATISTICS
    ========================================= */

    const statistics = useMemo(() => {
        const totalBudget = trips.reduce(
            (total, trip) =>
                total +
                Number(
                    trip.total_budget || 0
                ),
            0
        );


        const plannedTrips = trips.filter(
            (trip) =>
                String(trip.status || "")
                    .toLowerCase() ===
                "planned"
        ).length;


        return {
            totalTrips: trips.length,
            plannedTrips,
            totalBudget,
        };
    }, [trips]);


    /* =========================================
       FORMATTERS
    ========================================= */

    function formatCurrency(value) {
        return `₹${Number(
            value || 0
        ).toLocaleString("en-IN")}`;
    }


    function formatDate(date) {
        if (!date) {
            return "—";
        }


        /*
         * Handle YYYY-MM-DD safely.
         */

        if (
            typeof date === "string" &&
            /^\d{4}-\d{2}-\d{2}$/.test(date)
        ) {
            const [year, month, day] =
                date.split("-").map(Number);

            const parsedDate = new Date(
                year,
                month - 1,
                day
            );

            return parsedDate.toLocaleDateString(
                "en-IN",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                }
            );
        }


        const parsedDate = new Date(date);


        if (
            Number.isNaN(
                parsedDate.getTime()
            )
        ) {
            return "—";
        }


        return parsedDate.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );
    }


    /* =========================================
       SUMMARY HELPERS
    ========================================= */

    function getSummary(tripId) {
        return tripSummaries[tripId] || {};
    }


    function getTotalExpenses(tripId) {
        const summary = getSummary(tripId);


        return Number(
            summary.total_expenses ??
            summary.total_spent ??
            0
        );
    }


    function getRemainingBudget(trip) {
        const summary =
            getSummary(trip.id);


        if (
            summary.remaining_budget !==
            undefined
        ) {
            return Number(
                summary.remaining_budget
            );
        }


        return (
            Number(
                trip.total_budget || 0
            ) -
            getTotalExpenses(trip.id)
        );
    }


    function getUsagePercentage(trip) {
        const budget = Number(
            trip.total_budget || 0
        );


        if (budget <= 0) {
            return 0;
        }


        const spent =
            getTotalExpenses(trip.id);


        return Math.min(
            (spent / budget) * 100,
            100
        );
    }


    function getStatusClass(status) {
        return String(
            status || "Planned"
        )
            .toLowerCase()
            .replace(/\s+/g, "-");
    }


    /* =========================================
       UI
    ========================================= */

    return (
        <AppLayout>
            <div className="my-trips-page">

                {/* =================================
                    PAGE HEADER
                ================================= */}

                <header className="my-trips-header">

                    <div>
                        <p className="my-trips-eyebrow">
                            YOUR JOURNEYS
                        </p>

                        <h1>
                            My Trips
                        </h1>

                        <p className="my-trips-description">
                            Manage your trips, budgets
                            and travel expenses in one place.
                        </p>
                    </div>


                    <div
                        style={{
                            display: "flex",
                            gap: "10px",
                            alignItems: "center",
                        }}
                    >

                        <button
                            className="plan-trip-button"
                            type="button"
                            onClick={() =>
                                loadTrips(true)
                            }
                            disabled={refreshing}
                        >
                            <RefreshCw
                                size={17}
                                className={
                                    refreshing
                                        ? "refresh-spinning"
                                        : ""
                                }
                            />

                            {refreshing
                                ? "Refreshing..."
                                : "Refresh"}
                        </button>


                        <button
                            className="plan-trip-button"
                            type="button"
                            onClick={() =>
                                navigate("/create-trip")
                            }
                        >
                            <Plus size={18} />

                            Plan Trip
                        </button>

                    </div>

                </header>


                {/* =================================
                    STATISTICS
                ================================= */}

                <section className="trip-statistics">

                    <div className="trip-stat-card">

                        <div className="trip-stat-icon">
                            <MapPin size={19} />
                        </div>

                        <div>
                            <span>
                                Total Trips
                            </span>

                            <strong>
                                {statistics.totalTrips}
                            </strong>
                        </div>

                    </div>


                    <div className="trip-stat-card">

                        <div className="trip-stat-icon">
                            <CalendarDays size={19} />
                        </div>

                        <div>
                            <span>
                                Planned Trips
                            </span>

                            <strong>
                                {statistics.plannedTrips}
                            </strong>
                        </div>

                    </div>


                    <div className="trip-stat-card">

                        <div className="trip-stat-icon">
                            <Wallet size={19} />
                        </div>

                        <div>
                            <span>
                                Total Budget
                            </span>

                            <strong>
                                {formatCurrency(
                                    statistics.totalBudget
                                )}
                            </strong>
                        </div>

                    </div>

                </section>


                {/* =================================
                    SEARCH + FILTER
                ================================= */}

                <section className="trip-controls">

                    <div className="trip-search">

                        <Search size={19} />

                        <input
                            type="text"
                            placeholder="Search by trip name or destination..."
                            value={search}
                            onChange={(event) =>
                                setSearch(
                                    event.target.value
                                )
                            }
                        />

                    </div>


                    <select
                        className="trip-status-filter"
                        value={statusFilter}
                        onChange={(event) =>
                            setStatusFilter(
                                event.target.value
                            )
                        }
                    >
                        <option value="All">
                            All Trips
                        </option>

                        <option value="Planned">
                            Planned
                        </option>

                        <option value="Ongoing">
                            Ongoing
                        </option>

                        <option value="Completed">
                            Completed
                        </option>
                    </select>

                </section>


                {/* =================================
                    LOADING
                ================================= */}

                {loading && (
                    <div className="trip-grid">

                        {[1, 2, 3].map(
                            (item) => (
                                <div
                                    className="trip-card trip-card-skeleton"
                                    key={item}
                                >
                                    <div className="skeleton-line skeleton-title" />

                                    <div className="skeleton-line skeleton-route" />

                                    <div className="skeleton-line" />

                                    <div className="skeleton-line short" />

                                    <div className="skeleton-progress" />

                                    <div className="skeleton-button" />
                                </div>
                            )
                        )}

                    </div>
                )}


                {/* =================================
                    ERROR
                ================================= */}

                {!loading && error && (
                    <div className="trips-message error-message">

                        <h2>
                            Unable to load your trips
                        </h2>

                        <p>
                            {error}
                        </p>

                        <button
                            type="button"
                            onClick={() =>
                                loadTrips(true)
                            }
                            className="retry-button"
                        >
                            <RefreshCw size={17} />

                            Try Again
                        </button>

                    </div>
                )}


                {/* =================================
                    EMPTY
                ================================= */}

                {!loading &&
                    !error &&
                    trips.length === 0 && (

                        <div className="trips-message empty-message">

                            <div className="empty-trip-icon">
                                <MapPin size={30} />
                            </div>

                            <h2>
                                No trips yet
                            </h2>

                            <p>
                                Start planning your first
                                trip and keep your travel
                                spending under control.
                            </p>

                            <button
                                type="button"
                                className="plan-trip-button"
                                onClick={() =>
                                    navigate(
                                        "/create-trip"
                                    )
                                }
                            >
                                <Plus size={18} />

                                Plan Your First Trip
                            </button>

                        </div>
                    )}


                {/* =================================
                    NO SEARCH RESULTS
                ================================= */}

                {!loading &&
                    !error &&
                    trips.length > 0 &&
                    filteredTrips.length === 0 && (

                        <div className="trips-message empty-message">

                            <div className="empty-trip-icon">
                                <Search size={28} />
                            </div>

                            <h2>
                                No matching trips
                            </h2>

                            <p>
                                Try changing your search
                                or status filter.
                            </p>

                        </div>
                    )}


                {/* =================================
                    TRIP GRID
                ================================= */}

                {!loading &&
                    !error &&
                    filteredTrips.length > 0 && (

                        <section className="trip-grid">

                            {filteredTrips.map(
                                (trip) => {

                                    const spent =
                                        getTotalExpenses(
                                            trip.id
                                        );

                                    const remaining =
                                        getRemainingBudget(
                                            trip
                                        );

                                    const usage =
                                        getUsagePercentage(
                                            trip
                                        );


                                    return (
                                        <article
                                            className="trip-card"
                                            key={trip.id}
                                        >

                                            <div className="trip-card-top">

                                                <div>
                                                    <p className="trip-card-label">
                                                        TRIP
                                                    </p>

                                                    <h2>
                                                        {trip.trip_name}
                                                    </h2>
                                                </div>


                                                <span
                                                    className={`trip-status ${getStatusClass(
                                                        trip.status
                                                    )}`}
                                                >
                                                    {trip.status ||
                                                        "Planned"}
                                                </span>

                                            </div>


                                            <div className="trip-route">

                                                <span>
                                                    {trip.source}
                                                </span>

                                                <ArrowRight
                                                    size={17}
                                                />

                                                <span>
                                                    {trip.destination}
                                                </span>

                                            </div>


                                            <div className="trip-meta">

                                                <div>
                                                    <CalendarDays
                                                        size={16}
                                                    />

                                                    <span>
                                                        {formatDate(
                                                            trip.start_date
                                                        )}
                                                        {" — "}
                                                        {formatDate(
                                                            trip.end_date
                                                        )}
                                                    </span>
                                                </div>


                                                <div>
                                                    <Users
                                                        size={16}
                                                    />

                                                    <span>
                                                        {trip.travelers}{" "}
                                                        {Number(
                                                            trip.travelers
                                                        ) === 1
                                                            ? "Traveler"
                                                            : "Travelers"}
                                                    </span>
                                                </div>

                                            </div>


                                            <div className="trip-card-divider" />


                                            <div className="trip-financials">

                                                <div>
                                                    <span>
                                                        Budget
                                                    </span>

                                                    <strong>
                                                        {formatCurrency(
                                                            trip.total_budget
                                                        )}
                                                    </strong>
                                                </div>


                                                <div>
                                                    <span>
                                                        Spent
                                                    </span>

                                                    <strong>
                                                        {formatCurrency(
                                                            spent
                                                        )}
                                                    </strong>
                                                </div>

                                            </div>


                                            <div className="trip-progress-section">

                                                <div className="trip-progress-header">

                                                    <span>
                                                        Budget used
                                                    </span>

                                                    <strong>
                                                        {usage.toFixed(0)}%
                                                    </strong>

                                                </div>


                                                <div className="trip-progress">

                                                    <div
                                                        className="trip-progress-fill"
                                                        style={{
                                                            width: `${usage}%`,
                                                        }}
                                                    />

                                                </div>

                                            </div>


                                            <div className="trip-card-footer">

                                                <div>
                                                    <span>
                                                        Remaining
                                                    </span>

                                                    <strong
                                                        className={
                                                            remaining < 0
                                                                ? "over-budget"
                                                                : ""
                                                        }
                                                    >
                                                        {formatCurrency(
                                                            remaining
                                                        )}
                                                    </strong>
                                                </div>


                                                <button
                                                    type="button"
                                                    className="view-trip-button"
                                                    onClick={() =>
                                                        navigate(
                                                            `/trip/${trip.id}`
                                                        )
                                                    }
                                                >
                                                    View Trip

                                                    <ArrowRight
                                                        size={16}
                                                    />
                                                </button>

                                            </div>

                                        </article>
                                    );
                                }
                            )}

                        </section>
                    )}

            </div>
        </AppLayout>
    );
}


export default MyTrips;