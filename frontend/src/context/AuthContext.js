import React, { createContext, useState, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);

    const login = async (email, senha) => {
        console.log('🔍 Função login chamada com:', { email, senha });
        setLoading(true);

        try {
            console.log('📡 Tentando chamar o backend...');

            const response = await api.post('/auth/login', { email, senha });

            console.log('✅ Resposta recebida:', response.data);

            const { token, psicologo } = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(psicologo));

            setUser(psicologo);

            return { success: true };
        } catch (error) {
            console.error('❌ Erro completo:', error);
            console.error('❌ Resposta do erro:', error.response?.data);

            return {
                success: false,
                error: error.response?.data?.error || 'Erro ao fazer login'
            };
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    const isAdmin = user?.role === 'admin';

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                logout,
                isAdmin
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
};