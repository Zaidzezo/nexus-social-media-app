import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initializeAuth = () => {
            try {
                const token = localStorage.getItem("token");
                const userId = localStorage.getItem("userId");
                
                if (token && userId) {
                    setUser({ _id: userId, token });
                }
            } catch (error) {
                console.error("Auth initialization failed:", error);
            } finally {
                setLoading(false);
            }
        };
        initializeAuth();
    }, []);

    const login = (token, userId) => {
        localStorage.setItem("token", token);
        localStorage.setItem("userId", userId);
        setUser({ _id: userId, token });
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        setUser(null);
    };

    const updateUserProfile = (updatedData) => {
        setUser((prev) => (prev ? { ...prev, ...updatedData } : null));
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, updateUserProfile }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within an AuthProvider");
    return context;
};