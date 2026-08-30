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
                .filter((a) => a.data === hoje)
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

    const nomePsicologo = user?.nome || 'Psicólogo';

    const cards = [
        {
            title: 'Pacientes',
            value: resumo.totalPacientes,
            icon: (
                <People
                    sx={{
                        fontSize: 40,
                        color: '#4a9eff'
                    }}
                />
            )
        },
        {
            title: 'Agendamentos Hoje',
            value: resumo.agendamentosHoje,
            icon: (
                <CalendarToday
                    sx={{
                        fontSize: 40,
                        color: '#ff6b6b'
                    }}
                />
            )
        },
        {
            title: 'Total de Agendamentos',
            value: resumo.totalAgendamentos,
            icon: (
                <TrendingUp
                    sx={{
                        fontSize: 40,
                        color: '#51cf66'
                    }}
                />
            )
        },
    ];

    return (
        <Layout>
            <Box
                sx={{
                    mb: 4,
                    p: 3,
                    bgcolor: '#ffffff',
                    borderRadius: 3,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                }}
            >
                <Typography
                    variant="h5"
                    sx={{
                        fontWeight: 'bold',
                        color: '#1a1a2e',
                        mb: 0.5,
                    }}
                >
                    Bem-vindo de volta, {nomePsicologo}!
                </Typography>

                <Typography
                    variant="body1"
                    sx={{
                        color: 'text.secondary',
                    }}
                >
                    Aqui está o resumo dos seus atendimentos e pacientes.
                </Typography>
            </Box>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                {cards.map((card) => (
                    <Grid item xs={12} sm={4} key={card.title}>
                        <Card
                            sx={{
                                borderRadius: 3,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                height: '100%',
                                transition: '0.2s',
                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
                                }
                            }}
                        >
                            <CardContent>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Box>
                                        <Typography
                                            variant="h4"
                                            sx={{
                                                fontWeight: 'bold',
                                                color: '#1a1a2e',
                                            }}
                                        >
                                            {loading ? '...' : card.value}
                                        </Typography>

                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: 'text.secondary',
                                                mt: 0.5,
                                            }}
                                        >
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

            <Card
                sx={{
                    borderRadius: 3,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                }}
            >
                <CardContent>
                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 'bold',
                            mb: 2,
                            color: '#1a1a2e',
                        }}
                    >
                        📅 Agenda de Hoje
                    </Typography>

                    <Divider sx={{ mb: 2 }} />

                    {loading ? (
                        <Typography>
                            Carregando...
                        </Typography>
                    ) : agendamentosHoje.length === 0 ? (
                        <Typography sx={{ color: 'text.secondary' }}>
                            Nenhum agendamento para hoje.
                        </Typography>
                    ) : (
                        <List>
                            {agendamentosHoje.map((ag) => (
                                <ListItem
                                    key={ag.id}
                                    divider
                                    sx={{
                                        px: 0,
                                    }}
                                >
                                    <ListItemText
                                        primary={
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 2,
                                                    flexWrap: 'wrap',
                                                }}
                                            >
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        fontWeight: 'bold',
                                                        minWidth: 60,
                                                    }}
                                                >
                                                    {ag.horario.slice(0, 5)}
                                                </Typography>

                                                <Typography>
                                                    {ag.paciente_nome}
                                                </Typography>

                                                <Chip
                                                    label={ag.status}
                                                    size="small"
                                                    color={
                                                        ag.status === 'confirmado'
                                                            ? 'success'
                                                            : 'default'
                                                    }
                                                    sx={{
                                                        fontSize: '0.7rem',
                                                    }}
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