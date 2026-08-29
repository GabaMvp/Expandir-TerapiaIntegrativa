import React, { useState } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    TextField,
    Button,
    Alert,
} from '@mui/material';
import { PersonAdd } from '@mui/icons-material';
import Layout from '../components/Layout';
import api from '../services/api';

export default function CriarPsicologo() {
    const [formData, setFormData] = useState({
        nome_completo: '',
        email: '',
        senha: '',
        crp: '',
        especialidade: '',
        telefone: '',
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            await api.post('/auth/register', formData);
            setSuccess(true);
            setFormData({
                nome_completo: '',
                email: '',
                senha: '',
                crp: '',
                especialidade: '',
                telefone: '',
            });
        } catch (err) {
            setError(err.response?.data?.error || 'Erro ao criar psicólogo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    👨‍⚕️ Criar Psicólogo
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Cadastre um novo psicólogo na plataforma.
                </Typography>
            </Box>

            <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <CardContent>
                    {success && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            Psicólogo cadastrado com sucesso!
                        </Alert>
                    )}
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Nome completo"
                                    name="nome_completo"
                                    value={formData.nome_completo}
                                    onChange={handleChange}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Senha inicial"
                                    name="senha"
                                    type="password"
                                    value={formData.senha}
                                    onChange={handleChange}
                                    required
                                    helperText="O psicólogo poderá alterar depois"
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="CRP"
                                    name="crp"
                                    value={formData.crp}
                                    onChange={handleChange}
                                    required
                                    placeholder="Ex: 12/34567"
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Especialidade"
                                    name="especialidade"
                                    value={formData.especialidade}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Telefone"
                                    name="telefone"
                                    value={formData.telefone}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    startIcon={<PersonAdd />}
                                    disabled={loading}
                                    sx={{ bgcolor: '#1a1a2e', '&:hover': { bgcolor: '#2a2a4e' } }}
                                >
                                    {loading ? 'Cadastrando...' : 'Cadastrar Psicólogo'}
                                </Button>
                            </Grid>
                        </Grid>
                    </form>
                </CardContent>
            </Card>
        </Layout>
    );
}