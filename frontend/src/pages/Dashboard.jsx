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
    TextField,
    Button,
    Alert,
    IconButton,
    InputAdornment,
} from '@mui/material';
import {
    People,
    CalendarToday,
    TrendingUp,
    Lock,
    Visibility,
    VisibilityOff,
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

    const [senhaAtual, setSenhaAtual] = useState('');
    const [novaSenha, setNovaSenha] = useState('');
    const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('');

    const [mostrarSenhaAtual, setMostrarSenhaAtual] = useState(false);
    const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);
    const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);

    const [alterandoSenha, setAlterandoSenha] = useState(false);
    const [mensagemSenha, setMensagemSenha] = useState('');
    const [erroSenha, setErroSenha] = useState('');

    const obterDataLocal = () => {
        const agora = new Date();

        const ano = agora.getFullYear();
        const mes = String(agora.getMonth() + 1).padStart(2, '0');
        const dia = String(agora.getDate()).padStart(2, '0');

        return `${ano}-${mes}-${dia}`;
    };

    const normalizarData = (data) => {
        if (!data) return '';

        return String(data).split('T')[0];
    };

    const carregarDados = async () => {
        try {
            const [pacientes, agendamentos] = await Promise.all([
                api.get('/pacientes'),
                api.get('/agendamentos'),
            ]);

            const hoje = obterDataLocal();

            const agendamentosHojeList = agendamentos.data
                .filter((a) => normalizarData(a.data) === hoje)
                .sort((a, b) =>
                    String(a.horario || '').localeCompare(
                        String(b.horario || '')
                    )
                );

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

    useEffect(() => {
        carregarDados();
    }, []);

    const alterarSenha = async (event) => {
        event.preventDefault();

        setMensagemSenha('');
        setErroSenha('');

        if (!senhaAtual || !novaSenha || !confirmarNovaSenha) {
            setErroSenha('Preencha todos os campos de senha.');
            return;
        }

        if (novaSenha !== confirmarNovaSenha) {
            setErroSenha(
                'A nova senha e a confirmação não são iguais.'
            );
            return;
        }

        const possuiMaiuscula = /[A-Z]/.test(novaSenha);
        const possuiMinuscula = /[a-z]/.test(novaSenha);
        const possuiNumero = /[0-9]/.test(novaSenha);
        const possuiEspecial = /[^A-Za-z0-9]/.test(novaSenha);

        if (
            novaSenha.length < 8 ||
            !possuiMaiuscula ||
            !possuiMinuscula ||
            !possuiNumero ||
            !possuiEspecial
        ) {
            setErroSenha(
                'A nova senha não atende aos requisitos informados.'
            );
            return;
        }

        try {
            setAlterandoSenha(true);

            const response = await api.put('/auth/alterar-senha', {
                senhaAtual,
                novaSenha,
                confirmarNovaSenha,
            });

            setMensagemSenha(
                response.data?.message ||
                    'Senha alterada com sucesso.'
            );

            setSenhaAtual('');
            setNovaSenha('');
            setConfirmarNovaSenha('');
        } catch (error) {
            console.error('Erro ao alterar senha:', error);

            setErroSenha(
                error.response?.data?.error ||
                    'Não foi possível alterar a senha.'
            );
        } finally {
            setAlterandoSenha(false);
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
                        color: '#4a9eff',
                    }}
                />
            ),
        },
        {
            title: 'Agendamentos Hoje',
            value: resumo.agendamentosHoje,
            icon: (
                <CalendarToday
                    sx={{
                        fontSize: 40,
                        color: '#ff6b6b',
                    }}
                />
            ),
        },
        {
            title: 'Total de Agendamentos',
            value: resumo.totalAgendamentos,
            icon: (
                <TrendingUp
                    sx={{
                        fontSize: 40,
                        color: '#51cf66',
                    }}
                />
            ),
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
                                boxShadow:
                                    '0 2px 8px rgba(0,0,0,0.05)',
                                height: '100%',
                                transition: '0.2s',
                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow:
                                        '0 4px 14px rgba(0,0,0,0.08)',
                                },
                            }}
                        >
                            <CardContent>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent:
                                            'space-between',
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
                                            {loading
                                                ? '...'
                                                : card.value}
                                        </Typography>

                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color:
                                                    'text.secondary',
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
                    mb: 4,
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
                        Agenda de Hoje
                    </Typography>

                    <Divider sx={{ mb: 2 }} />

                    {loading ? (
                        <Typography>
                            Carregando...
                        </Typography>
                    ) : agendamentosHoje.length === 0 ? (
                        <Typography
                            sx={{
                                color: 'text.secondary',
                            }}
                        >
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
                                                    alignItems:
                                                        'center',
                                                    gap: 2,
                                                    flexWrap:
                                                        'wrap',
                                                }}
                                            >
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        fontWeight:
                                                            'bold',
                                                        minWidth: 60,
                                                    }}
                                                >
                                                    {ag.horario
                                                        ? ag.horario.slice(
                                                              0,
                                                              5
                                                          )
                                                        : '-'}
                                                </Typography>

                                                <Typography>
                                                    {
                                                        ag.paciente_nome
                                                    }
                                                </Typography>

                                                <Chip
                                                    label={ag.status}
                                                    size="small"
                                                    color={
                                                        ag.status ===
                                                        'confirmado'
                                                            ? 'success'
                                                            : 'default'
                                                    }
                                                    sx={{
                                                        fontSize:
                                                            '0.7rem',
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

            <Card
                sx={{
                    borderRadius: 3,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                }}
            >
                <CardContent>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            mb: 1,
                        }}
                    >
                        <Lock
                            sx={{
                                color: '#7B944A',
                            }}
                        />

                        <Typography
                            variant="h6"
                            sx={{
                                fontWeight: 'bold',
                                color: '#1a1a2e',
                            }}
                        >
                            Alterar senha
                        </Typography>
                    </Box>

                    <Typography
                        variant="body2"
                        sx={{
                            color: 'text.secondary',
                            mb: 2,
                        }}
                    >
                        Altere sua senha de acesso ao sistema.
                    </Typography>

                    <Divider sx={{ mb: 3 }} />

                    {mensagemSenha && (
                        <Alert
                            severity="success"
                            sx={{ mb: 3 }}
                        >
                            {mensagemSenha}
                        </Alert>
                    )}

                    {erroSenha && (
                        <Alert
                            severity="error"
                            sx={{ mb: 3 }}
                        >
                            {erroSenha}
                        </Alert>
                    )}

                    <Box
                        component="form"
                        onSubmit={alterarSenha}
                        sx={{
                            maxWidth: 520,
                        }}
                    >
                        <TextField
                            fullWidth
                            label="Senha atual"
                            type={
                                mostrarSenhaAtual
                                    ? 'text'
                                    : 'password'
                            }
                            value={senhaAtual}
                            onChange={(event) =>
                                setSenhaAtual(event.target.value)
                            }
                            autoComplete="current-password"
                            sx={{ mb: 2 }}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() =>
                                                setMostrarSenhaAtual(
                                                    (valor) =>
                                                        !valor
                                                )
                                            }
                                            edge="end"
                                            type="button"
                                            aria-label={
                                                mostrarSenhaAtual
                                                    ? 'Ocultar senha'
                                                    : 'Mostrar senha'
                                            }
                                        >
                                            {mostrarSenhaAtual ? (
                                                <VisibilityOff />
                                            ) : (
                                                <Visibility />
                                            )}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <TextField
                            fullWidth
                            label="Nova senha"
                            type={
                                mostrarNovaSenha
                                    ? 'text'
                                    : 'password'
                            }
                            value={novaSenha}
                            onChange={(event) =>
                                setNovaSenha(event.target.value)
                            }
                            autoComplete="new-password"
                            sx={{ mb: 2 }}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() =>
                                                setMostrarNovaSenha(
                                                    (valor) =>
                                                        !valor
                                                )
                                            }
                                            edge="end"
                                            type="button"
                                            aria-label={
                                                mostrarNovaSenha
                                                    ? 'Ocultar senha'
                                                    : 'Mostrar senha'
                                            }
                                        >
                                            {mostrarNovaSenha ? (
                                                <VisibilityOff />
                                            ) : (
                                                <Visibility />
                                            )}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <TextField
                            fullWidth
                            label="Confirmar nova senha"
                            type={
                                mostrarConfirmacao
                                    ? 'text'
                                    : 'password'
                            }
                            value={confirmarNovaSenha}
                            onChange={(event) =>
                                setConfirmarNovaSenha(
                                    event.target.value
                                )
                            }
                            autoComplete="new-password"
                            sx={{ mb: 2 }}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() =>
                                                setMostrarConfirmacao(
                                                    (valor) =>
                                                        !valor
                                                )
                                            }
                                            edge="end"
                                            type="button"
                                            aria-label={
                                                mostrarConfirmacao
                                                    ? 'Ocultar senha'
                                                    : 'Mostrar senha'
                                            }
                                        >
                                            {mostrarConfirmacao ? (
                                                <VisibilityOff />
                                            ) : (
                                                <Visibility />
                                            )}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <Box
                            sx={{
                                bgcolor: '#f8faf5',
                                border: '1px solid #e3e9d8',
                                borderRadius: 2,
                                p: 2,
                                mb: 3,
                            }}
                        >
                            <Typography
                                variant="body2"
                                sx={{
                                    fontWeight: 600,
                                    color: '#4f6331',
                                    mb: 0.5,
                                }}
                            >
                                A nova senha deve conter:
                            </Typography>

                            <Typography
                                variant="body2"
                                sx={{
                                    color: 'text.secondary',
                                    lineHeight: 1.7,
                                }}
                            >
                                Pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas, números e caracteres especiais.
                            </Typography>
                        </Box>

                        <Button
                            type="submit"
                            variant="contained"
                            disabled={alterandoSenha}
                            sx={{
                                bgcolor: '#7B944A',
                                textTransform: 'none',
                                fontWeight: 600,
                                px: 3,
                                '&:hover': {
                                    bgcolor: '#687F3E',
                                },
                            }}
                        >
                            {alterandoSenha
                                ? 'Alterando...'
                                : 'Alterar senha'}
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </Layout>
    );
}