import React, {
  createContext,
  useState,
  useContext,
  useEffect,
} from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const usuarioSalvo = localStorage.getItem('user');

    if (token && usuarioSalvo) {
      try {
        setUser(JSON.parse(usuarioSalvo));
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }

    setLoading(false);
  }, []);

  const login = async (email, senha) => {
    setLoading(true);

    try {
      const response = await api.post('/auth/login', {
        email,
        senha,
      });

      const { token, psicologo } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(psicologo));

      setUser(psicologo);

      return {
        success: true,
        psicologo,
      };
    } catch (error) {
      console.error('Erro ao fazer login:', error);

      const mensagem =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        'E-mail ou senha inválidos.';

      throw new Error(mensagem);
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
        login,
        logout,
        loading,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};