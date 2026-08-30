import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Alert,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    console.log('🟢 Login component renderizou');

    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const { login } = useAuth();

    console.log('🔑 login function disponível:', !!login);

    const handleSubmit = async (e) => {
        // 🔥 IMPEDE O RECARREGAMENTO DA PÁGINA
        e.preventDefault();
        e.stopPropagation();
        
        console.log('🚀 handleSubmit FOI CHAMADO!');
        console.log('📝 Email:', email);
        console.log('📝 Senha:', senha);
        
        setError('');
        setLoading(true);

        try {
            console.log('📞 Chamando login...');
            const result = await login(email, senha);
            console.log('📞 Resultado do login:', JSON.stringify(result));
            
            if (result.success) {
                console.log('✅ Login bem-sucedido, navegando...');
                // Salva no localStorage para debug
                localStorage.setItem('login_success', 'true');
                navigate('/');
            } else {
                console.log('❌ Erro no login:', result.error);
                setError(result.error || 'Erro ao fazer login.');
                // Mantém a página parada para ver o erro
                setLoading(false);
            }
        } catch (err) {
            console.error('❌ Erro inesperado:', err);
            setError('Erro inesperado ao fazer login.');
            setLoading(false);
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fb', display: 'flex', alignItems: 'center' }}>
            <Container maxWidth="sm">
                <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h4" align="center" sx={{ fontWeight: 'bold' }}>
                            Expandir
                        </Typography>
                        <Typography variant="subtitle2" align="center" sx={{ color: 'text.secondary' }}>
                            Terapia Integrativa
                        </Typography>
                    </Box>

                    <Typography variant="body2" align="center" sx={{ mb: 3, color: 'text.secondary' }}>
                        Acesse sua conta
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit}>
                        <TextField
                            fullWidth
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            margin="normal"
                            required
                        />

                        <TextField
                            fullWidth
                            label="Senha"
                            type="password"
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            margin="normal"
                            required
                        />

                        <Button
                            fullWidth
                            type="submit"
                            variant="contained"
                            size="large"
                            disabled={loading}
                            sx={{ mt: 3, bgcolor: '#1a1a2e', '&:hover': { bgcolor: '#2a2a4e' } }}
                        >
                            {loading ? 'Carregando...' : 'Entrar'}
                        </Button>
                    </form>

                    <Box sx={{ mt: 3, textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            Contas de psicólogos são criadas exclusivamente pela administração.
                        </Typography>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
}