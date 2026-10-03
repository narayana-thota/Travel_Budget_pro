import { useCallback, useEffect, useMemo, useState } from "react";

import {
    Wallet,
    Map,
    TrendingUp,
    Plus,
    ArrowRight,
    Compass,
    RefreshCw,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import api from "../api/api";

import AppLayout from "../components/AppLayout";
import SummaryCard from "../components/SummaryCard";
import NextTripCard from "../components/NextTripCard";
import TripCard from "../components/TripCard";

import "../styles/dashboard.css";


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
   GREETING
========================================================= */

function getGreeting() {
    const hour = new Date().getHours();

    if (hour < 12) {
        return "Good morning";
    }

    if (hour < 17) {
        return "Good afternoon";
    }

    return "Good evening";
}


/* =========================================================
   NORMALIZE DATE
========================================================= */

function normalizeDate(value) {
    if (!value) {
        return "";
    }

    const dateString = String(value).trim();

    /*
       Already YYYY-MM-DD
    */

    const isoMatch = dateString.match(/^(\d{4}-\d{2}-\d{2})/);

    if (isoMatch) {
        return isoMatch[1];
    }

    /*
       Handle Flask/MySQL format:

       Sat, 03 Oct 2026 00:00:00 GMT
    */

    const parsedDate = new Date(dateString);

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
   GET TRIP DATE
========================================================= */

function getTripDate(trip) {
    const normalizedDate = normalizeDate(
        trip?.start_date
    );

    if (!normalizedDate) {
        return Number.MAX_SAFE_INTEGER;
    }

    const [year, month, day] = normalizedDate
        .split("-")
        .map(Number);

    const date = new Date(
        year,
        month - 1,
        day
    );

    return Number.isNaN(date.getTime())
        ? Number.MAX_SAFE_INTEGER
        : date.getTime();
}


/* =========================================================
   TODAY AT MIDNIGHT
========================================================= */

function getTodayAtMidnight() {
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    return today.getTime();
}


/* =========================================================
   DASHBOARD SKELETON
========================================================= */

function DashboardSkeleton() {
    return (
        <div className="dashboard-skeleton">

            <div className="skeleton-heading">
                <div className="skeleton skeleton-title" />
                <div className="skeleton skeleton-subtitle" />
            </div>


            <div className="skeleton-summary-grid">

                {[1, 2, 3].map((item) => (
                    <div
                        className="skeleton-card"
                        key={item}
                    >
                        <div className="skeleton skeleton-small" />
                        <div className="skeleton skeleton-large" />
                        <div className="skeleton skeleton-medium" />
                    </div>
                ))}

            </div>


            <div className="skeleton-hero">
                <div className="skeleton skeleton-small" />
                <div className="skeleton skeleton-hero-title" />
                <div className="skeleton skeleton-medium" />
                <div className="skeleton skeleton-progress" />
            </div>


            <div className="skeleton-trip-grid">

                {[1, 2, 3].map((item) => (
                    <div
                        className="skeleton-trip-card"
                        key={item}
                    >
                        <div className="skeleton skeleton-small" />
                        <div className="skeleton skeleton-medium" />
                        <div className="skeleton skeleton-line" />
                        <div className="skeleton skeleton-progress" />
                    </div>
                ))}

            </div>

        </div>
    );
}


/* =========================================================
   EMPTY STATE
========================================================= */

function DashboardEmptyState({
    onCreateTrip,
}) {
    return (
        <section className="dashboard-empty-state">

            <div className="empty-state-icon">
                <Compass
                    size={32}
                    strokeWidth={1.6}
                />
            </div>

            <span className="section-eyebrow">
                YOUR JOURNEY STARTS HERE
            </span>

            <h2>
                Your first trip starts here.
            </h2>

            <p>
                Create a trip, set your budget, and keep every
                expense under control.
            </p>

            <button
                type="button"
                className="primary-button empty-state-button"
                onClick={onCreateTrip}
            >
                <Plus size={18} />
                Plan Your First Trip
            </button>

        </section>
    );
}


/* =========================================================
   DASHBOARD
========================================================= */

function Dashboard() {

    const navigate = useNavigate();

    const { user } = useAuth();


    /* =====================================================
       STATE
    ===================================================== */

    const [trips, setTrips] = useState([]);

    const [tripSummaries, setTripSummaries] = useState({});

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");


    /* =====================================================
       FETCH DASHBOARD DATA
    ===================================================== */

    const fetchDashboardData = useCallback(
        async (showLoader = true) => {

            try {

                if (showLoader) {
                    setLoading(true);
                }

                setError("");


                /*
                   STEP 1
                   Get all trips belonging to
                   the logged-in user.
                */

                const tripsResponse = await api.get(
                    "/api/trips"
                );


                const receivedTrips = Array.isArray(
                    tripsResponse.data?.trips
                )
                    ? tripsResponse.data.trips
                    : Array.isArray(
                          tripsResponse.data
                      )
                    ? tripsResponse.data
                    : [];


                setTrips(receivedTrips);


                /*
                   No trips
                */

                if (receivedTrips.length === 0) {

                    setTripSummaries({});

                    return;
                }


                /*
                   STEP 2
                   Get the latest budget summary
                   for every trip.

                   IMPORTANT:
                   Backend returns:

                   {
                       status: "success",
                       budget: {
                           total_budget,
                           planned_expenses,
                           actual_expenses,
                           total_expenses,
                           remaining_budget,
                           budget_usage_percentage,
                           status
                       }
                   }

                   Therefore we MUST read:

                   response.data.budget
                */

                const summaryEntries =
                    await Promise.all(
                        receivedTrips.map(
                            async (trip) => {

                                try {

                                    const summaryResponse =
                                        await api.get(
                                            `/api/trips/${trip.id}/budget-summary`
                                        );


                                    const summary =
                                        summaryResponse.data?.budget ??
                                        summaryResponse.data ??
                                        {};


                                    return [
                                        trip.id,
                                        summary,
                                    ];

                                } catch (
                                    summaryError
                                ) {

                                    console.error(
                                        `Budget Summary Error for Trip ${trip.id}:`,
                                        summaryError
                                    );


                                    /*
                                       Keep the trip visible
                                       even if one summary
                                       request fails.
                                    */

                                    return [
                                        trip.id,
                                        {
                                            total_budget:
                                                Number(
                                                    trip.total_budget
                                                ) || 0,

                                            planned_expenses: 0,

                                            actual_expenses: 0,

                                            total_expenses: 0,

                                            remaining_budget:
                                                Number(
                                                    trip.total_budget
                                                ) || 0,

                                            budget_usage_percentage: 0,

                                            status:
                                                "Within Budget",
                                        },
                                    ];
                                }
                            }
                        )
                    );


                setTripSummaries(
                    Object.fromEntries(
                        summaryEntries
                    )
                );

            } catch (requestError) {

                console.error(
                    "Dashboard Error:",
                    requestError
                );


                setError(
                    "Unable to load your trips. Please try again."
                );

            } finally {

                setLoading(false);
            }

        },
        []
    );


    /* =====================================================
       INITIAL LOAD
    ===================================================== */

    useEffect(() => {

        fetchDashboardData(true);

    }, [fetchDashboardData]);


    /* =====================================================
       REFRESH WHEN USER RETURNS TO DASHBOARD
    ===================================================== */

    useEffect(() => {

        const handleWindowFocus = () => {
            fetchDashboardData(false);
        };


        const handleVisibilityChange = () => {

            if (
                document.visibilityState ===
                "visible"
            ) {
                fetchDashboardData(false);
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

    }, [fetchDashboardData]);


    /* =====================================================
       DASHBOARD FINANCIAL STATS
    ===================================================== */

    const dashboardStats = useMemo(() => {

        let totalBudget = 0;

        let plannedSpending = 0;

        let actualSpending = 0;

        let totalSpending = 0;


        trips.forEach((trip) => {

            const summary =
                tripSummaries[trip.id] || {};


            /*
               Budget
            */

            const budget =
                Number(
                    summary.total_budget ??
                    trip.total_budget
                ) || 0;


            /*
               Planned expenses
            */

            const planned =
                Number(
                    summary.planned_expenses
                ) || 0;


            /*
               Actual expenses
            */

            const actual =
                Number(
                    summary.actual_expenses
                ) || 0;


            /*
               Total expenses
            */

            const total =
                Number(
                    summary.total_expenses
                ) || planned + actual;


            totalBudget += budget;

            plannedSpending += planned;

            actualSpending += actual;

            totalSpending += total;

        });


        return {

            totalBudget,

            plannedSpending,

            actualSpending,

            totalSpending,

        };

    }, [trips, tripSummaries]);


    /* =====================================================
       UPCOMING TRIPS
    ===================================================== */

    const upcomingTrips = useMemo(() => {

        const today =
            getTodayAtMidnight();


        return trips

            .filter((trip) => {

                /*
                   Only planned trips
                   should appear as upcoming.
                */

                if (
                    String(trip.status)
                        .toLowerCase() !==
                    "planned"
                ) {
                    return false;
                }


                const startDate =
                    getTripDate(trip);


                return startDate >= today;

            })

            .sort(
                (a, b) =>
                    getTripDate(a) -
                    getTripDate(b)
            );

    }, [trips]);


    const nextTrip =
        upcomingTrips[0] || null;


    /* =====================================================
       TRIP PREVIEW
    ===================================================== */

    const previewTrips = useMemo(() => {

        return [...trips]

            .sort((a, b) => {

                const aDate =
                    getTripDate(a);

                const bDate =
                    getTripDate(b);


                return aDate - bDate;

            })

            .slice(0, 3);

    }, [trips]);


    /* =====================================================
       CREATE TRIP
    ===================================================== */

    const handleCreateTrip = () => {

        navigate("/create-trip");

    };


    /* =====================================================
       VIEW ALL
    ===================================================== */

    const handleViewAllTrips = () => {

        navigate("/my-trips");

    };


    /* =====================================================
       LOADING
    ===================================================== */

    if (loading) {

        return (

            <AppLayout>

                <div className="dashboard-page">

                    <DashboardSkeleton />

                </div>

            </AppLayout>

        );

    }


    /* =====================================================
       MAIN DASHBOARD
    ===================================================== */

    return (

        <AppLayout>

            <div className="dashboard-page">


                {/* =================================================
                   HEADER
                ================================================= */}

                <header className="dashboard-header">

                    <div className="dashboard-heading">

                        <span className="section-eyebrow">
                            TRAVEL BUDGET PRO
                        </span>


                        <h1>

                            {getGreeting()},{" "}

                            <span>
                                {user?.full_name ||
                                    "Traveler"}
                            </span>

                        </h1>


                        <p>
                            Here's how your travel plans are
                            looking.
                        </p>

                    </div>


                    <button
                        type="button"
                        className="primary-button dashboard-cta"
                        onClick={handleCreateTrip}
                    >
                        <Plus size={18} />
                        Plan a Trip
                    </button>

                </header>


                {/* =================================================
                   ERROR
                ================================================= */}

                {error && (

                    <section className="dashboard-error">

                        <div>

                            <strong>
                                Unable to load your trips.
                            </strong>

                            <span>
                                Please try again.
                            </span>

                        </div>


                        <button
                            type="button"
                            onClick={() =>
                                fetchDashboardData(true)
                            }
                        >
                            <RefreshCw size={16} />
                            Retry
                        </button>

                    </section>

                )}


                {/* =================================================
                   EMPTY STATE
                ================================================= */}

                {!error &&
                trips.length === 0 ? (

                    <DashboardEmptyState
                        onCreateTrip={
                            handleCreateTrip
                        }
                    />

                ) : (

                    <>


                        {/* =================================================
                           SUMMARY CARDS
                        ================================================= */}

                        <section className="summary-grid">


                            <SummaryCard
                                title="Trips"
                                value={String(
                                    trips.length
                                ).padStart(2, "0")}
                                subtitle="Your travel plans"
                                icon={Map}
                                accent="green"
                            />


                            <SummaryCard
                                title="Total Budget"
                                value={formatCurrency(
                                    dashboardStats.totalBudget
                                )}
                                subtitle="Across your trips"
                                icon={Wallet}
                                accent="gold"
                            />


                            <SummaryCard
                                title="Planned Spending"
                                value={formatCurrency(
                                    dashboardStats.plannedSpending
                                )}
                                subtitle="Across your trips"
                                icon={TrendingUp}
                                accent="dark"
                            />

                        </section>


                        {/* =================================================
                           NEXT TRIP
                        ================================================= */}

                        {nextTrip ? (

                            <NextTripCard
                                trip={nextTrip}
                                summary={
                                    tripSummaries[
                                        nextTrip.id
                                    ]
                                }
                            />

                        ) : (

                            <section className="no-upcoming-trip">

                                <div className="no-upcoming-icon">

                                    <Compass
                                        size={25}
                                    />

                                </div>


                                <div>

                                    <span>
                                        No upcoming trip
                                    </span>

                                    <strong>
                                        Ready to plan
                                        your next journey?
                                    </strong>

                                </div>


                                <button
                                    type="button"
                                    onClick={
                                        handleCreateTrip
                                    }
                                >
                                    Plan a Trip

                                    <ArrowRight
                                        size={17}
                                    />
                                </button>

                            </section>

                        )}


                        {/* =================================================
                           YOUR TRIPS
                        ================================================= */}

                        <section className="trips-section">


                            <div className="section-heading-row">

                                <div>

                                    <span className="section-eyebrow">
                                        YOUR JOURNEYS
                                    </span>

                                    <h2>
                                        Your Trips
                                    </h2>

                                </div>


                                <button
                                    type="button"
                                    className="view-all-button"
                                    onClick={
                                        handleViewAllTrips
                                    }
                                >
                                    View All

                                    <ArrowRight
                                        size={16}
                                    />
                                </button>

                            </div>


                            <div className="trip-grid">

                                {previewTrips.map(
                                    (trip) => (

                                        <TripCard
                                            key={trip.id}
                                            trip={trip}
                                            summary={
                                                tripSummaries[
                                                    trip.id
                                                ]
                                            }
                                        />

                                    )
                                )}

                            </div>


                        </section>

                    </>

                )}

            </div>

        </AppLayout>

    );
}


export default Dashboard;