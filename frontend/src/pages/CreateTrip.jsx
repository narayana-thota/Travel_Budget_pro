import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import "../styles/create-trip.css";
import AppLayout from "../components/AppLayout";

function CreateTrip() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        trip_name: "",
        source: "",
        destination: "",
        start_date: "",
        end_date: "",
        travelers: 1,
        total_budget: "",
        plan: "Premium",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Budget comparison state
    const [budgetCheck, setBudgetCheck] = useState(null);
    const [createdTripId, setCreatedTripId] = useState(null);

    function handleChange(event) {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));

        // If user changes the budget after seeing a result,
        // remove the previous comparison.
        if (name === "total_budget") {
            setBudgetCheck(null);
        }
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setBudgetCheck(null);

        if (
            !formData.trip_name ||
            !formData.source ||
            !formData.destination ||
            !formData.start_date ||
            !formData.end_date ||
            !formData.travelers ||
            !formData.total_budget ||
            !formData.plan
        ) {
            setError("Please fill in all required fields.");
            return;
        }

        if (formData.end_date < formData.start_date) {
            setError("End date cannot be before start date.");
            return;
        }

        if (Number(formData.travelers) < 1) {
            setError("Travelers must be at least 1.");
            return;
        }

        if (Number(formData.total_budget) < 0) {
            setError("Budget cannot be negative.");
            return;
        }

        try {
            setLoading(true);

            /*
             * STEP 1
             * Create the trip.
             *
             * The existing trips API does not need
             * the plan field.
             */
            const response = await api.post("/api/trips", {
                trip_name: formData.trip_name.trim(),
                source: formData.source.trim(),
                destination: formData.destination.trim(),
                start_date: formData.start_date,
                end_date: formData.end_date,
                travelers: Number(formData.travelers),
                total_budget: Number(formData.total_budget),
            });

            const tripId = response.data.trip?.id;

            if (tripId) {
                setCreatedTripId(tripId);

                /*
                 * STEP 2
                 * Request the Plantrip estimate.
                 *
                 * Standard       -> budget
                 * Premium        -> moderate
                 * Ultra Premium  -> luxury
                 */
                try {
                    const estimateResponse = await api.post(
                        `/api/trips/${tripId}/estimate`,
                        {
                            plan: formData.plan,
                        }
                    );

                    /*
                     * Plantrip Actual value.
                     *
                     * The existing TripDetails page uses:
                     * estimate.budget.estimated_total
                     *
                     * So we use the same value here.
                     */
                    const actualCost = Number(
                        estimateResponse?.data?.budget?.estimated_total
                    );

                    const userBudget = Number(
                        formData.total_budget
                    );

                    if (
                        Number.isFinite(actualCost) &&
                        Number.isFinite(userBudget)
                    ) {
                        const difference =
                            userBudget - actualCost;

                        setBudgetCheck({
                            userBudget,
                            actualCost,
                            difference,
                            sufficient: difference >= 0,
                        });
                    } else {
                        /*
                         * Estimate response did not contain
                         * the expected budget value.
                         *
                         * We still allow the user to continue.
                         */
                        setBudgetCheck({
                            userBudget,
                            actualCost: null,
                            difference: null,
                            sufficient: null,
                        });
                    }
                } catch (estimateError) {
                    console.error(
                        "ESTIMATE ERROR:",
                        estimateError.response?.data ||
                            estimateError
                    );

                    /*
                     * The trip has already been created.
                     * We do not delete it if the estimate fails.
                     *
                     * Show a message and allow the user
                     * to continue to Trip Details.
                     */
                    setBudgetCheck({
                        userBudget: Number(formData.total_budget),
                        actualCost: null,
                        difference: null,
                        sufficient: null,
                        estimateFailed: true,
                    });
                }
            } else {
                navigate("/my-trips");
            }
        } catch (err) {
            console.error("CREATE TRIP ERROR:", err);

            setError(
                err.response?.data?.message ||
                    "Unable to create trip. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }

    function handleContinueToTrip() {
        if (createdTripId) {
            navigate(`/trip/${createdTripId}`);
        } else {
            navigate("/my-trips");
        }
    }

    function formatCurrency(amount) {
        if (
            amount === null ||
            amount === undefined ||
            !Number.isFinite(Number(amount))
        ) {
            return "—";
        }

        return `₹${Number(amount).toLocaleString("en-IN", {
            maximumFractionDigits: 0,
        })}`;
    }

    return (
        <AppLayout>
            <div className="create-trip-page">
                {/* --- HEADER SECTION --- */}
                <div className="create-trip-header">
                    <div>
                        <p className="page-eyebrow">
                            PLAN YOUR JOURNEY
                        </p>

                        <h1>Create a new trip</h1>

                        <p className="page-description">
                            Set your destination, dates and budget before
                            you start spending.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="back-button"
                        onClick={() => navigate("/dashboard")}
                    >
                        ← Dashboard
                    </button>
                </div>

                {/* --- ERROR BANNER --- */}
                {error && (
                    <div className="form-error-message">
                        {error}
                    </div>
                )}

                {/* =====================================================
                    BUDGET CHECK RESULT
                ====================================================== */}
                {budgetCheck && (
                    <div
                        className={`budget-check-card ${
                            budgetCheck.sufficient === true
                                ? "budget-sufficient"
                                : budgetCheck.sufficient === false
                                ? "budget-insufficient"
                                : "budget-check-neutral"
                        }`}
                    >
                        {budgetCheck.estimateFailed ? (
                            <>
                                <div className="budget-check-header">
                                    <div>
                                        <span className="budget-check-label">
                                            BUDGET CHECK
                                        </span>

                                        <h2>
                                            Trip created successfully
                                        </h2>
                                    </div>
                                </div>

                                <p className="budget-check-message">
                                    We could not get the actual estimate
                                    from Plantrip right now. You can
                                    continue to your Trip Details page.
                                </p>

                                <div className="budget-check-actions">
                                    <button
                                        type="button"
                                        className="budget-continue-button"
                                        onClick={
                                            handleContinueToTrip
                                        }
                                    >
                                        Continue to Trip Details →
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="budget-check-header">
                                    <div>
                                        <span className="budget-check-label">
                                            BUDGET CHECK
                                        </span>

                                        <h2>
                                            {budgetCheck.sufficient
                                                ? "Your budget looks sufficient"
                                                : "Your budget may not be sufficient"}
                                        </h2>
                                    </div>

                                    <span className="budget-check-icon">
                                        {budgetCheck.sufficient
                                            ? "✓"
                                            : "⚠"}
                                    </span>
                                </div>

                                <div className="budget-check-grid">
                                    <div className="budget-check-item">
                                        <span>
                                            Your Budget
                                        </span>

                                        <strong>
                                            {formatCurrency(
                                                budgetCheck.userBudget
                                            )}
                                        </strong>
                                    </div>

                                    <div className="budget-check-item">
                                        <span>
                                            Actual Estimate
                                        </span>

                                        <strong>
                                            {formatCurrency(
                                                budgetCheck.actualCost
                                            )}
                                        </strong>
                                    </div>

                                    <div className="budget-check-item">
                                        <span>
                                            {budgetCheck.sufficient
                                                ? "Remaining"
                                                : "Additional Amount Needed"}
                                        </span>

                                        <strong>
                                            {formatCurrency(
                                                Math.abs(
                                                    budgetCheck.difference
                                                )
                                            )}
                                        </strong>
                                    </div>
                                </div>

                                <p className="budget-check-message">
                                    {budgetCheck.sufficient ? (
                                        <>
                                            Your planned budget of{" "}
                                            <strong>
                                                {formatCurrency(
                                                    budgetCheck.userBudget
                                                )}
                                            </strong>{" "}
                                            covers the actual estimated
                                            cost of{" "}
                                            <strong>
                                                {formatCurrency(
                                                    budgetCheck.actualCost
                                                )}
                                            </strong>
                                            .
                                        </>
                                    ) : (
                                        <>
                                            Your selected{" "}
                                            <strong>
                                                {formData.plan}
                                            </strong>{" "}
                                            plan is estimated at{" "}
                                            <strong>
                                                {formatCurrency(
                                                    budgetCheck.actualCost
                                                )}
                                            </strong>
                                            , which is{" "}
                                            <strong>
                                                {formatCurrency(
                                                    Math.abs(
                                                        budgetCheck.difference
                                                    )
                                                )}
                                            </strong>{" "}
                                            more than your planned budget.
                                        </>
                                    )}
                                </p>

                                <div className="budget-check-actions">
                                    <button
                                        type="button"
                                        className="budget-continue-button"
                                        onClick={
                                            handleContinueToTrip
                                        }
                                    >
                                        Continue to Trip Details →
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* --- FORM SECTION --- */}
                <form
                    className="trip-form"
                    onSubmit={handleSubmit}
                >
                    {/* SECTION 01: TRIP DETAILS */}
                    <div className="form-section">
                        <div className="section-heading">
                            <span>01</span>

                            <div>
                                <h2>Trip details</h2>

                                <p>
                                    Where are you planning to go?
                                </p>
                            </div>
                        </div>

                        <div className="form-grid">
                            <div className="form-group full-width">
                                <label htmlFor="trip_name">
                                    Trip name
                                </label>

                                <input
                                    id="trip_name"
                                    name="trip_name"
                                    type="text"
                                    placeholder="e.g. Goa Weekend Trip"
                                    value={formData.trip_name}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="source">
                                    Starting from
                                </label>

                                <input
                                    id="source"
                                    name="source"
                                    type="text"
                                    placeholder="e.g. Hyderabad"
                                    value={formData.source}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="route-arrow">
                                →
                            </div>

                            <div className="form-group">
                                <label htmlFor="destination">
                                    Destination
                                </label>

                                <input
                                    id="destination"
                                    name="destination"
                                    type="text"
                                    placeholder="e.g. Goa"
                                    value={formData.destination}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 02: DATES */}
                    <div className="form-section">
                        <div className="section-heading">
                            <span>02</span>

                            <div>
                                <h2>When are you going?</h2>

                                <p>
                                    Choose your travel dates.
                                </p>
                            </div>
                        </div>

                        <div className="form-grid two-columns">
                            <div className="form-group">
                                <label htmlFor="start_date">
                                    Start date
                                </label>

                                <input
                                    id="start_date"
                                    name="start_date"
                                    type="date"
                                    value={formData.start_date}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="end_date">
                                    End date
                                </label>

                                <input
                                    id="end_date"
                                    name="end_date"
                                    type="date"
                                    value={formData.end_date}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 03: BUDGET */}
                    <div className="form-section">
                        <div className="section-heading">
                            <span>03</span>

                            <div>
                                <h2>Set your budget</h2>

                                <p>
                                    Give your trip a spending limit.
                                </p>
                            </div>
                        </div>

                        <div className="form-grid two-columns">
                            <div className="form-group">
                                <label htmlFor="travelers">
                                    Travelers
                                </label>

                                <input
                                    id="travelers"
                                    name="travelers"
                                    type="number"
                                    min="1"
                                    value={formData.travelers}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="total_budget">
                                    Total Budget
                                </label>

                                <input
                                    id="total_budget"
                                    name="total_budget"
                                    type="number"
                                    min="0"
                                    placeholder="e.g. 15000"
                                    value={formData.total_budget}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 04: TRAVEL PLAN */}
                    <div className="form-section">
                        <div className="section-heading">
                            <span>04</span>

                            <div>
                                <h2>Choose your travel plan</h2>

                                <p>
                                    Select the travel style for your
                                    trip estimate.
                                </p>
                            </div>
                        </div>

                        <div className="plan-selection">
                            {/* STANDARD */}
                            <label
                                className={`plan-card ${
                                    formData.plan === "Standard"
                                        ? "selected"
                                        : ""
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="plan"
                                    value="Standard"
                                    checked={
                                        formData.plan ===
                                        "Standard"
                                    }
                                    onChange={handleChange}
                                />

                                <div className="plan-card-content">
                                    <span className="plan-card-label">
                                        STANDARD
                                    </span>

                                    <h3>Budget Friendly</h3>

                                    <p>
                                        Focus on keeping your trip
                                        affordable and practical.
                                    </p>
                                </div>
                            </label>

                            {/* PREMIUM */}
                            <label
                                className={`plan-card ${
                                    formData.plan === "Premium"
                                        ? "selected"
                                        : ""
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="plan"
                                    value="Premium"
                                    checked={
                                        formData.plan ===
                                        "Premium"
                                    }
                                    onChange={handleChange}
                                />

                                <div className="plan-card-content">
                                    <span className="plan-card-label">
                                        PREMIUM
                                    </span>

                                    <h3>Comfortable</h3>

                                    <p>
                                        Balance comfort, convenience
                                        and spending.
                                    </p>
                                </div>
                            </label>

                            {/* ULTRA PREMIUM */}
                            <label
                                className={`plan-card ${
                                    formData.plan ===
                                    "Ultra Premium"
                                        ? "selected"
                                        : ""
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="plan"
                                    value="Ultra Premium"
                                    checked={
                                        formData.plan ===
                                        "Ultra Premium"
                                    }
                                    onChange={handleChange}
                                />

                                <div className="plan-card-content">
                                    <span className="plan-card-label">
                                        ULTRA PREMIUM
                                    </span>

                                    <h3>Luxury</h3>

                                    <p>
                                        Plan for a more premium and
                                        comfortable travel experience.
                                    </p>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* SUBMIT BUTTON */}
                    {!budgetCheck && (
                        <div className="form-actions">
                            <button
                                type="submit"
                                className="submit-button"
                                disabled={loading}
                            >
                                {loading
                                    ? "Creating Journey..."
                                    : "Build My Trip Plan"}
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </AppLayout>
    );
}

export default CreateTrip;