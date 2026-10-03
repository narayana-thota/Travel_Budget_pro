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
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    function handleChange(event) {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");

        if (
            !formData.trip_name ||
            !formData.source ||
            !formData.destination ||
            !formData.start_date ||
            !formData.end_date ||
            !formData.travelers ||
            !formData.total_budget
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
                navigate(`/trip/${tripId}`);
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

    return (
        <AppLayout>
            <div className="create-trip-page">
                
                {/* --- HEADER SECTION --- */}
                <div className="create-trip-header">
                    <div>
                        <p className="page-eyebrow">PLAN YOUR JOURNEY</p>
                        <h1>Create a new trip</h1>
                        <p className="page-description">
                            Set your destination, dates and budget before you start spending.
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

                {/* --- DYNAMIC FORM ERROR BANNER --- */}
                {error && <div className="form-error-message">{error}</div>}

                {/* --- FORM SECTION --- */}
                <form className="trip-form" onSubmit={handleSubmit}>

                    {/* SECTION 01: TRIP DETAILS */}
                    <div className="form-section">
                        <div className="section-heading">
                            <span>01</span>
                            <div>
                                <h2>Trip details</h2>
                                <p>Where are you planning to go?</p>
                            </div>
                        </div>

                        <div className="form-grid">
                            <div className="form-group full-width">
                                <label htmlFor="trip_name">Trip name</label>
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
                                <label htmlFor="source">Starting from</label>
                                <input
                                    id="source"
                                    name="source"
                                    type="text"
                                    placeholder="e.g. Hyderabad"
                                    value={formData.source}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="route-arrow">→</div>

                            <div className="form-group">
                                <label htmlFor="destination">Destination</label>
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
                                <p>Choose your travel dates.</p>
                            </div>
                        </div>

                        <div className="form-grid two-columns">
                            <div className="form-group">
                                <label htmlFor="start_date">Start date</label>
                                <input
                                    id="start_date"
                                    name="start_date"
                                    type="date"
                                    value={formData.start_date}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="end_date">End date</label>
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
                                <p>Give your trip a spending limit.</p>
                            </div>
                        </div>

                        <div className="form-grid two-columns">
                            <div className="form-group">
                                <label htmlFor="travelers">Travelers</label>
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
                                <label htmlFor="total_budget">Total Budget</label>
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

                    {/* SUBMIT BUTTON */}
                    <div className="form-actions">
                        <button 
                            type="submit" 
                            className="submit-button" 
                            disabled={loading}
                        >
                            {loading ? "Creating Journey..." : "Build My Trip Plan"}
                        </button>
                    </div>

                </form>
            </div>
        </AppLayout>
    );
}

export default CreateTrip;
