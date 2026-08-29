import React, { useState, useEffect } from 'react';
import {
    Grid,
    Card,
    CardContent,
    Typography,
    Box,
    List,
    ListItem,
    ListItemText,
    Chip,
    Divider,
} from '@mui/material';
import {
    People,
    CalendarToday,
    TrendingUp,
} from '@mui/icons-material';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Dashboard() {
    const { user } = useAuth();
    const [resumo, setResumo] = useState({
        totalPacientes: 0,
        agendamentosHoje: 0,
        totalAgendamentos: 0,
    });
    const [agendamentosHoje, setAgendamentosHoje] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        carregarDados();
    }, []);

    const carregarDados = async () => {
        try {
            const [pacientes, agendamentos] = await Promise.all([
                api.get('/pacientes'),
                api.get('/agendamentos'),
            ]);

            const hoje = new Date().toISOString().split('T')[0];
            const agendamentosHojeList = agendamentos.data
                .filter(a => a.data === hoje)
                .sort((a, b) => a.horario.localeCompare(b.horario));

            setResumo({
                totalPacientes: pacientes.data.length,
                agendamentosHoje: agendamentosHojeList.length,
                totalAgendamentos: agendamentos.data.length,
            });
            setAgendamentosHoje(agendamentosHojeList);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    const cards = [
        { title: 'Pacientes', value: resumo.totalPacientes, icon: <People sx={{ fontSize: 40, color: '#4a9eff' }} /> },
        { title: 'Agendamentos Hoje', value: resumo.agendamentosHoje, icon: <CalendarToday sx={{ fontSize: 40, color: '#ff6b6b' }} /> },
        { title: 'Total de Agendamentos', value: resumo.totalAgendamentos, icon: <TrendingUp sx={{ fontSize: 40, color: '#51cf66' }} /> },
    ];

    return (
        <Layout>
            <Box sx={{ mb: 4 }}>
                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                    Bem-vindo de volta, <strong>{user?.nome_completo || 'Psicólogo'}</strong>! Aqui está o seu resumo.
                </Typography>
            </Box>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                {cards.map((card) => (
                    <Grid item xs={12} sm={4} key={card.title}>
                        <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box>
                                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                            {loading ? '...' : card.value}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                            {card.title}
                                        </Typography>
                                    </Box>
                                    {card.icon}
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                        📅 Agenda de Hoje
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    {loading ? (
                        <Typography>Carregando...</Typography>
                    ) : agendamentosHoje.length === 0 ? (
                        <Typography sx={{ color: 'text.secondary' }}>
                            Nenhum agendamento para hoje. 🎉
                        </Typography>
                    ) : (
                        <List>
                            {agendamentosHoje.map((ag) => (
                                <ListItem key={ag.id} divider>
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: 60 }}>
                                                    {ag.horario.slice(0, 5)}
                                                </Typography>
                                                <Typography>{ag.paciente_nome}</Typography>
                                                <Chip
                                                    label={ag.status}
                                                    size="small"
                                                    color={ag.status === 'confirmado' ? 'success' : 'default'}
                                                    sx={{ fontSize: '0.7rem' }}
                                                />
                                            </Box>
                                        }
                                    />
                                </ListItem>
                            ))}
                        </List>
                    )}
                </CardContent>
            </Card>
        </Layout>
    );
}