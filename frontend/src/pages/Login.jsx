import React, { useState } from 'react';
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
import { useNavigate } from 'react-router-dom';
export default function Login() {
    console.log('🟢 Login component renderizou');

    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resposta, setResposta] = useState(null);

    const { login } = useAuth();
    const navigate = useNavigate();

    console.log('🔑 login function disponível:', !!login);

    const handleSubmit = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('🚀 handleSubmit FOI CHAMADO!');
        console.log('📝 Email:', email);
        console.log('📝 Senha:', senha);
        
        setError('');
        setLoading(true);
        setResposta(null);

        try {
            console.log('📞 Chamando login...');
            const result = await login(email, senha);
            console.log('📞 Resultado do login:', JSON.stringify(result));
            
            // Salva a resposta para mostrar na tela
            setResposta(result);
            
            if (result.success) {
                console.log('✅ Login bem-sucedido!');
                navigate('/admin');
            } else {
                console.log('❌ Erro no login:', result.error);
                setError('❌ ' + (result.error || 'Erro ao fazer login.'));
            }
        } catch (err) {
            console.error('❌ Erro inesperado:', err);
            setError('❌ Erro inesperado: ' + err.message);
        } finally {
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
                        <Alert severity={error.includes('✅') ? 'success' : 'error'} sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    {resposta && (
                        <Alert severity="info" sx={{ mb: 2, fontSize: '12px', overflow: 'auto' }}>
                            <strong>Resposta do servidor:</strong>
                            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                                {JSON.stringify(resposta, null, 2)}
                            </pre>
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