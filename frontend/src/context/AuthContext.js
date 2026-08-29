import React, { createContext, useState, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);

    const login = async (email, senha) => {
        setLoading(true);
        try {
            const response = await api.post('/auth/login', { email, senha });
            const { token, psicologo } = response.data;
            localStorage.setItem('token', token);
            setUser(psicologo);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data?.error || 'Erro ao fazer login' };
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    const isAdmin = user?.role === 'admin';

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, isAdmin }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);