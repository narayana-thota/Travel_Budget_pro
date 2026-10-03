import {
    BrowserRouter,
    Navigate,
    Route,
    Routes,
} from "react-router-dom";

import Login from "./pages/login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CreateTrip from "./pages/CreateTrip";
import MyTrips from "./pages/MyTrips";
import TripDetails from "./pages/TripDetails";
import TripReports from "./pages/TripReports";

import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>

                    {/* =========================
                        PUBLIC ROUTES
                    ========================== */}

                    <Route
                        path="/"
                        element={
                            <Navigate
                                to="/login"
                                replace
                            />
                        }
                    />

                    <Route
                        path="/login"
                        element={<Login />}
                    />

                    <Route
                        path="/register"
                        element={<Register />}
                    />


                    {/* =========================
                        PROTECTED ROUTES
                    ========================== */}

                    <Route element={<ProtectedRoute />}>

                        {/* Dashboard */}
                        <Route
                            path="/dashboard"
                            element={<Dashboard />}
                        />

                        {/* Plan Trip / Create Trip */}
                        <Route
                            path="/create-trip"
                            element={<CreateTrip />}
                        />

                        {/* My Trips
                            Page will be added next
                        */}
                        <Route
                            path="/my-trips"
                            element={<MyTrips />}
                        />
                        <Route 
                            path="/trip/:tripId" 
                            element={<TripDetails />} />

                        {/* Trip Reports
                            Page will be added later
                        */}
                        <Route
                        path="/trip-reports"
                        element={<TripReports />}
                        />

                    </Route>


                    {/* =========================
                        UNKNOWN ROUTES
                    ========================== */}

                    <Route
                        path="*"
                        element={
                            <Navigate
                                to="/dashboard"
                                replace
                            />
                        }
                    />

                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;