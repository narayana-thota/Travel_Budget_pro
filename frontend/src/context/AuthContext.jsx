import {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";

import api from "../api/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    async function checkSession() {
        try {
            const response = await api.get("/api/me");

            setUser(response.data.user);
        } catch (error) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }

    async function login(email, password) {
        const response = await api.post("/api/login", {
            email: email,
            password: password,
        });

        setUser(response.data.user);

        return response.data;
    }

    async function logout() {
        try {
            await api.post("/api/logout");
        } finally {
            setUser(null);
        }
    }

    useEffect(() => {
        checkSession();
    }, []);

    const value = {
        user,
        loading,
        login,
        logout,
        checkSession,
        isAuthenticated: Boolean(user),
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}