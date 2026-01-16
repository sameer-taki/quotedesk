import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Check for existing session on mount
    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (token && storedUser) {
            try {
                setUser(JSON.parse(storedUser));
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            } catch (e) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
        setLoading(false);
    }, []);

    // Session timeout (30 min inactivity)
    useEffect(() => {
        if (!user) return;

        let timeoutId;
        const TIMEOUT_DURATION = 30 * 60 * 1000; // 30 minutes

        const resetTimeout = () => {
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                logout();
                navigate('/login', { state: { message: 'Session expired due to inactivity' } });
            }, TIMEOUT_DURATION);
        };

        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
        events.forEach(event => window.addEventListener(event, resetTimeout));
        resetTimeout();

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
            events.forEach(event => window.removeEventListener(event, resetTimeout));
        };
    }, [user, navigate]);

    const login = useCallback(async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            const { user: userData, token, refreshToken } = response.data.data;

            localStorage.setItem('token', token);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('user', JSON.stringify(userData));

            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setUser(userData);

            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Login failed',
            };
        }
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        delete api.defaults.headers.common['Authorization'];
        setUser(null);
    }, []);

    const refreshToken = useCallback(async () => {
        try {
            const token = localStorage.getItem('refreshToken');
            if (!token) return false;

            const response = await api.post('/auth/refresh', { refreshToken: token });
            const newToken = response.data.data.token;

            localStorage.setItem('token', newToken);
            api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

            return true;
        } catch (error) {
            logout();
            return false;
        }
    }, [logout]);

    // Role check helpers
    const isAdmin = user?.role === 'admin';
    const isCreator = user?.role === 'creator' || isAdmin;
    const isApprover = user?.role === 'approver' || isAdmin;
    const canCreateQuotes = isCreator;
    const canApproveQuotes = isApprover;

    const value = {
        user,
        loading,
        login,
        logout,
        refreshToken,
        isAuthenticated: !!user,
        isAdmin,
        isCreator,
        isApprover,
        canCreateQuotes,
        canApproveQuotes,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
