import React, { useEffect, useMemo, useState } from 'react';

import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    MenuItem,
    Paper,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tabs,
    TextField,
    Typography,
} from '@mui/material';

import {
    AttachMoney,
    Block,
    CalendarToday,
    CheckCircle,
    Delete,
    Edit,
    MedicalServices,
    People,
    Refresh,
    TrendingDown,
    TrendingUp,
} from '@mui/icons-material';

import Layout from '../components/Layout';
import CalendarioAgenda from '../components/CalendarioAgenda';
import api from '../services/api';
import familia from '../assets/familia.png';

const COR_PRINCIPAL = '#7B944A';
const COR_PRINCIPAL_HOVER = '#687F3E';

const COR_TEXTO = '#334155';
const COR_TEXTO_SECUNDARIO = '#64748B';
const COR_BORDA = '#E8ECEF';
const COR_FUNDO_TABELA = '#F8FAFC';

const cardStyle = {
    borderRadius: 3,
    border: `1px solid ${COR_BORDA}`,
    boxShadow: '0 3px 14px rgba(15, 23, 42, 0.04)',
};

const tituloStyle = {
    fontWeight: 600,
    color: COR_TEXTO,
    letterSpacing: '-0.01em',
};

const tableHeadCellStyle = {
    fontWeight: 600,
    color: '#475569',
    bgcolor: COR_FUNDO_TABELA,
    whiteSpace: 'nowrap',
};

export default function DashboardAdmin() {
    const [estatisticas, setEstatisticas] = useState({
        total_psicologos: 0,
        total_pacientes: 0,
        total_agendamentos: 0,
        agendamentos_hoje: 0,
        total_faturamento: 0,
        faturamento_realizado: 0,
        faturamento_previsto: 0,
        faturamento_potencial: 0,
    });

    const [psicologos, setPsicologos] = useState([]);
    const [agendamentosHoje, setAgendamentosHoje] = useState([]);

    const [resumoFaturamento, setResumoFaturamento] = useState({
        faturamento_realizado: 0,
        faturamento_previsto: 0,
        total: 0,
        repasse_psicologo: 0,
        comissao_clinica: 0,
        consultas_realizadas: 0,
        consultas_previstas: 0,
        faltas: 0,
        ticket_medio: 0,
    });

    const [faturamento, setFaturamento] = useState([]);
    const [estatisticasPresenca, setEstatisticasPresenca] = useState([]);

    const [relatorioAtendimentos, setRelatorioAtendimentos] =
        useState([]);

    const [pacientesPorPsicologo, setPacientesPorPsicologo] =
        useState([]);

    const [agendamentosCancelados, setAgendamentosCancelados] =
        useState([]);

    const [loading, setLoading] = useState(true);
    const [atualizando, setAtualizando] = useState(false);
    const [carregandoRelatorio, setCarregandoRelatorio] =
        useState(false);

    const [tab, setTab] = useState(0);
    const [mostrarEasterEgg, setMostrarEasterEgg] = useState(false);
    const [easterEggVisivel, setEasterEggVisivel] = useState(false);

    const [filtros, setFiltros] = useState({
        psicologo_id: '',
        data_inicio: '',
        data_fim: '',
        tipo: '',
    });

    const [filtroFaturamento, setFiltroFaturamento] = useState({
        data_inicio: '',
        data_fim: '',
    });

    const [openConfirm, setOpenConfirm] = useState(false);

    const [selectedPsicologo, setSelectedPsicologo] =
        useState(null);

    const [openEditarPsicologo, setOpenEditarPsicologo] =
        useState(false);

    const [salvandoPsicologo, setSalvandoPsicologo] =
        useState(false);

    const [formPsicologo, setFormPsicologo] = useState({
        nome_completo: '',
        email: '',
        crp: '',
        especialidade: '',
        telefone: '',
    });

    const obterDataLocal = (data = new Date()) => {
        const ano = data.getFullYear();
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const dia = String(data.getDate()).padStart(2, '0');

        return `${ano}-${mes}-${dia}`;
    };

    const normalizarData = (data) => {
        if (!data) {
            return '';
        }

        return String(data).split('T')[0];
    };

    const formatarData = (data) => {
        if (!data) {
            return '-';
        }

        const dataString = normalizarData(data);
        const [ano, mes, dia] = dataString.split('-');

        if (!ano || !mes || !dia) {
            return dataString;
        }

        return `${dia}/${mes}/${ano}`;
    };

    const formatarHorario = (horario) => {
        if (!horario) {
            return '-';
        }

        return String(horario).slice(0, 5);
    };

    const numero = (valor) => {
        const convertido = Number(valor);

        return Number.isFinite(convertido)
            ? convertido
            : 0;
    };

    const inteiro = (valor) => {
        const convertido = parseInt(valor, 10);

        return Number.isFinite(convertido)
            ? convertido
            : 0;
    };

    const formatarValor = (valor) => {
        return numero(valor).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        });
    };

    const carregarDashboard = async () => {
        try {
            const hoje = obterDataLocal();

            const [
                statsRes,
                psicologosRes,
                agendamentosRes,
            ] = await Promise.all([
                api.get('/admin/estatisticas'),
                api.get('/admin/psicologos'),
                api.get('/admin/agendamentos'),
            ]);

            setEstatisticas(statsRes.data || {});
            setPsicologos(psicologosRes.data || []);

            const hojeLista = (
                agendamentosRes.data || []
            )
                .filter(
                    (agendamento) =>
                        normalizarData(agendamento.data) === hoje &&
                        agendamento.status !== 'cancelado'
                )
                .sort((a, b) =>
                    String(a.horario || '').localeCompare(
                        String(b.horario || '')
                    )
                );

            setAgendamentosHoje(hojeLista);
        } catch (error) {
            console.error(
                'Erro ao carregar dashboard:',
                error
            );
        } finally {
            setLoading(false);
        }
    };

    const carregarFinanceiro = async (
        params = new URLSearchParams()
    ) => {
        try {
            const query = params.toString();
            const sufixo = query ? `?${query}` : '';

            const [resumoRes, faturamentoRes] =
                await Promise.all([
                    api.get(
                        `/admin/faturamento/resumo${sufixo}`
                    ),
                    api.get(
                        `/admin/faturamento/completo${sufixo}`
                    ),
                ]);

            setResumoFaturamento(
                resumoRes.data || {}
            );

            setFaturamento(
                faturamentoRes.data || []
            );
        } catch (error) {
            console.error(
                'Erro ao carregar faturamento:',
                error
            );
        }
    };

    const carregarEstatisticasPresenca = async () => {
        try {
            const response = await api.get(
                '/admin/estatisticas/presenca'
            );

            setEstatisticasPresenca(
                response.data || []
            );
        } catch (error) {
            console.error(
                'Erro ao carregar estatísticas de presença:',
                error
            );
        }
    };

    useEffect(() => {
    const carregarInicial = async () => {
        await Promise.all([
            carregarDashboard(),
            carregarFinanceiro(),
            carregarEstatisticasPresenca(),
        ]);
    };

    carregarInicial();
}, []);

useEffect(() => {
    let timerSaida;
    let timerRemover;

    const timerAbrir = setTimeout(() => {
        setMostrarEasterEgg(true);

        requestAnimationFrame(() => {
            setEasterEggVisivel(true);
        });

        timerSaida = setTimeout(() => {
            setEasterEggVisivel(false);
        }, 1700);

        timerRemover = setTimeout(() => {
            setMostrarEasterEgg(false);
        }, 2000);
    }, 3000);

    return () => {
        clearTimeout(timerAbrir);
        clearTimeout(timerSaida);
        clearTimeout(timerRemover);
    };
}, []);

    const atualizarDados = async () => {
        try {
            setAtualizando(true);

            await Promise.all([
                carregarDashboard(),
                carregarFinanceiro(),
                carregarEstatisticasPresenca(),
            ]);
        } finally {
            setAtualizando(false);
        }
    };

    const carregarRelatorios = async () => {
        try {
            setCarregandoRelatorio(true);

            const params = new URLSearchParams();

            if (filtros.psicologo_id) {
                params.append(
                    'psicologo_id',
                    filtros.psicologo_id
                );
            }

            if (filtros.data_inicio) {
                params.append(
                    'data_inicio',
                    filtros.data_inicio
                );
            }

            if (filtros.data_fim) {
                params.append(
                    'data_fim',
                    filtros.data_fim
                );
            }

            if (filtros.tipo) {
                params.append(
                    'tipo',
                    filtros.tipo
                );
            }

            const [
                atendimentosRes,
                pacientesRes,
                canceladosRes,
            ] = await Promise.all([
                api.get(
                    `/admin/relatorios/atendimentos?${params}`
                ),

                api.get(
                    '/admin/relatorios/pacientes-por-psicologo'
                ),

                api.get(
                    `/admin/relatorios/agendamentos-cancelados?${params}`
                ),
            ]);

            setRelatorioAtendimentos(
                atendimentosRes.data || []
            );

            setPacientesPorPsicologo(
                pacientesRes.data || []
            );

            setAgendamentosCancelados(
                canceladosRes.data || []
            );
        } catch (error) {
            console.error(
                'Erro ao carregar relatórios:',
                error
            );
        } finally {
            setCarregandoRelatorio(false);
        }
    };

    const carregarFaturamentoComFiltro = async () => {
        try {
            setCarregandoRelatorio(true);

            const params = new URLSearchParams();

            if (filtroFaturamento.data_inicio) {
                params.append(
                    'data_inicio',
                    filtroFaturamento.data_inicio
                );
            }

            if (filtroFaturamento.data_fim) {
                params.append(
                    'data_fim',
                    filtroFaturamento.data_fim
                );
            }

            await carregarFinanceiro(params);
        } finally {
            setCarregandoRelatorio(false);
        }
    };

    const definirPeriodo = (tipo) => {
        const hoje = new Date();
        let inicio = null;

        if (tipo === 'mes') {
            inicio = new Date(
                hoje.getFullYear(),
                hoje.getMonth(),
                1
            );
        }

        if (tipo === 'semana') {
            inicio = new Date(hoje);
            inicio.setDate(hoje.getDate() - 7);
        }

        if (tipo === '30dias') {
            inicio = new Date(hoje);
            inicio.setDate(hoje.getDate() - 30);
        }

        if (!inicio) {
            setFiltroFaturamento({
                data_inicio: '',
                data_fim: '',
            });

            return;
        }

        setFiltroFaturamento({
            data_inicio: obterDataLocal(inicio),
            data_fim: obterDataLocal(hoje),
        });
    };

    const handleBloquear = async (id, ativo) => {
        try {
            await api.put(
                `/admin/psicologos/${id}/bloquear`,
                { ativo }
            );

            await carregarDashboard();
        } catch (error) {
            alert(
                error.response?.data?.error ||
                    'Erro ao alterar status do psicólogo.'
            );
        }
    };

    const handleRemover = async () => {
        if (!selectedPsicologo) {
            return;
        }

        try {
            await api.delete(
                `/admin/psicologos/${selectedPsicologo.id}`
            );

            alert(
                `Psicólogo "${selectedPsicologo.nome_completo}" removido com sucesso!`
            );

            setOpenConfirm(false);
            setSelectedPsicologo(null);

            await atualizarDados();
        } catch (error) {
            alert(
                error.response?.data?.error ||
                    'Erro ao remover psicólogo.'
            );
        }
    };

    const openConfirmDialog = (psicologo) => {
        setSelectedPsicologo(psicologo);
        setOpenConfirm(true);
    };

    const handleAbrirEditarPsicologo = (psicologo) => {
        setSelectedPsicologo(psicologo);

        setFormPsicologo({
            nome_completo:
                psicologo.nome_completo || '',
            email: psicologo.email || '',
            crp: psicologo.crp || '',
            especialidade:
                psicologo.especialidade || '',
            telefone: psicologo.telefone || '',
        });

        setOpenEditarPsicologo(true);
    };

    const handleFecharEditarPsicologo = () => {
        if (salvandoPsicologo) {
            return;
        }

        setOpenEditarPsicologo(false);
        setSelectedPsicologo(null);

        setFormPsicologo({
            nome_completo: '',
            email: '',
            crp: '',
            especialidade: '',
            telefone: '',
        });
    };

    const handleChangePsicologo = (e) => {
        const { name, value } = e.target;

        setFormPsicologo((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSalvarPsicologo = async () => {
        if (!formPsicologo.nome_completo.trim()) {
            alert(
                'O nome do psicólogo é obrigatório.'
            );

            return;
        }

        if (!formPsicologo.email.trim()) {
            alert(
                'O email do psicólogo é obrigatório.'
            );

            return;
        }

        try {
            setSalvandoPsicologo(true);

            await api.put(
                `/admin/psicologos/${selectedPsicologo.id}`,
                formPsicologo
            );

            alert(
                'Psicólogo atualizado com sucesso!'
            );

            setOpenEditarPsicologo(false);
            setSelectedPsicologo(null);

            setFormPsicologo({
                nome_completo: '',
                email: '',
                crp: '',
                especialidade: '',
                telefone: '',
            });

            await carregarDashboard();
        } catch (error) {
            alert(
                error.response?.data?.error ||
                    'Erro ao atualizar psicólogo.'
            );
        } finally {
            setSalvandoPsicologo(false);
        }
    };

    const renderStatus = (status) => {
        if (status === 'cancelado') {
            return (
                <Chip
                    label="Cancelado"
                    color="error"
                    size="small"
                    variant="outlined"
                />
            );
        }

        return (
            <Chip
                label="Confirmado"
                color="success"
                size="small"
                variant="outlined"
            />
        );
    };

    const cards = [
        {
            title: 'Psicólogos',
            value:
                estatisticas.total_psicologos || 0,
            icon: (
                <People
                    sx={{
                        fontSize: 34,
                        color: '#4A9EFF',
                    }}
                />
            ),
            bgColor: '#F4F8FF',
        },

        {
            title: 'Pacientes',
            value:
                estatisticas.total_pacientes || 0,
            icon: (
                <MedicalServices
                    sx={{
                        fontSize: 34,
                        color: '#51A965',
                    }}
                />
            ),
            bgColor: '#F4FAF5',
        },

        {
            title: 'Atendimentos Hoje',
            value:
                estatisticas.agendamentos_hoje || 0,
            icon: (
                <CalendarToday
                    sx={{
                        fontSize: 34,
                        color: '#E56B6F',
                    }}
                />
            ),
            bgColor: '#FFF6F5',
        },

        {
            title: 'Faturamento Realizado',
            value: formatarValor(
                estatisticas.faturamento_realizado ??
                    estatisticas.total_faturamento
            ),
            icon: (
                <AttachMoney
                    sx={{
                        fontSize: 34,
                        color: '#D49A18',
                    }}
                />
            ),
            bgColor: '#FFFAF0',
        },
    ];

    const rankingFaturamento = useMemo(() => {
        return [...faturamento].sort(
            (a, b) =>
                numero(b.faturamento_realizado) -
                numero(a.faturamento_realizado)
        );
    }, [faturamento]);

    const maiorFaturamento =
        rankingFaturamento.length > 0
            ? numero(
                  rankingFaturamento[0]
                      .faturamento_realizado
              )
            : 0;

    return (
    <Layout>
        {mostrarEasterEgg && (
            <Box
                sx={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 1600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 2,
                    bgcolor: 'rgba(15, 23, 42, 0.58)',
                    backdropFilter: 'blur(3px)',
                    pointerEvents: 'none',
                    opacity: easterEggVisivel ? 1 : 0,
                    transition: 'opacity 250ms ease',
                }}
            >
                <Box
                    component="img"
                    src={familia}
                    alt="Easter egg do administrador"
                    sx={{
                        display: 'block',
                        width: 'min(92vw, 720px)',
                        maxHeight: '78vh',
                        objectFit: 'contain',
                        borderRadius: 3,
                        boxShadow:
                            '0 24px 70px rgba(0, 0, 0, 0.38)',
                        transform: easterEggVisivel
                            ? 'scale(1)'
                            : 'scale(0.96)',
                        transition:
                            'transform 250ms ease, opacity 250ms ease',
                        opacity: easterEggVisivel ? 1 : 0,
                    }}
                />
            </Box>
        )}

        <Box
            >
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: {
                            xs: 'flex-start',
                            sm: 'center',
                        },
                        flexDirection: {
                            xs: 'column',
                            sm: 'row',
                        },
                        gap: 2,
                        mb: 4,
                    }}
                >
                    <Box>
                        <Typography
                            variant="h4"
                            sx={{
                                ...tituloStyle,
                                fontSize: {
                                    xs: '1.7rem',
                                    md: '2rem',
                                },
                            }}
                        >
                            Dashboard Admin
                        </Typography>

                        <Typography
                            variant="body2"
                            sx={{
                                color: COR_TEXTO_SECUNDARIO,
                                mt: 0.5,
                            }}
                        >
                            Visão geral da clínica e dos
                            atendimentos.
                        </Typography>
                    </Box>

                    <Button
                        variant="outlined"
                        onClick={atualizarDados}
                        disabled={atualizando}
                        startIcon={<Refresh />}
                        sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 500,
                            color: COR_PRINCIPAL,
                            borderColor: COR_PRINCIPAL,

                            '&:hover': {
                                borderColor:
                                    COR_PRINCIPAL_HOVER,
                                bgcolor:
                                    'rgba(123,148,74,0.05)',
                            },
                        }}
                    >
                        {atualizando
                            ? 'Atualizando...'
                            : 'Atualizar Dados'}
                    </Button>
                </Box>

                <Grid
                    container
                    spacing={3}
                    sx={{ mb: 4 }}
                >
                    {cards.map((card) => (
                        <Grid
                            item
                            xs={12}
                            sm={6}
                            lg={3}
                            key={card.title}
                        >
                            <Card
                                sx={{
                                    ...cardStyle,
                                    height: '100%',
                                    bgcolor:
                                        card.bgColor,
                                }}
                            >
                                <CardContent
                                    sx={{ p: 3 }}
                                >
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            justifyContent:
                                                'space-between',
                                            alignItems:
                                                'center',
                                            gap: 2,
                                        }}
                                    >
                                        <Box>
                                            <Typography
                                                variant="h4"
                                                sx={{
                                                    fontWeight: 600,
                                                    color: COR_TEXTO,
                                                    letterSpacing:
                                                        '-0.02em',
                                                }}
                                            >
                                                {loading
                                                    ? '...'
                                                    : card.value}
                                            </Typography>

                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: COR_TEXTO_SECUNDARIO,
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
                        ...cardStyle,
                        mb: 4,
                    }}
                >
                    <CardContent sx={{ p: 3 }}>
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent:
                                    'space-between',
                                alignItems: {
                                    xs: 'flex-start',
                                    sm: 'center',
                                },
                                flexDirection: {
                                    xs: 'column',
                                    sm: 'row',
                                },
                                gap: 2,
                                mb: 2,
                            }}
                        >
                            <Box>
                                <Typography
                                    variant="h6"
                                    sx={tituloStyle}
                                >
                                    Atendimentos de Hoje
                                </Typography>

                                <Typography
                                    variant="body2"
                                    sx={{
                                        color: COR_TEXTO_SECUNDARIO,
                                        mt: 0.3,
                                    }}
                                >
                                    Agenda do dia com
                                    paciente, profissional e
                                    horário.
                                </Typography>
                            </Box>

                            <Chip
                                label={`${agendamentosHoje.length} atendimento${
                                    agendamentosHoje.length ===
                                    1
                                        ? ''
                                        : 's'
                                }`}
                                size="small"
                                sx={{
                                    bgcolor: '#F1F5E8',
                                    color:
                                        COR_PRINCIPAL_HOVER,
                                    fontWeight: 500,
                                }}
                            />
                        </Box>

                        {agendamentosHoje.length ===
                        0 ? (
                            <Box
                                sx={{
                                    py: 5,
                                    textAlign: 'center',
                                    bgcolor:
                                        COR_FUNDO_TABELA,
                                    borderRadius: 2,
                                }}
                            >
                                <CalendarToday
                                    sx={{
                                        fontSize: 40,
                                        color: '#CBD5E1',
                                        mb: 1,
                                    }}
                                />

                                <Typography
                                    sx={{
                                        color: COR_TEXTO_SECUNDARIO,
                                    }}
                                >
                                    Nenhum atendimento
                                    agendado para hoje.
                                </Typography>
                            </Box>
                        ) : (
                            <TableContainer
                                component={Paper}
                                sx={{
                                    boxShadow: 'none',
                                    border: `1px solid ${COR_BORDA}`,
                                    borderRadius: 2,
                                }}
                            >
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell
                                                sx={
                                                    tableHeadCellStyle
                                                }
                                            >
                                                Horário
                                            </TableCell>

                                            <TableCell
                                                sx={
                                                    tableHeadCellStyle
                                                }
                                            >
                                                Paciente
                                            </TableCell>

                                            <TableCell
                                                sx={
                                                    tableHeadCellStyle
                                                }
                                            >
                                                Psicólogo
                                            </TableCell>

                                            <TableCell
                                                sx={
                                                    tableHeadCellStyle
                                                }
                                            >
                                                Modalidade
                                            </TableCell>

                                            <TableCell
                                                sx={
                                                    tableHeadCellStyle
                                                }
                                            >
                                                Valor
                                            </TableCell>

                                            <TableCell
                                                sx={
                                                    tableHeadCellStyle
                                                }
                                            >
                                                Status
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>

                                    <TableBody>
                                        {agendamentosHoje.map(
                                            (
                                                agendamento
                                            ) => (
                                                <TableRow
                                                    key={
                                                        agendamento.id
                                                    }
                                                    hover
                                                >
                                                    <TableCell>
                                                        <Typography
                                                            sx={{
                                                                fontWeight: 600,
                                                                color: COR_TEXTO,
                                                            }}
                                                        >
                                                            {formatarHorario(
                                                                agendamento.horario
                                                            )}
                                                        </Typography>
                                                    </TableCell>

                                                    <TableCell>
                                                        {
                                                            agendamento.paciente_nome
                                                        }
                                                    </TableCell>

                                                    <TableCell>
                                                        {
                                                            agendamento.psicologo_nome
                                                        }
                                                    </TableCell>

                                                    <TableCell
                                                        sx={{
                                                            textTransform:
                                                                'capitalize',
                                                        }}
                                                    >
                                                        {agendamento.tipo_consulta ||
                                                            '-'}
                                                    </TableCell>

                                                    <TableCell>
                                                        {formatarValor(
                                                            agendamento.valor_consulta
                                                        )}
                                                    </TableCell>

                                                    <TableCell>
                                                        {renderStatus(
                                                            agendamento.status
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </CardContent>
                </Card>

                <Tabs
                    value={tab}
                    onChange={(e, value) =>
                        setTab(value)
                    }
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                        mb: 3,

                        '& .MuiTab-root': {
                            textTransform: 'none',
                            fontWeight: 500,
                            color:
                                COR_TEXTO_SECUNDARIO,
                        },

                        '& .MuiTab-root.Mui-selected':
                            {
                                color:
                                    COR_PRINCIPAL_HOVER,
                                fontWeight: 600,
                            },

                        '& .MuiTabs-indicator': {
                            bgcolor: COR_PRINCIPAL,
                        },
                    }}
                >
                    <Tab label="👨‍⚕️ Psicólogos" />
                    <Tab label="📊 Relatórios" />
                    <Tab label="💰 Faturamento" />
                    <Tab label="📅 Agenda Geral" />
                </Tabs>

                {tab === 0 && (
                    <Card sx={cardStyle}>
                        <CardContent>
                            <Typography
                                variant="h6"
                                sx={{
                                    ...tituloStyle,
                                    mb: 2,
                                }}
                            >
                                Psicólogos Cadastrados
                            </Typography>

                            <TableContainer
                                component={Paper}
                                sx={{
                                    boxShadow: 'none',
                                    border: `1px solid ${COR_BORDA}`,
                                    borderRadius: 2,
                                    overflowX: 'auto',
                                }}
                            >
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell
                                                sx={
                                                    tableHeadCellStyle
                                                }
                                            >
                                                Nome
                                            </TableCell>

                                            <TableCell
                                                sx={
                                                    tableHeadCellStyle
                                                }
                                            >
                                                Email
                                            </TableCell>

                                            <TableCell
                                                sx={
                                                    tableHeadCellStyle
                                                }
                                            >
                                                CRP
                                            </TableCell>

                                            <TableCell
                                                align="center"
                                                sx={
                                                    tableHeadCellStyle
                                                }
                                            >
                                                Pacientes
                                            </TableCell>

                                            <TableCell
                                                align="center"
                                                sx={
                                                    tableHeadCellStyle
                                                }
                                            >
                                                Agendamentos
                                            </TableCell>

                                            <TableCell
                                                sx={
                                                    tableHeadCellStyle
                                                }
                                            >
                                                Status
                                            </TableCell>

                                            <TableCell
                                                align="right"
                                                sx={
                                                    tableHeadCellStyle
                                                }
                                            >
                                                Ações
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>

                                    <TableBody>
                                        {psicologos.map(
                                            (
                                                psicologo
                                            ) => (
                                                <TableRow
                                                    key={
                                                        psicologo.id
                                                    }
                                                    hover
                                                >
                                                    <TableCell
                                                        sx={{
                                                            fontWeight: 500,
                                                            color: COR_TEXTO,
                                                        }}
                                                    >
                                                        {
                                                            psicologo.nome_completo
                                                        }
                                                    </TableCell>

                                                    <TableCell>
                                                        {
                                                            psicologo.email
                                                        }
                                                    </TableCell>

                                                    <TableCell>
                                                        {psicologo.crp ||
                                                            '-'}
                                                    </TableCell>

                                                    <TableCell align="center">
                                                        {psicologo.total_pacientes ||
                                                            0}
                                                    </TableCell>

                                                    <TableCell align="center">
                                                        {psicologo.total_agendamentos ||
                                                            0}
                                                    </TableCell>

                                                    <TableCell>
                                                        <Chip
                                                            label={
                                                                psicologo.ativo
                                                                    ? 'Ativo'
                                                                    : 'Bloqueado'
                                                            }
                                                            size="small"
                                                            color={
                                                                psicologo.ativo
                                                                    ? 'success'
                                                                    : 'error'
                                                            }
                                                            variant="outlined"
                                                        />
                                                    </TableCell>

                                                    <TableCell align="right">
                                                        <IconButton
                                                            onClick={() =>
                                                                handleAbrirEditarPsicologo(
                                                                    psicologo
                                                                )
                                                            }
                                                            size="small"
                                                            sx={{
                                                                color: COR_PRINCIPAL,
                                                            }}
                                                        >
                                                            <Edit fontSize="small" />
                                                        </IconButton>

                                                        <IconButton
                                                            onClick={() =>
                                                                handleBloquear(
                                                                    psicologo.id,
                                                                    !psicologo.ativo
                                                                )
                                                            }
                                                            size="small"
                                                            color={
                                                                psicologo.ativo
                                                                    ? 'warning'
                                                                    : 'success'
                                                            }
                                                        >
                                                            {psicologo.ativo ? (
                                                                <Block fontSize="small" />
                                                            ) : (
                                                                <CheckCircle fontSize="small" />
                                                            )}
                                                        </IconButton>

                                                        <IconButton
                                                            onClick={() =>
                                                                openConfirmDialog(
                                                                    psicologo
                                                                )
                                                            }
                                                            size="small"
                                                            color="error"
                                                        >
                                                            <Delete fontSize="small" />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>
                )}

                {tab === 1 && (
                    <Box>
                        <Card
                            sx={{
                                ...cardStyle,
                                mb: 3,
                            }}
                        >
                            <CardContent>
                                <Typography
                                    variant="h6"
                                    sx={{
                                        ...tituloStyle,
                                        mb: 2,
                                    }}
                                >
                                    Filtros de Relatórios
                                </Typography>

                                <Grid
                                    container
                                    spacing={2}
                                >
                                    <Grid
                                        item
                                        xs={12}
                                        md={3}
                                    >
                                        <TextField
                                            select
                                            fullWidth
                                            label="Psicólogo"
                                            value={
                                                filtros.psicologo_id
                                            }
                                            onChange={(
                                                e
                                            ) =>
                                                setFiltros(
                                                    {
                                                        ...filtros,
                                                        psicologo_id:
                                                            e
                                                                .target
                                                                .value,
                                                    }
                                                )
                                            }
                                            size="small"
                                        >
                                            <MenuItem value="">
                                                Todos
                                            </MenuItem>

                                            {psicologos.map(
                                                (
                                                    psicologo
                                                ) => (
                                                    <MenuItem
                                                        key={
                                                            psicologo.id
                                                        }
                                                        value={
                                                            psicologo.id
                                                        }
                                                    >
                                                        {
                                                            psicologo.nome_completo
                                                        }
                                                    </MenuItem>
                                                )
                                            )}
                                        </TextField>
                                    </Grid>

                                    <Grid
                                        item
                                        xs={12}
                                        md={2}
                                    >
                                        <TextField
                                            fullWidth
                                            label="Data Início"
                                            type="date"
                                            value={
                                                filtros.data_inicio
                                            }
                                            onChange={(
                                                e
                                            ) =>
                                                setFiltros(
                                                    {
                                                        ...filtros,
                                                        data_inicio:
                                                            e
                                                                .target
                                                                .value,
                                                    }
                                                )
                                            }
                                            size="small"
                                            InputLabelProps={{
                                                shrink: true,
                                            }}
                                        />
                                    </Grid>

                                    <Grid
                                        item
                                        xs={12}
                                        md={2}
                                    >
                                        <TextField
                                            fullWidth
                                            label="Data Fim"
                                            type="date"
                                            value={
                                                filtros.data_fim
                                            }
                                            onChange={(
                                                e
                                            ) =>
                                                setFiltros(
                                                    {
                                                        ...filtros,
                                                        data_fim:
                                                            e
                                                                .target
                                                                .value,
                                                    }
                                                )
                                            }
                                            size="small"
                                            InputLabelProps={{
                                                shrink: true,
                                            }}
                                        />
                                    </Grid>

                                    <Grid
                                        item
                                        xs={12}
                                        md={2}
                                    >
                                        <TextField
                                            select
                                            fullWidth
                                            label="Tipo de Consulta"
                                            value={
                                                filtros.tipo
                                            }
                                            onChange={(
                                                e
                                            ) =>
                                                setFiltros(
                                                    {
                                                        ...filtros,
                                                        tipo: e
                                                            .target
                                                            .value,
                                                    }
                                                )
                                            }
                                            size="small"
                                        >
                                            <MenuItem value="">
                                                Todos
                                            </MenuItem>

                                            <MenuItem value="presencial">
                                                Presencial
                                            </MenuItem>

                                            <MenuItem value="online">
                                                Online
                                            </MenuItem>
                                        </TextField>
                                    </Grid>

                                    <Grid
                                        item
                                        xs={12}
                                        md={3}
                                    >
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            onClick={
                                                carregarRelatorios
                                            }
                                            disabled={
                                                carregandoRelatorio
                                            }
                                            sx={{
                                                height: 40,
                                                textTransform:
                                                    'none',
                                                fontWeight: 500,
                                                bgcolor:
                                                    COR_PRINCIPAL,

                                                '&:hover':
                                                    {
                                                        bgcolor:
                                                            COR_PRINCIPAL_HOVER,
                                                    },
                                            }}
                                        >
                                            {carregandoRelatorio
                                                ? 'Carregando...'
                                                : 'Gerar Relatórios'}
                                        </Button>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>

                        <Card
                            sx={{
                                ...cardStyle,
                                mb: 3,
                            }}
                        >
                            <CardContent>
                                <Typography
                                    variant="h6"
                                    sx={{
                                        ...tituloStyle,
                                        mb: 2,
                                    }}
                                >
                                    Atendimentos
                                </Typography>

                                {relatorioAtendimentos.length ===
                                0 ? (
                                    <Typography
                                        sx={{
                                            color: COR_TEXTO_SECUNDARIO,
                                            py: 3,
                                            textAlign:
                                                'center',
                                        }}
                                    >
                                        Use os filtros
                                        acima para gerar o
                                        relatório.
                                    </Typography>
                                ) : (
                                    <TableContainer
                                        component={Paper}
                                        sx={{
                                            boxShadow:
                                                'none',
                                            border: `1px solid ${COR_BORDA}`,
                                            borderRadius: 2,
                                        }}
                                    >
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    {[
                                                        'Data',
                                                        'Horário',
                                                        'Paciente',
                                                        'Psicólogo',
                                                        'Tipo',
                                                        'Status',
                                                        'Valor',
                                                    ].map(
                                                        (
                                                            titulo
                                                        ) => (
                                                            <TableCell
                                                                key={
                                                                    titulo
                                                                }
                                                                sx={
                                                                    tableHeadCellStyle
                                                                }
                                                            >
                                                                {
                                                                    titulo
                                                                }
                                                            </TableCell>
                                                        )
                                                    )}
                                                </TableRow>
                                            </TableHead>

                                            <TableBody>
                                                {relatorioAtendimentos
                                                    .slice(
                                                        0,
                                                        50
                                                    )
                                                    .map(
                                                        (
                                                            atendimento
                                                        ) => (
                                                            <TableRow
                                                                key={
                                                                    atendimento.id
                                                                }
                                                                hover
                                                            >
                                                                <TableCell>
                                                                    {formatarData(
                                                                        atendimento.data
                                                                    )}
                                                                </TableCell>

                                                                <TableCell>
                                                                    {formatarHorario(
                                                                        atendimento.horario
                                                                    )}
                                                                </TableCell>

                                                                <TableCell>
                                                                    {
                                                                        atendimento.paciente_nome
                                                                    }
                                                                </TableCell>

                                                                <TableCell>
                                                                    {
                                                                        atendimento.psicologo_nome
                                                                    }
                                                                </TableCell>

                                                                <TableCell
                                                                    sx={{
                                                                        textTransform:
                                                                            'capitalize',
                                                                    }}
                                                                >
                                                                    {atendimento.tipo_consulta ||
                                                                        '-'}
                                                                </TableCell>

                                                                <TableCell>
                                                                    {renderStatus(
                                                                        atendimento.status
                                                                    )}
                                                                </TableCell>

                                                                <TableCell>
                                                                    {formatarValor(
                                                                        atendimento.valor_consulta
                                                                    )}
                                                                </TableCell>
                                                            </TableRow>
                                                        )
                                                    )}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}
                            </CardContent>
                        </Card>

                        <Grid
                            container
                            spacing={3}
                        >
                            <Grid
                                item
                                xs={12}
                                md={6}
                            >
                                <Card
                                    sx={{
                                        ...cardStyle,
                                        height: '100%',
                                    }}
                                >
                                    <CardContent>
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                ...tituloStyle,
                                                mb: 2,
                                            }}
                                        >
                                            Pacientes por
                                            Psicólogo
                                        </Typography>

                                        {pacientesPorPsicologo.length ===
                                        0 ? (
                                            <Typography
                                                sx={{
                                                    color: COR_TEXTO_SECUNDARIO,
                                                }}
                                            >
                                                Gere um
                                                relatório para
                                                visualizar os
                                                dados.
                                            </Typography>
                                        ) : (
                                            pacientesPorPsicologo.map(
                                                (
                                                    item
                                                ) => (
                                                    <Box
                                                        key={
                                                            item.psicologo_id
                                                        }
                                                        sx={{
                                                            display:
                                                                'flex',
                                                            justifyContent:
                                                                'space-between',
                                                            gap: 2,
                                                            py: 1.4,
                                                            borderBottom: `1px solid ${COR_BORDA}`,
                                                        }}
                                                    >
                                                        <Typography>
                                                            {
                                                                item.psicologo_nome
                                                            }
                                                        </Typography>

                                                        <Typography
                                                            sx={{
                                                                color: COR_TEXTO_SECUNDARIO,
                                                            }}
                                                        >
                                                            <Box
                                                                component="span"
                                                                sx={{
                                                                    fontWeight: 600,
                                                                    color: COR_TEXTO,
                                                                }}
                                                            >
                                                                {item.total_pacientes ||
                                                                    0}
                                                            </Box>{' '}
                                                            pacientes
                                                        </Typography>
                                                    </Box>
                                                )
                                            )
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid
                                item
                                xs={12}
                                md={6}
                            >
                                <Card
                                    sx={{
                                        ...cardStyle,
                                        height: '100%',
                                    }}
                                >
                                    <CardContent>
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                ...tituloStyle,
                                                mb: 2,
                                            }}
                                        >
                                            Cancelamentos
                                        </Typography>

                                        {agendamentosCancelados.length ===
                                        0 ? (
                                            <Typography
                                                sx={{
                                                    color: COR_TEXTO_SECUNDARIO,
                                                }}
                                            >
                                                Gere um
                                                relatório para
                                                visualizar os
                                                dados.
                                            </Typography>
                                        ) : (
                                            agendamentosCancelados.map(
                                                (
                                                    item
                                                ) => (
                                                    <Box
                                                        key={
                                                            item.psicologo_nome
                                                        }
                                                        sx={{
                                                            display:
                                                                'flex',
                                                            justifyContent:
                                                                'space-between',
                                                            alignItems:
                                                                'center',
                                                            gap: 2,
                                                            py: 1.4,
                                                            borderBottom: `1px solid ${COR_BORDA}`,
                                                        }}
                                                    >
                                                        <Typography>
                                                            {
                                                                item.psicologo_nome
                                                            }
                                                        </Typography>

                                                        <Box>
                                                            <Box
                                                                component="span"
                                                                sx={{
                                                                    fontWeight: 600,
                                                                }}
                                                            >
                                                                {item.total_cancelados ||
                                                                    0}
                                                            </Box>{' '}
                                                            de{' '}
                                                            {item.total_agendamentos ||
                                                                0}

                                                            <Chip
                                                                label={`${item.taxa_cancelamento || 0}%`}
                                                                size="small"
                                                                color={
                                                                    numero(
                                                                        item.taxa_cancelamento
                                                                    ) >
                                                                    20
                                                                        ? 'error'
                                                                        : 'success'
                                                                }
                                                                variant="outlined"
                                                                sx={{
                                                                    ml: 1,
                                                                }}
                                                            />
                                                        </Box>
                                                    </Box>
                                                )
                                            )
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>

                        <Card
                            sx={{
                                ...cardStyle,
                                mt: 3,
                            }}
                        >
                            <CardContent>
                                <Typography
                                    variant="h6"
                                    sx={{
                                        ...tituloStyle,
                                        mb: 0.5,
                                    }}
                                >
                                    Taxa de Presença por
                                    Psicólogo
                                </Typography>

                                <Typography
                                    variant="body2"
                                    sx={{
                                        color: COR_TEXTO_SECUNDARIO,
                                        mb: 2,
                                    }}
                                >
                                    A taxa considera apenas
                                    atendimentos cujo dia e
                                    horário já passaram.
                                    Atendimentos futuros não
                                    entram no cálculo.
                                </Typography>

                                <TableContainer
                                    component={Paper}
                                    sx={{
                                        boxShadow: 'none',
                                        border: `1px solid ${COR_BORDA}`,
                                        borderRadius: 2,
                                        overflowX: 'auto',
                                    }}
                                >
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell
                                                    sx={
                                                        tableHeadCellStyle
                                                    }
                                                >
                                                    Psicólogo
                                                </TableCell>

                                                <TableCell
                                                    align="center"
                                                    sx={
                                                        tableHeadCellStyle
                                                    }
                                                >
                                                    Realizados
                                                </TableCell>

                                                <TableCell
                                                    align="center"
                                                    sx={
                                                        tableHeadCellStyle
                                                    }
                                                >
                                                    Compareceram
                                                </TableCell>

                                                <TableCell
                                                    align="center"
                                                    sx={
                                                        tableHeadCellStyle
                                                    }
                                                >
                                                    Faltaram
                                                </TableCell>

                                                <TableCell
                                                    align="center"
                                                    sx={
                                                        tableHeadCellStyle
                                                    }
                                                >
                                                    Presença
                                                </TableCell>
                                            </TableRow>
                                        </TableHead>

                                        <TableBody>
                                            {estatisticasPresenca.map(
                                                (
                                                    item
                                                ) => (
                                                    <TableRow
                                                        key={
                                                            item.psicologo_id
                                                        }
                                                        hover
                                                    >
                                                        <TableCell
                                                            sx={{
                                                                fontWeight: 500,
                                                            }}
                                                        >
                                                            {
                                                                item.psicologo_nome
                                                            }
                                                        </TableCell>

                                                        <TableCell align="center">
                                                            {inteiro(
                                                                item.total_agendamentos
                                                            )}
                                                        </TableCell>

                                                        <TableCell
                                                            align="center"
                                                            sx={{
                                                                color: '#2E7D32',
                                                                fontWeight: 500,
                                                            }}
                                                        >
                                                            {inteiro(
                                                                item.compareceram
                                                            )}
                                                        </TableCell>

                                                        <TableCell
                                                            align="center"
                                                            sx={{
                                                                color: '#C62828',
                                                                fontWeight: 500,
                                                            }}
                                                        >
                                                            {inteiro(
                                                                item.faltaram
                                                            )}
                                                        </TableCell>

                                                        <TableCell align="center">
                                                            <Chip
                                                                label={`${numero(
                                                                    item.taxa_presenca
                                                                ).toFixed(
                                                                    2
                                                                )}%`}
                                                                size="small"
                                                                color={
                                                                    numero(
                                                                        item.taxa_presenca
                                                                    ) >=
                                                                    80
                                                                        ? 'success'
                                                                        : numero(
                                                                                item.taxa_presenca
                                                                            ) >=
                                                                            50
                                                                          ? 'warning'
                                                                          : 'error'
                                                                }
                                                                variant="outlined"
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </CardContent>
                        </Card>
                    </Box>
                )}

                {tab === 2 && (
                    <Box>
                        <Card
                            sx={{
                                ...cardStyle,
                                mb: 3,
                            }}
                        >
                            <CardContent>
                                <Typography
                                    variant="h6"
                                    sx={{
                                        ...tituloStyle,
                                        mb: 2,
                                    }}
                                >
                                    Período Financeiro
                                </Typography>

                                <Grid
                                    container
                                    spacing={2}
                                    alignItems="center"
                                >
                                    <Grid
                                        item
                                        xs={12}
                                        md={3}
                                    >
                                        <TextField
                                            fullWidth
                                            label="Data Início"
                                            type="date"
                                            value={
                                                filtroFaturamento.data_inicio
                                            }
                                            onChange={(
                                                e
                                            ) =>
                                                setFiltroFaturamento(
                                                    {
                                                        ...filtroFaturamento,
                                                        data_inicio:
                                                            e
                                                                .target
                                                                .value,
                                                    }
                                                )
                                            }
                                            InputLabelProps={{
                                                shrink: true,
                                            }}
                                            size="small"
                                        />
                                    </Grid>

                                    <Grid
                                        item
                                        xs={12}
                                        md={3}
                                    >
                                        <TextField
                                            fullWidth
                                            label="Data Fim"
                                            type="date"
                                            value={
                                                filtroFaturamento.data_fim
                                            }
                                            onChange={(
                                                e
                                            ) =>
                                                setFiltroFaturamento(
                                                    {
                                                        ...filtroFaturamento,
                                                        data_fim:
                                                            e
                                                                .target
                                                                .value,
                                                    }
                                                )
                                            }
                                            InputLabelProps={{
                                                shrink: true,
                                            }}
                                            size="small"
                                        />
                                    </Grid>

                                    <Grid
                                        item
                                        xs={12}
                                        md={6}
                                    >
                                        <Box
                                            sx={{
                                                display:
                                                    'flex',
                                                gap: 1,
                                                flexWrap:
                                                    'wrap',
                                            }}
                                        >
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                onClick={() =>
                                                    definirPeriodo(
                                                        'mes'
                                                    )
                                                }
                                            >
                                                Este Mês
                                            </Button>

                                            <Button
                                                variant="outlined"
                                                size="small"
                                                onClick={() =>
                                                    definirPeriodo(
                                                        'semana'
                                                    )
                                                }
                                            >
                                                Últimos 7
                                                Dias
                                            </Button>

                                            <Button
                                                variant="outlined"
                                                size="small"
                                                onClick={() =>
                                                    definirPeriodo(
                                                        '30dias'
                                                    )
                                                }
                                            >
                                                Últimos 30
                                                Dias
                                            </Button>

                                            <Button
                                                variant="outlined"
                                                size="small"
                                                onClick={() =>
                                                    definirPeriodo(
                                                        'limpar'
                                                    )
                                                }
                                            >
                                                Limpar
                                            </Button>

                                            <Button
                                                variant="contained"
                                                size="small"
                                                onClick={
                                                    carregarFaturamentoComFiltro
                                                }
                                                disabled={
                                                    carregandoRelatorio
                                                }
                                                sx={{
                                                    bgcolor:
                                                        COR_PRINCIPAL,

                                                    '&:hover':
                                                        {
                                                            bgcolor:
                                                                COR_PRINCIPAL_HOVER,
                                                        },
                                                }}
                                            >
                                                {carregandoRelatorio
                                                    ? 'Carregando...'
                                                    : 'Aplicar'}
                                            </Button>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>

                        <Grid
                            container
                            spacing={3}
                            sx={{ mb: 3 }}
                        >
                            <Grid
                                item
                                xs={12}
                                sm={6}
                                lg={3}
                            >
                                <Card
                                    sx={{
                                        ...cardStyle,
                                        height: '100%',
                                        bgcolor:
                                            '#F4FAF5',
                                    }}
                                >
                                    <CardContent>
                                        <TrendingUp
                                            sx={{
                                                color:
                                                    '#2E7D32',
                                                mb: 1,
                                            }}
                                        />

                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: COR_TEXTO_SECUNDARIO,
                                            }}
                                        >
                                            Faturamento
                                            Realizado
                                        </Typography>

                                        <Typography
                                            variant="h5"
                                            sx={{
                                                fontWeight: 600,
                                                color: COR_TEXTO,
                                                mt: 0.5,
                                            }}
                                        >
                                            {formatarValor(
                                                resumoFaturamento.faturamento_realizado
                                            )}
                                        </Typography>

                                        <Typography
                                            variant="caption"
                                            sx={{
                                                color: COR_TEXTO_SECUNDARIO,
                                            }}
                                        >
                                            {inteiro(
                                                resumoFaturamento.consultas_realizadas
                                            )}{' '}
                                            atendimentos
                                            realizados
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid
                                item
                                xs={12}
                                sm={6}
                                lg={3}
                            >
                                <Card
                                    sx={{
                                        ...cardStyle,
                                        height: '100%',
                                        bgcolor:
                                            '#F4F8FF',
                                    }}
                                >
                                    <CardContent>
                                        <CalendarToday
                                            sx={{
                                                color:
                                                    '#4A9EFF',
                                                mb: 1,
                                            }}
                                        />

                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: COR_TEXTO_SECUNDARIO,
                                            }}
                                        >
                                            Faturamento
                                            Previsto
                                        </Typography>

                                        <Typography
                                            variant="h5"
                                            sx={{
                                                fontWeight: 600,
                                                color: COR_TEXTO,
                                                mt: 0.5,
                                            }}
                                        >
                                            {formatarValor(
                                                resumoFaturamento.faturamento_previsto
                                            )}
                                        </Typography>

                                        <Typography
                                            variant="caption"
                                            sx={{
                                                color: COR_TEXTO_SECUNDARIO,
                                            }}
                                        >
                                            {inteiro(
                                                resumoFaturamento.consultas_previstas
                                            )}{' '}
                                            atendimentos
                                            futuros
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid
                                item
                                xs={12}
                                sm={6}
                                lg={3}
                            >
                                <Card
                                    sx={{
                                        ...cardStyle,
                                        height: '100%',
                                        bgcolor:
                                            '#FFFAF0',
                                    }}
                                >
                                    <CardContent>
                                        <AttachMoney
                                            sx={{
                                                color:
                                                    '#D49A18',
                                                mb: 1,
                                            }}
                                        />

                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: COR_TEXTO_SECUNDARIO,
                                            }}
                                        >
                                            Ticket Médio
                                        </Typography>

                                        <Typography
                                            variant="h5"
                                            sx={{
                                                fontWeight: 600,
                                                color: COR_TEXTO,
                                                mt: 0.5,
                                            }}
                                        >
                                            {formatarValor(
                                                resumoFaturamento.ticket_medio
                                            )}
                                        </Typography>

                                        <Typography
                                            variant="caption"
                                            sx={{
                                                color: COR_TEXTO_SECUNDARIO,
                                            }}
                                        >
                                            por atendimento
                                            realizado
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid
                                item
                                xs={12}
                                sm={6}
                                lg={3}
                            >
                                <Card
                                    sx={{
                                        ...cardStyle,
                                        height: '100%',
                                        bgcolor:
                                            '#FFF6F5',
                                    }}
                                >
                                    <CardContent>
                                        <TrendingDown
                                            sx={{
                                                color:
                                                    '#C62828',
                                                mb: 1,
                                            }}
                                        />

                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: COR_TEXTO_SECUNDARIO,
                                            }}
                                        >
                                            Faltas
                                        </Typography>

                                        <Typography
                                            variant="h5"
                                            sx={{
                                                fontWeight: 600,
                                                color: COR_TEXTO,
                                                mt: 0.5,
                                            }}
                                        >
                                            {inteiro(
                                                resumoFaturamento.faltas
                                            )}
                                        </Typography>

                                        <Typography
                                            variant="caption"
                                            sx={{
                                                color: COR_TEXTO_SECUNDARIO,
                                            }}
                                        >
                                            atendimentos não
                                            realizados
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>

                        <Grid
                            container
                            spacing={3}
                            sx={{ mb: 3 }}
                        >
                            <Grid
                                item
                                xs={12}
                                md={5}
                            >
                                <Card
                                    sx={{
                                        ...cardStyle,
                                        height: '100%',
                                    }}
                                >
                                    <CardContent>
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                ...tituloStyle,
                                                mb: 0.5,
                                            }}
                                        >
                                            Distribuição
                                
                                        </Typography>

                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: COR_TEXTO_SECUNDARIO,
                                                mb: 3,
                                            }}
                                        >
                                            Divisão financeira
                                            apenas dos
                                            atendimentos já
                                            realizados.
                                        </Typography>

                                        <Box
                                            sx={{ mb: 3 }}
                                        >
                                            <Box
                                                sx={{
                                                    display:
                                                        'flex',
                                                    justifyContent:
                                                        'space-between',
                                                    mb: 1,
                                                }}
                                            >
                                                <Typography
                                                    sx={{
                                                        fontWeight: 500,
                                                    }}
                                                >
                                                    Clínica
                                                </Typography>

                                                <Typography
                                                    sx={{
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    {formatarValor(
                                                        resumoFaturamento.comissao_clinica
                                                    )}
                                                </Typography>
                                            </Box>

                                            <Box
                                                sx={{
                                                    height: 10,
                                                    bgcolor:
                                                        '#EEF1F3',
                                                    borderRadius: 10,
                                                    overflow:
                                                        'hidden',
                                                }}
                                            >
                                                <Box
                                                    sx={{
                                                        width: '60%',
                                                        height: '100%',
                                                        bgcolor:
                                                            COR_PRINCIPAL,
                                                        borderRadius: 10,
                                                    }}
                                                />
                                            </Box>

                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    color: COR_TEXTO_SECUNDARIO,
                                                }}
                                            >
                                                60% da receita
                                                realizada
                                            </Typography>
                                        </Box>

                                        <Box>
                                            <Box
                                                sx={{
                                                    display:
                                                        'flex',
                                                    justifyContent:
                                                        'space-between',
                                                    mb: 1,
                                                }}
                                            >
                                                <Typography
                                                    sx={{
                                                        fontWeight: 500,
                                                    }}
                                                >
                                                    Psicólogos
                                                </Typography>

                                                <Typography
                                                    sx={{
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    {formatarValor(
                                                        resumoFaturamento.repasse_psicologo
                                                    )}
                                                </Typography>
                                            </Box>

                                            <Box
                                                sx={{
                                                    height: 10,
                                                    bgcolor:
                                                        '#EEF1F3',
                                                    borderRadius: 10,
                                                    overflow:
                                                        'hidden',
                                                }}
                                            >
                                                <Box
                                                    sx={{
                                                        width: '40%',
                                                        height: '100%',
                                                        bgcolor:
                                                            '#4A9EFF',
                                                        borderRadius: 10,
                                                    }}
                                                />
                                            </Box>

                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    color: COR_TEXTO_SECUNDARIO,
                                                }}
                                            >
                                                40% da receita
                                                realizada
                                            </Typography>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid
                                item
                                xs={12}
                                md={7}
                            >
                                <Card
                                    sx={{
                                        ...cardStyle,
                                        height: '100%',
                                    }}
                                >
                                    <CardContent>
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                ...tituloStyle,
                                                mb: 0.5,
                                            }}
                                        >
                                            Ranking Financeiro
                                        </Typography>

                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: COR_TEXTO_SECUNDARIO,
                                                mb: 3,
                                            }}
                                        >
                                            Somente
                                            atendimentos já
                                            realizados no
                                            período selecionado.
                                        </Typography>

                                        {rankingFaturamento.length ===
                                        0 ? (
                                            <Typography
                                                sx={{
                                                    color: COR_TEXTO_SECUNDARIO,
                                                }}
                                            >
                                                Nenhum dado
                                                disponível.
                                            </Typography>
                                        ) : (
                                            rankingFaturamento.map(
                                                (
                                                    item,
                                                    index
                                                ) => {
                                                    const valor =
                                                        numero(
                                                            item.faturamento_realizado
                                                        );

                                                    const percentual =
                                                        maiorFaturamento >
                                                        0
                                                            ? Math.max(
                                                                  4,
                                                                  (valor /
                                                                      maiorFaturamento) *
                                                                      100
                                                              )
                                                            : 0;

                                                    return (
                                                        <Box
                                                            key={
                                                                item.psicologo_id
                                                            }
                                                            sx={{
                                                                mb: 2.5,
                                                            }}
                                                        >
                                                            <Box
                                                                sx={{
                                                                    display:
                                                                        'flex',
                                                                    justifyContent:
                                                                        'space-between',
                                                                    alignItems:
                                                                        'center',
                                                                    gap: 2,
                                                                    mb: 0.8,
                                                                }}
                                                            >
                                                                <Typography
                                                                    sx={{
                                                                        fontWeight: 500,
                                                                        color: COR_TEXTO,
                                                                    }}
                                                                >
                                                                    {index +
                                                                        1}
                                                                    .{' '}
                                                                    {
                                                                        item.psicologo_nome
                                                                    }
                                                                </Typography>

                                                                <Typography
                                                                    sx={{
                                                                        fontWeight: 600,
                                                                        color: COR_TEXTO,
                                                                    }}
                                                                >
                                                                    {formatarValor(
                                                                        valor
                                                                    )}
                                                                </Typography>
                                                            </Box>

                                                            <Box
                                                                sx={{
                                                                    height: 8,
                                                                    bgcolor:
                                                                        '#EEF1F3',
                                                                    borderRadius: 10,
                                                                    overflow:
                                                                        'hidden',
                                                                }}
                                                            >
                                                                <Box
                                                                    sx={{
                                                                        height:
                                                                            '100%',
                                                                        width: `${percentual}%`,
                                                                        bgcolor:
                                                                            COR_PRINCIPAL,
                                                                        borderRadius: 10,
                                                                    }}
                                                                />
                                                            </Box>

                                                            <Typography
                                                                variant="caption"
                                                                sx={{
                                                                    color: COR_TEXTO_SECUNDARIO,
                                                                }}
                                                            >
                                                                {inteiro(
                                                                    item.consultas_realizadas
                                                                )}{' '}
                                                                atendimentos
                                                                realizados
                                                                {' • '}
                                                                Ticket{' '}
                                                                {formatarValor(
                                                                    item.media_por_consulta
                                                                )}
                                                                {' • '}
                                                                Repasse{' '}
                                                                {formatarValor(
                                                                    item.repasse_psicologo
                                                                )}
                                                            </Typography>
                                                        </Box>
                                                    );
                                                }
                                            )
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>

                        <Card sx={cardStyle}>
                            <CardContent>
                                <Typography
                                    variant="h6"
                                    sx={{
                                        ...tituloStyle,
                                        mb: 0.5,
                                    }}
                                >
                                    Detalhamento Financeiro
                                </Typography>

                                <Typography
                                    variant="body2"
                                    sx={{
                                        color: COR_TEXTO_SECUNDARIO,
                                        mb: 2,
                                    }}
                                >
                                    Valores referentes
                                    somente aos atendimentos
                                    já realizados.
                                </Typography>

                                <TableContainer
                                    component={Paper}
                                    sx={{
                                        boxShadow: 'none',
                                        border: `1px solid ${COR_BORDA}`,
                                        borderRadius: 2,
                                        overflowX: 'auto',
                                    }}
                                >
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell
                                                    sx={
                                                        tableHeadCellStyle
                                                    }
                                                >
                                                    Psicólogo
                                                </TableCell>

                                                <TableCell
                                                    align="center"
                                                    sx={
                                                        tableHeadCellStyle
                                                    }
                                                >
                                                    Atendimentos
                                                </TableCell>

                                                <TableCell
                                                    align="right"
                                                    sx={
                                                        tableHeadCellStyle
                                                    }
                                                >
                                                    Faturado
                                                </TableCell>

                                                <TableCell
                                                    align="right"
                                                    sx={
                                                        tableHeadCellStyle
                                                    }
                                                >
                                                    Ticket
                                                    Médio
                                                </TableCell>

                                                <TableCell
                                                    align="right"
                                                    sx={
                                                        tableHeadCellStyle
                                                    }
                                                >
                                                    Repasse
                                                </TableCell>

                                                <TableCell
                                                    align="right"
                                                    sx={
                                                        tableHeadCellStyle
                                                    }
                                                >
                                                    Clínica
                                                </TableCell>
                                            </TableRow>
                                        </TableHead>

                                        <TableBody>
                                            {rankingFaturamento.map(
                                                (
                                                    item
                                                ) => (
                                                    <TableRow
                                                        key={
                                                            item.psicologo_id
                                                        }
                                                        hover
                                                    >
                                                        <TableCell
                                                            sx={{
                                                                fontWeight: 500,
                                                            }}
                                                        >
                                                            {
                                                                item.psicologo_nome
                                                            }
                                                        </TableCell>

                                                        <TableCell align="center">
                                                            {inteiro(
                                                                item.consultas_realizadas
                                                            )}
                                                        </TableCell>

                                                        <TableCell
                                                            align="right"
                                                            sx={{
                                                                fontWeight: 600,
                                                            }}
                                                        >
                                                            {formatarValor(
                                                                item.faturamento_realizado
                                                            )}
                                                        </TableCell>

                                                        <TableCell align="right">
                                                            {formatarValor(
                                                                item.media_por_consulta
                                                            )}
                                                        </TableCell>

                                                        <TableCell align="right">
                                                            {formatarValor(
                                                                item.repasse_psicologo
                                                            )}
                                                        </TableCell>

                                                        <TableCell align="right">
                                                            {formatarValor(
                                                                item.comissao_clinica
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            )}

                                            {rankingFaturamento.length >
                                                0 && (
                                                <TableRow
                                                    sx={{
                                                        bgcolor:
                                                            COR_FUNDO_TABELA,
                                                    }}
                                                >
                                                    <TableCell
                                                        sx={{
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        TOTAL
                                                    </TableCell>

                                                    <TableCell
                                                        align="center"
                                                        sx={{
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        {inteiro(
                                                            resumoFaturamento.consultas_realizadas
                                                        )}
                                                    </TableCell>

                                                    <TableCell
                                                        align="right"
                                                        sx={{
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        {formatarValor(
                                                            resumoFaturamento.faturamento_realizado
                                                        )}
                                                    </TableCell>

                                                    <TableCell
                                                        align="right"
                                                        sx={{
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        {formatarValor(
                                                            resumoFaturamento.ticket_medio
                                                        )}
                                                    </TableCell>

                                                    <TableCell
                                                        align="right"
                                                        sx={{
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        {formatarValor(
                                                            resumoFaturamento.repasse_psicologo
                                                        )}
                                                    </TableCell>

                                                    <TableCell
                                                        align="right"
                                                        sx={{
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        {formatarValor(
                                                            resumoFaturamento.comissao_clinica
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </CardContent>
                        </Card>
                    </Box>
                )}

                {tab === 3 && (
                    <Box>
                        <Typography
                            variant="h6"
                            sx={{
                                ...tituloStyle,
                                mb: 0.5,
                            }}
                        >
                            Agenda Geral
                        </Typography>

                        <Typography
                            variant="body2"
                            sx={{
                                color: COR_TEXTO_SECUNDARIO,
                                mb: 2,
                            }}
                        >
                            Visualize os atendimentos de
                            todos os profissionais.
                        </Typography>

                        <CalendarioAgenda
                            isAdmin={true}
                        />
                    </Box>
                )}

                <Dialog
                    open={openEditarPsicologo}
                    onClose={
                        handleFecharEditarPsicologo
                    }
                    fullWidth
                    maxWidth="sm"
                >
                    <DialogTitle
                        sx={{
                            ...tituloStyle,
                            fontSize: '1.25rem',
                        }}
                    >
                        Editar Psicólogo
                    </DialogTitle>

                    <DialogContent>
                        <TextField
                            fullWidth
                            label="Nome completo"
                            name="nome_completo"
                            value={
                                formPsicologo.nome_completo
                            }
                            onChange={
                                handleChangePsicologo
                            }
                            margin="normal"
                        />

                        <TextField
                            fullWidth
                            label="Email"
                            name="email"
                            type="email"
                            value={
                                formPsicologo.email
                            }
                            onChange={
                                handleChangePsicologo
                            }
                            margin="normal"
                        />

                        <TextField
                            fullWidth
                            label="CRP"
                            name="crp"
                            value={formPsicologo.crp}
                            onChange={
                                handleChangePsicologo
                            }
                            margin="normal"
                        />

                        <TextField
                            fullWidth
                            label="Especialidade"
                            name="especialidade"
                            value={
                                formPsicologo.especialidade
                            }
                            onChange={
                                handleChangePsicologo
                            }
                            margin="normal"
                        />

                        <TextField
                            fullWidth
                            label="Telefone"
                            name="telefone"
                            value={
                                formPsicologo.telefone
                            }
                            onChange={
                                handleChangePsicologo
                            }
                            margin="normal"
                        />
                    </DialogContent>

                    <DialogActions>
                        <Button
                            onClick={
                                handleFecharEditarPsicologo
                            }
                            disabled={
                                salvandoPsicologo
                            }
                        >
                            Cancelar
                        </Button>

                        <Button
                            onClick={
                                handleSalvarPsicologo
                            }
                            variant="contained"
                            disabled={
                                salvandoPsicologo
                            }
                            sx={{
                                bgcolor:
                                    COR_PRINCIPAL,
                                textTransform:
                                    'none',

                                '&:hover': {
                                    bgcolor:
                                        COR_PRINCIPAL_HOVER,
                                },
                            }}
                        >
                            {salvandoPsicologo
                                ? 'Salvando...'
                                : 'Salvar Alterações'}
                        </Button>
                    </DialogActions>
                </Dialog>

                <Dialog
                    open={openConfirm}
                    onClose={() =>
                        setOpenConfirm(false)
                    }
                >
                    <DialogTitle
                        sx={{
                            ...tituloStyle,
                            fontSize: '1.25rem',
                        }}
                    >
                        Confirmar Remoção
                    </DialogTitle>

                    <DialogContent>
                        <Typography>
                            Tem certeza que deseja remover
                            o psicólogo{' '}
                            <Box
                                component="span"
                                sx={{
                                    fontWeight: 600,
                                }}
                            >
                                {
                                    selectedPsicologo?.nome_completo
                                }
                            </Box>
                            ?
                        </Typography>

                        <Typography
                            color="error"
                            sx={{ mt: 2 }}
                        >
                            Todos os dados deste psicólogo
                            serão excluídos
                            permanentemente.
                        </Typography>
                    </DialogContent>

                    <DialogActions>
                        <Button
                            onClick={() =>
                                setOpenConfirm(false)
                            }
                        >
                            Cancelar
                        </Button>

                        <Button
                            onClick={handleRemover}
                            variant="contained"
                            color="error"
                        >
                            Remover Permanentemente
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Layout>
    );
}