import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    TextField,
    Button,
    MenuItem,
    Alert,
    FormControl,
    InputLabel,
    Select,
} from '@mui/material';
import { Save } from '@mui/icons-material';
import Layout from '../components/Layout';
import api from '../services/api';

export default function CriarAtendimento() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [pacientes, setPacientes] = useState([]);
    const [psicologos, setPsicologos] = useState([]);
    const [formData, setFormData] = useState({
        paciente_id: '',
        psicologo_id_agendamento: '',
        data: new Date().toISOString().split('T')[0],
        horario: '09:00',
        duracao: 50,
        tipo_consulta: 'presencial',
        valor_consulta: '',
        observacoes: '',
    });

    useEffect(() => {
        carregarDados();
    }, []);

    const carregarDados = async () => {
        try {
            const [pacientesRes, psicologosRes] = await Promise.all([
                api.get('/admin/pacientes'),
                api.get('/admin/psicologos/disponiveis'),
            ]);
            setPacientes(pacientesRes.data);
            setPsicologos(psicologosRes.data);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        if (!formData.paciente_id) {
            setError('Selecione um paciente.');
            setLoading(false);
            return;
        }
        if (!formData.psicologo_id_agendamento) {
            setError('Selecione um psicólogo.');
            setLoading(false);
            return;
        }
        if (!formData.data) {
            setError('Selecione uma data.');
            setLoading(false);
            return;
        }
        if (!formData.horario) {
            setError('Selecione um horário.');
            setLoading(false);
            return;
        }

        try {
            const dataToSend = {
                ...formData,
                valor_consulta: formData.valor_consulta ? parseFloat(formData.valor_consulta) : 0
            };
            await api.post('/agendamentos', dataToSend);
            setSuccess(true);
            setFormData({
                paciente_id: '',
                psicologo_id_agendamento: '',
                data: new Date().toISOString().split('T')[0],
                horario: '09:00',
                duracao: 50,
                tipo_consulta: 'presencial',
                valor_consulta: '',
                observacoes: '',
            });
            carregarDados();
        } catch (err) {
            setError(err.response?.data?.error || 'Erro ao criar atendimento.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    📅 Criar Atendimento
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Agende uma consulta selecionando o paciente e o psicólogo.
                </Typography>
            </Box>

            <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <CardContent>
                    {success && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            Atendimento criado com sucesso!
                        </Alert>
                    )}
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth required>
                                    <InputLabel>Selecione o Psicólogo</InputLabel>
                                    <Select
                                        name="psicologo_id_agendamento"
                                        value={formData.psicologo_id_agendamento}
                                        onChange={handleChange}
                                        label="Selecione o Psicólogo"
                                    >
                                        {psicologos.length === 0 ? (
                                            <MenuItem disabled value="">
                                                Nenhum psicólogo disponível
                                            </MenuItem>
                                        ) : (
                                            psicologos.map((p) => (
                                                <MenuItem key={p.id} value={p.id}>
                                                    {p.nome_completo} - {p.crp}
                                                </MenuItem>
                                            ))
                                        )}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth required>
                                    <InputLabel>Selecione o Paciente</InputLabel>
                                    <Select
                                        name="paciente_id"
                                        value={formData.paciente_id}
                                        onChange={handleChange}
                                        label="Selecione o Paciente"
                                    >
                                        {pacientes.length === 0 ? (
                                            <MenuItem disabled value="">
                                                Nenhum paciente cadastrado
                                            </MenuItem>
                                        ) : (
                                            pacientes.map((p) => (
                                                <MenuItem key={p.id} value={p.id}>
                                                    {p.nome_completo}
                                                </MenuItem>
                                            ))
                                        )}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Data da Consulta"
                                    name="data"
                                    type="date"
                                    value={formData.data}
                                    onChange={handleChange}
                                    required
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Horário"
                                    name="horario"
                                    type="time"
                                    value={formData.horario}
                                    onChange={handleChange}
                                    required
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Tipo de Consulta</InputLabel>
                                    <Select
                                        name="tipo_consulta"
                                        value={formData.tipo_consulta}
                                        onChange={handleChange}
                                        label="Tipo de Consulta"
                                    >
                                        <MenuItem value="presencial">Presencial</MenuItem>
                                        <MenuItem value="online">Online</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Duração (minutos)"
                                    name="duracao"
                                    type="number"
                                    value={formData.duracao}
                                    onChange={handleChange}
                                    InputProps={{ inputProps: { min: 15, max: 120 } }}
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Valor da Consulta (R$)"
                                    name="valor_consulta"
                                    type="text"
                                    value={formData.valor_consulta}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '');
                                        setFormData({ ...formData, valor_consulta: value });
                                    }}
                                    placeholder="Digite o valor (ex: 150)"
                                    InputProps={{
                                        startAdornment: <span style={{ marginRight: 8 }}>R$</span>,
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Observações"
                                    name="observacoes"
                                    multiline
                                    rows={3}
                                    value={formData.observacoes}
                                    onChange={handleChange}
                                    placeholder="Informações adicionais sobre o atendimento..."
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        disabled={loading}
                                        startIcon={<Save />}
                                        sx={{ bgcolor: '#1a1a2e', '&:hover': { bgcolor: '#2a2a4e' } }}
                                    >
                                        {loading ? 'Criando...' : 'Criar Atendimento'}
                                    </Button>
                                </Box>
                            </Grid>
                        </Grid>
                    </form>
                </CardContent>
            </Card>
        </Layout>
    );
}