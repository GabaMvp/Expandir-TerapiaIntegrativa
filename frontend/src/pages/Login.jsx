import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import logoExpandir from '../assets/logo-expandir.jpeg';

const VERDE_EXPANDIR = '#7B944A';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setLoading(true);

    try {
      const resultado = await login(email, senha);

      if (resultado?.success) {
        const usuarioSalvo = localStorage.getItem('user');
        const usuario = usuarioSalvo
          ? JSON.parse(usuarioSalvo)
          : null;

        if (usuario?.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      setError(
        err?.message ||
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          'E-mail ou senha inválidos.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f7f7f3',
        px: 2,
        py: 2,
        boxSizing: 'border-box',
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width: '100%',
          maxWidth: 430,
          borderRadius: 4,
          px: {
            xs: 3,
            sm: 5,
          },
          py: {
            xs: 3,
            sm: 4,
          },
          bgcolor: '#ffffff',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mb: 2,
          }}
        >
          <Box
            component="img"
            src={logoExpandir}
            alt="Expandir Terapia Integrativa"
            sx={{
              width: '100%',
              maxWidth: 250,
              height: 'auto',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        </Box>

        <Typography
          variant="h4"
          align="center"
          sx={{
            fontWeight: 600,
            color: '#4f4f46',
            mb: 0.5,
          }}
        >
          Bem-vindo(a)!
        </Typography>

        <Typography
          align="center"
          sx={{
            color: '#77776f',
            mb: 3,
          }}
        >
          Faça login para acessar o sistema.
        </Typography>

        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 2,
              borderRadius: 2,
            }}
          >
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="E-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,

                '&:hover fieldset': {
                  borderColor: VERDE_EXPANDIR,
                },

                '&.Mui-focused fieldset': {
                  borderColor: VERDE_EXPANDIR,
                },
              },

              '& .MuiInputLabel-root.Mui-focused': {
                color: VERDE_EXPANDIR,
              },
            }}
          />

          <TextField
            fullWidth
            label="Senha"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            autoComplete="current-password"
            sx={{
              mb: 2.5,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,

                '&:hover fieldset': {
                  borderColor: VERDE_EXPANDIR,
                },

                '&.Mui-focused fieldset': {
                  borderColor: VERDE_EXPANDIR,
                },
              },

              '& .MuiInputLabel-root.Mui-focused': {
                color: VERDE_EXPANDIR,
              },
            }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{
              height: 50,
              borderRadius: 2,
              bgcolor: VERDE_EXPANDIR,
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: 'none',

              '&:hover': {
                bgcolor: '#687F3E',
                boxShadow: 'none',
              },
            }}
          >
            {loading ? (
              <CircularProgress
                size={24}
                sx={{ color: '#ffffff' }}
              />
            ) : (
              'Entrar'
            )}
          </Button>

          <Typography
            align="center"
            sx={{
              mt: 2.5,
              color: '#77776f',
              fontSize: '0.86rem',
              lineHeight: 1.5,
            }}
          >
            Contas de psicólogos são criadas exclusivamente pela administração.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}