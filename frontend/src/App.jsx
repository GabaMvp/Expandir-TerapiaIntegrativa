import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Pacientes from './pages/Pacientes';
import Agenda from './pages/Agenda';
import Prontuarios from './pages/Prontuarios';
import DashboardAdmin from './admin/DashboardAdmin';
import TodosPacientes from './admin/TodosPacientes';
import TodosAgendamentos from './admin/TodosAgendamentos';
import CriarPsicologo from './admin/CriarPsicologo';
import CriarAtendimento from './admin/CriarAtendimento';

const ProtectedRoute = ({ children }) => {
    const { user } = useAuth();
    const token = localStorage.getItem('token');
    
    if (!token && !user) {
        return <Navigate to="/login" replace />;
    }
    
    return children;
};

const AdminRoute = ({ children }) => {
    const { user } = useAuth();
    const token = localStorage.getItem('token');
    
    if (!token && !user) {
        return <Navigate to="/login" replace />;
    }
    
    if (user?.role !== 'admin') {
        return <Navigate to="/" replace />;
    }
    
    return children;
};

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    
                    <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/pacientes" element={<ProtectedRoute><Pacientes /></ProtectedRoute>} />
                    <Route path="/agenda" element={<ProtectedRoute><Agenda /></ProtectedRoute>} />
                    <Route path="/prontuarios" element={<ProtectedRoute><Prontuarios /></ProtectedRoute>} />
                    
                    <Route path="/admin" element={<AdminRoute><DashboardAdmin /></AdminRoute>} />
                    <Route path="/admin/pacientes" element={<AdminRoute><TodosPacientes /></AdminRoute>} />
                    <Route path="/admin/agendamentos" element={<AdminRoute><TodosAgendamentos /></AdminRoute>} />
                    <Route path="/admin/psicologos/novo" element={<AdminRoute><CriarPsicologo /></AdminRoute>} />
                    <Route path="/admin/atendimentos/novo" element={<AdminRoute><CriarAtendimento /></AdminRoute>} />
                    
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;