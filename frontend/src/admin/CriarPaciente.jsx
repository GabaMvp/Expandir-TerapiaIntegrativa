import React, { useState } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    TextField,
    Button,
    Alert,
    Grid,
} from '@mui/material';
import { PersonAdd } from '@mui/icons-material';
import Layout from '../components/Layout';
import api from '../services/api';

export default function CriarPaciente() {
    const [formData, setFormData] = useState({
        nome_completo: '',
        telefone: '',
        email: '',
        data_nascimento: '',
        genero: '',
        endereco: '',
        ocupacao: '',
        estado_civil: '',
        convenio: '',
    });

    const [loading, setLoading] = useState(false);
    const [sucesso, setSucesso] = useState('');
    const [erro, setErro] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const limparFormulario = () => {
        setFormData({
            nome_completo: '',
            telefone: '',
            email: '',
            data_nascimento: '',
            genero: '',
            endereco: '',
            ocupacao: '',
            estado_civil: '',
            convenio: '',
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setErro('');
        setSucesso('');

        if (!formData.nome_completo.trim()) {
            setErro('O nome do paciente é obrigatório.');
            return;
        }

        try {
            setLoading(true);

            await api.post('/pacientes', formData);

            setSucesso('Paciente criado com sucesso!');
            limparFormulario();
        } catch (error) {
            console.error('Erro ao criar paciente:', error);

            setErro(
                error?.response?.data?.error ||
                'Erro ao criar paciente. Tente novamente.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <Box sx={{ mb: 4 }}>
                <Typography
                    variant="h4"
                    sx={{
                        fontWeight: 'bold',
                    }}
                >
                    Criar Paciente
                </Typography>

                <Typography
                    variant="body2"
                    sx={{
                        color: 'text.secondary',
                        mt: 1,
                    }}
                >
                    Cadastre um novo paciente no sistema.
                </Typography>
            </Box>

            <Card
                sx={{
                    maxWidth: 900,
                    borderRadius: 3,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                }}
            >
                <CardContent
                    sx={{
                        p: {
                            xs: 3,
                            md: 4,
                        },
                    }}
                >
                    {sucesso && (
                        <Alert
                            severity="success"
                            sx={{ mb: 3 }}
                        >
                            {sucesso}
                        </Alert>
                    )}

                    {erro && (
                        <Alert
                            severity="error"
                            sx={{ mb: 3 }}
                        >
                            {erro}
                        </Alert>
                    )}

                    <Box
                        component="form"
                        onSubmit={handleSubmit}
                    >
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    required
                                    label="Nome completo"
                                    name="nome_completo"
                                    value={formData.nome_completo}
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

                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    type="email"
                                    label="Email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    type="date"
                                    label="Data de nascimento"
                                    name="data_nascimento"
                                    value={formData.data_nascimento}
                                    onChange={handleChange}
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Gênero"
                                    name="genero"
                                    value={formData.genero}
                                    onChange={handleChange}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Endereço"
                                    name="endereco"
                                    value={formData.endereco}
                                    onChange={handleChange}
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Ocupação"
                                    name="ocupacao"
                                    value={formData.ocupacao}
                                    onChange={handleChange}
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Estado civil"
                                    name="estado_civil"
                                    value={formData.estado_civil}
                                    onChange={handleChange}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Convênio"
                                    name="convenio"
                                    value={formData.convenio}
                                    onChange={handleChange}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    startIcon={<PersonAdd />}
                                    disabled={loading}
                                    sx={{
                                        mt: 1,
                                        bgcolor: '#7B944A',
                                        '&:hover': {
                                            bgcolor: '#687F3E',
                                        },
                                    }}
                                >
                                    {loading
                                        ? 'Criando...'
                                        : 'Criar Paciente'}
                                </Button>
                            </Grid>
                        </Grid>
                    </Box>
                </CardContent>
            </Card>
        </Layout>
    );
}