import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
} from '@mui/material';
import Layout from '../components/Layout';
import api from '../services/api';

export default function Agenda() {
    const [agendamentos, setAgendamentos] = useState([]);
    const [loading, setLoading] = useState(true);

    const carregarAgendamentos = async () => {
        try {
            const response = await api.get('/agendamentos');
            setAgendamentos(response.data);
        } catch (error) {
            console.error('Erro ao carregar agendamentos:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        carregarAgendamentos();
    }, []);

    const formatarData = (data) => {
        if (!data) return '-';
        const d = new Date(data);
        return d.toLocaleDateString('pt-BR');
    };

    const hoje = new Date().toISOString().split('T')[0];
    const agendamentosHoje = agendamentos.filter(a => a.data === hoje);

    return (
        <Layout>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    Minha Agenda
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Visualize seus agendamentos. A criação é feita pela administração.
                </Typography>
            </Box>

            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', height: '100%' }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                                📅 Hoje
                            </Typography>
                            {loading ? (
                                <Typography>Carregando...</Typography>
                            ) : agendamentosHoje.length === 0 ? (
                                <Typography sx={{ color: 'text.secondary' }}>
                                    Nenhum agendamento para hoje.
                                </Typography>
                            ) : (
                                agendamentosHoje.map((ag) => (
                                    <Box key={ag.id} sx={{ mb: 2, p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                            {ag.horario.slice(0, 5)} - {ag.paciente_nome}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            {ag.tipo_consulta}
                                        </Typography>
                                        <Chip
                                            label={ag.status}
                                            size="small"
                                            color={ag.status === 'confirmado' ? 'success' : 'default'}
                                            sx={{ ml: 1 }}
                                        />
                                        {ag.compareceu !== null && (
                                            <Chip
                                                label={ag.compareceu ? '✅ Compareceu' : '❌ Faltou'}
                                                size="small"
                                                color={ag.compareceu ? 'success' : 'error'}
                                                sx={{ ml: 1 }}
                                            />
                                        )}
                                    </Box>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={8}>
                    <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell><strong>Data</strong></TableCell>
                                        <TableCell><strong>Horário</strong></TableCell>
                                        <TableCell><strong>Paciente</strong></TableCell>
                                        <TableCell><strong>Tipo</strong></TableCell>
                                        <TableCell><strong>Status</strong></TableCell>
                                        <TableCell><strong>Compareceu</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center">Carregando...</TableCell>
                                        </TableRow>
                                    ) : agendamentos.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center">Nenhum agendamento encontrado.</TableCell>
                                        </TableRow>
                                    ) : (
                                        agendamentos.map((ag) => (
                                            <TableRow key={ag.id}>
                                                <TableCell>{formatarData(ag.data)}</TableCell>
                                                <TableCell>{ag.horario.slice(0, 5)}</TableCell>
                                                <TableCell>{ag.paciente_nome}</TableCell>
                                                <TableCell>{ag.tipo_consulta}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={ag.status}
                                                        size="small"
                                                        color={ag.status === 'confirmado' ? 'success' : ag.status === 'cancelado' ? 'error' : 'default'}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    {ag.compareceu === null ? (
                                                        <Chip label="Pendente" size="small" color="default" />
                                                    ) : (
                                                        <Chip 
                                                            label={ag.compareceu ? '✅ Compareceu' : '❌ Faltou'} 
                                                            size="small"
                                                            color={ag.compareceu ? 'success' : 'error'}
                                                        />
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Card>
                </Grid>
            </Grid>
        </Layout>
    );
}