import React, { useState, useEffect } from 'react';
import {
    Grid,
    Card,
    CardContent,
    Typography,
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Button,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Tabs,
    Tab,
} from '@mui/material';
import {
    People,
    CalendarToday,
    MedicalServices,
    TrendingUp,
    Delete,
    Block,
    CheckCircle,
    AttachMoney,
    Refresh,
    TrendingDown,
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, AreaChart, Area } from 'recharts';
import Layout from '../components/Layout';
import api from '../services/api';
import CalendarioAgenda from '../components/CalendarioAgenda';

const PIE_COLORS = ['#4A9EFF', '#FF6B6B'];

export default function DashboardAdmin() {
    const [estatisticas, setEstatisticas] = useState({
        total_psicologos: 0,
        total_pacientes: 0,
        total_agendamentos: 0,
        agendamentos_hoje: 0,
        total_faturamento: 0,
    });
    const [psicologos, setPsicologos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState(0);
    const [openConfirm, setOpenConfirm] = useState(false);
    const [selectedPsicologo, setSelectedPsicologo] = useState(null);
    const [filtros, setFiltros] = useState({
        psicologo_id: '',
        data_inicio: '',
        data_fim: '',
        tipo: '',
    });
    const [relatorioAtendimentos, setRelatorioAtendimentos] = useState([]);
    const [pacientesPorPsicologo, setPacientesPorPsicologo] = useState([]);
    const [agendamentosCancelados, setAgendamentosCancelados] = useState([]);
    const [faturamento, setFaturamento] = useState([]);
    const [resumoFaturamento, setResumoFaturamento] = useState({ total: 0, repasse_psicologo: 0, comissao_clinica: 0 });
    const [estatisticasPresenca, setEstatisticasPresenca] = useState([]);
    const [carregandoRelatorio, setCarregandoRelatorio] = useState(false);
    const [atualizando, setAtualizando] = useState(false);
    const [filtroFaturamento, setFiltroFaturamento] = useState({
        data_inicio: '',
        data_fim: '',
    });

    useEffect(() => {
        carregarDados();
        carregarResumoFaturamento();
        carregarEstatisticasPresenca();
    }, []);

    const carregarDados = async () => {
        try {
            const [stats, psicos] = await Promise.all([
                api.get('/admin/estatisticas'),
                api.get('/admin/psicologos'),
            ]);
            setEstatisticas(stats.data);
            setPsicologos(psicos.data);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    const carregarResumoFaturamento = async () => {
        try {
            const response = await api.get('/admin/faturamento/resumo');
            setResumoFaturamento(response.data);
        } catch (error) {
            console.error('Erro ao carregar resumo de faturamento:', error);
        }
    };

    const carregarEstatisticasPresenca = async () => {
        try {
            const response = await api.get('/admin/estatisticas/presenca');
            setEstatisticasPresenca(response.data);
        } catch (error) {
            console.error('Erro ao carregar estatísticas de presença:', error);
        }
    };

    const atualizarDados = async () => {
        setAtualizando(true);
        await carregarDados();
        await carregarResumoFaturamento();
        await carregarEstatisticasPresenca();
        setAtualizando(false);
    };

    const carregarFaturamentoComFiltro = async () => {
        setCarregandoRelatorio(true);
        try {
            const params = new URLSearchParams();
            if (filtroFaturamento.data_inicio) params.append('data_inicio', filtroFaturamento.data_inicio);
            if (filtroFaturamento.data_fim) params.append('data_fim', filtroFaturamento.data_fim);

            const [faturamentoRes, resumoRes] = await Promise.all([
                api.get(`/admin/faturamento/completo?${params}`),
                api.get(`/admin/faturamento/resumo?${params}`),
            ]);

            setFaturamento(faturamentoRes.data);
            setResumoFaturamento(resumoRes.data);
        } catch (error) {
            console.error('Erro ao carregar faturamento:', error);
        } finally {
            setCarregandoRelatorio(false);
        }
    };

    const carregarRelatorios = async () => {
        setCarregandoRelatorio(true);
        try {
            const params = new URLSearchParams();
            if (filtros.psicologo_id) params.append('psicologo_id', filtros.psicologo_id);
            if (filtros.data_inicio) params.append('data_inicio', filtros.data_inicio);
            if (filtros.data_fim) params.append('data_fim', filtros.data_fim);
            if (filtros.tipo) params.append('tipo', filtros.tipo);

            const [atendimentos, pacientes, cancelados, faturamentoRes] = await Promise.all([
                api.get(`/admin/relatorios/atendimentos?${params}`),
                api.get('/admin/relatorios/pacientes-por-psicologo'),
                api.get(`/admin/relatorios/agendamentos-cancelados?${params}`),
                api.get(`/admin/faturamento/completo?${params}`),
            ]);

            setRelatorioAtendimentos(atendimentos.data);
            setPacientesPorPsicologo(pacientes.data);
            setAgendamentosCancelados(cancelados.data);
            setFaturamento(faturamentoRes.data);
            await carregarResumoFaturamento();
        } catch (error) {
            console.error('Erro ao carregar relatórios:', error);
        } finally {
            setCarregandoRelatorio(false);
        }
    };

    const handleBloquear = async (id, ativo) => {
        try {
            await api.put(`/admin/psicologos/${id}/bloquear`, { ativo });
            carregarDados();
        } catch (error) {
            alert(error.response?.data?.error || 'Erro ao bloquear psicólogo.');
        }
    };

    const handleRemover = async () => {
        try {
            await api.delete(`/admin/psicologos/${selectedPsicologo.id}`);
            alert(`Psicólogo "${selectedPsicologo.nome_completo}" removido com sucesso!`);
            setOpenConfirm(false);
            carregarDados();
        } catch (error) {
            alert(error.response?.data?.error || 'Erro ao remover psicólogo.');
        }
    };

    const openConfirmDialog = (psicologo) => {
        setSelectedPsicologo(psicologo);
        setOpenConfirm(true);
    };

    const formatarValor = (valor) => {
        if (!valor) return 'R$ 0,00';
        return `R$ ${parseFloat(valor).toFixed(2).replace('.', ',')}`;
    };

    const formatarData = (data) => {
        if (!data) return '-';
        const d = new Date(data);
        return d.toLocaleDateString('pt-BR');
    };

    const pieData = [
        { name: 'Clínica (60%)', value: resumoFaturamento.comissao_clinica || 0 },
        { name: 'Psicólogo (40%)', value: resumoFaturamento.repasse_psicologo || 0 },
    ];

    const barData = faturamento.map(f => ({
        name: f.psicologo_nome || 'Sem nome',
        total: parseFloat(f.total_faturamento) || 0,
        repasse_psicologo: parseFloat(f.repasse_psicologo) || 0,
        comissao_clinica: parseFloat(f.comissao_clinica) || 0,
    }));

    const areaData = faturamento.map(f => ({
        name: f.psicologo_nome || 'Sem nome',
        valor: parseFloat(f.total_faturamento) || 0,
    })).sort((a, b) => b.valor - a.valor);

    const cards = [
        { 
            title: 'Psicólogos', 
            value: estatisticas.total_psicologos, 
            icon: <People sx={{ fontSize: 40, color: '#4A9EFF' }} />,
            bgColor: '#E8F0FE',
        },
        { 
            title: 'Pacientes', 
            value: estatisticas.total_pacientes, 
            icon: <MedicalServices sx={{ fontSize: 40, color: '#51CF66' }} />,
            bgColor: '#E8F5E9',
        },
        { 
            title: 'Agendamentos Hoje', 
            value: estatisticas.agendamentos_hoje, 
            icon: <CalendarToday sx={{ fontSize: 40, color: '#FF6B6B' }} />,
            bgColor: '#FBE9E7',
        },
        { 
            title: 'Faturamento', 
            value: formatarValor(estatisticas.total_faturamento), 
            icon: <AttachMoney sx={{ fontSize: 40, color: '#FFD93D' }} />,
            bgColor: '#FFF8E1',
        },
    ];

    return (
        <Layout>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        Dashboard Admin
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Gerencie toda a clínica.
                    </Typography>
                </Box>
                <Button 
                    variant="outlined" 
                    onClick={atualizarDados}
                    disabled={atualizando}
                    startIcon={<Refresh />}
                    sx={{ borderRadius: 2 }}
                >
                    {atualizando ? 'Atualizando...' : 'Atualizar Dados'}
                </Button>
            </Box>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                {cards.map((card) => (
                    <Grid item xs={12} sm={6} md={3} key={card.title}>
                        <Card sx={{ 
                            borderRadius: 3, 
                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                            bgcolor: card.bgColor,
                            transition: 'transform 0.2s',
                            '&:hover': { transform: 'scale(1.02)' },
                        }}>
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

            <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 2 }}>
                <Tab label="👨‍⚕️ Psicólogos" />
                <Tab label="📊 Relatórios" />
                <Tab label="💰 Faturamento" />
                <Tab label="📅 Agenda Geral" />
            </Tabs>

            {tab === 0 && (
                <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                            👨‍⚕️ Psicólogos Cadastrados
                        </Typography>
                        <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell><strong>Nome</strong></TableCell>
                                        <TableCell><strong>Email</strong></TableCell>
                                        <TableCell><strong>CRP</strong></TableCell>
                                        <TableCell><strong>Pacientes</strong></TableCell>
                                        <TableCell><strong>Agendamentos</strong></TableCell>
                                        <TableCell><strong>Status</strong></TableCell>
                                        <TableCell align="right"><strong>Ações</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {psicologos.map((p) => (
                                        <TableRow key={p.id}>
                                            <TableCell>{p.nome_completo}</TableCell>
                                            <TableCell>{p.email}</TableCell>
                                            <TableCell>{p.crp}</TableCell>
                                            <TableCell>{p.total_pacientes || 0}</TableCell>
                                            <TableCell>{p.total_agendamentos || 0}</TableCell>
                                            <TableCell>
                                                <Chip 
                                                    label={p.ativo ? 'Ativo' : 'Bloqueado'} 
                                                    size="small"
                                                    color={p.ativo ? 'success' : 'error'}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <>
                                                    <IconButton 
                                                        onClick={() => handleBloquear(p.id, !p.ativo)} 
                                                        size="small"
                                                        color={p.ativo ? 'warning' : 'success'}
                                                        title={p.ativo ? 'Bloquear' : 'Desbloquear'}
                                                    >
                                                        {p.ativo ? <Block fontSize="small" /> : <CheckCircle fontSize="small" />}
                                                    </IconButton>
                                                    <IconButton 
                                                        onClick={() => openConfirmDialog(p)} 
                                                        size="small" 
                                                        color="error"
                                                        title="Remover psicólogo"
                                                    >
                                                        <Delete fontSize="small" />
                                                    </IconButton>
                                                </>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            )}

            {tab === 1 && (
                <Box>
                    <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                                📊 Filtros de Relatórios
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={3}>
                                    <TextField
                                        select
                                        fullWidth
                                        label="Psicólogo"
                                        value={filtros.psicologo_id}
                                        onChange={(e) => setFiltros({ ...filtros, psicologo_id: e.target.value })}
                                        size="small"
                                    >
                                        <MenuItem value="">Todos</MenuItem>
                                        {psicologos.map((p) => (
                                            <MenuItem key={p.id} value={p.id}>{p.nome_completo}</MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                                <Grid item xs={12} md={2}>
                                    <TextField
                                        fullWidth
                                        label="Data Início"
                                        type="date"
                                        value={filtros.data_inicio}
                                        onChange={(e) => setFiltros({ ...filtros, data_inicio: e.target.value })}
                                        size="small"
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={2}>
                                    <TextField
                                        fullWidth
                                        label="Data Fim"
                                        type="date"
                                        value={filtros.data_fim}
                                        onChange={(e) => setFiltros({ ...filtros, data_fim: e.target.value })}
                                        size="small"
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={2}>
                                    <TextField
                                        select
                                        fullWidth
                                        label="Tipo de Consulta"
                                        value={filtros.tipo}
                                        onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
                                        size="small"
                                    >
                                        <MenuItem value="">Todos</MenuItem>
                                        <MenuItem value="presencial">Presencial</MenuItem>
                                        <MenuItem value="online">Online</MenuItem>
                                    </TextField>
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        onClick={carregarRelatorios}
                                        disabled={carregandoRelatorio}
                                        sx={{ height: '100%', bgcolor: '#1a1a2e' }}
                                    >
                                        {carregandoRelatorio ? 'Carregando...' : 'Gerar Relatórios'}
                                    </Button>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>

                    <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                                📋 Atendimentos
                            </Typography>
                            <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell><strong>Data</strong></TableCell>
                                            <TableCell><strong>Horário</strong></TableCell>
                                            <TableCell><strong>Paciente</strong></TableCell>
                                            <TableCell><strong>Psicólogo</strong></TableCell>
                                            <TableCell><strong>Tipo</strong></TableCell>
                                            <TableCell><strong>Status</strong></TableCell>
                                            <TableCell><strong>Valor</strong></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {relatorioAtendimentos.slice(0, 10).map((a) => (
                                            <TableRow key={a.id}>
                                                <TableCell>{formatarData(a.data)}</TableCell>
                                                <TableCell>{a.horario.slice(0, 5)}</TableCell>
                                                <TableCell>{a.paciente_nome}</TableCell>
                                                <TableCell>{a.psicologo_nome}</TableCell>
                                                <TableCell>{a.tipo_consulta}</TableCell>
                                                <TableCell>
                                                    <Chip label={a.status} size="small" color={a.status === 'confirmado' ? 'success' : 'error'} />
                                                </TableCell>
                                                <TableCell>{formatarValor(a.valor_consulta)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>

                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', height: '100%' }}>
                                <CardContent>
                                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                                        👤 Pacientes por Psicólogo
                                    </Typography>
                                    {pacientesPorPsicologo.map((p) => (
                                        <Box key={p.psicologo_id} sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #eee' }}>
                                            <Typography>{p.psicologo_nome}</Typography>
                                            <Typography><strong>{p.total_pacientes}</strong> pacientes</Typography>
                                        </Box>
                                    ))}
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', height: '100%' }}>
                                <CardContent>
                                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                                         Agendamentos Cancelados
                                    </Typography>
                                    {agendamentosCancelados.map((p) => (
                                        <Box key={p.psicologo_nome} sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #eee' }}>
                                            <Typography>{p.psicologo_nome}</Typography>
                                            <Typography>
                                                <strong>{p.total_cancelados || 0}</strong> / {p.total_agendamentos || 0}
                                                <Chip
                                                    label={`${p.taxa_cancelamento || 0}%`}
                                                    size="small"
                                                    color={(p.taxa_cancelamento || 0) > 20 ? 'error' : 'success'}
                                                    sx={{ ml: 1 }}
                                                />
                                            </Typography>
                                        </Box>
                                    ))}
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    <Grid container spacing={3} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                                <CardContent>
                                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                                        📊 Taxa de Presença por Psicólogo
                                    </Typography>
                                    <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell><strong>Psicólogo</strong></TableCell>
                                                    <TableCell align="center"><strong>Total</strong></TableCell>
                                                    <TableCell align="center"><strong>✅ Compareceram</strong></TableCell>
                                                    <TableCell align="center"><strong>❌ Faltaram</strong></TableCell>
                                                    <TableCell align="center"><strong>⏳ Pendentes</strong></TableCell>
                                                    <TableCell align="center"><strong>Taxa de Presença</strong></TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {estatisticasPresenca.map((p) => (
                                                    <TableRow key={p.psicologo_id}>
                                                        <TableCell>{p.psicologo_nome}</TableCell>
                                                        <TableCell align="center">{p.total_agendamentos || 0}</TableCell>
                                                        <TableCell align="center" sx={{ color: '#4caf50' }}>{p.compareceram || 0}</TableCell>
                                                        <TableCell align="center" sx={{ color: '#f44336' }}>{p.faltaram || 0}</TableCell>
                                                        <TableCell align="center">{p.pendentes || 0}</TableCell>
                                                        <TableCell align="center">
                                                            <Chip 
                                                                label={`${p.taxa_presenca || 0}%`} 
                                                                size="small"
                                                                color={(p.taxa_presenca || 0) >= 80 ? 'success' : (p.taxa_presenca || 0) >= 50 ? 'warning' : 'error'}
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Box>
            )}

            {tab === 2 && (
                <Box>
                    <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                                📅 Filtrar por Período
                            </Typography>
                            <Grid container spacing={2} alignItems="center">
                                <Grid item xs={12} md={3}>
                                    <TextField
                                        fullWidth
                                        label="Data Início"
                                        type="date"
                                        value={filtroFaturamento.data_inicio}
                                        onChange={(e) => setFiltroFaturamento({ ...filtroFaturamento, data_inicio: e.target.value })}
                                        InputLabelProps={{ shrink: true }}
                                        size="small"
                                    />
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <TextField
                                        fullWidth
                                        label="Data Fim"
                                        type="date"
                                        value={filtroFaturamento.data_fim}
                                        onChange={(e) => setFiltroFaturamento({ ...filtroFaturamento, data_fim: e.target.value })}
                                        InputLabelProps={{ shrink: true }}
                                        size="small"
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={() => {
                                                const hoje = new Date();
                                                const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
                                                setFiltroFaturamento({
                                                    data_inicio: inicio.toISOString().split('T')[0],
                                                    data_fim: hoje.toISOString().split('T')[0],
                                                });
                                            }}
                                        >
                                            Este Mês
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={() => {
                                                const hoje = new Date();
                                                const inicio = new Date(hoje);
                                                inicio.setDate(hoje.getDate() - 7);
                                                setFiltroFaturamento({
                                                    data_inicio: inicio.toISOString().split('T')[0],
                                                    data_fim: hoje.toISOString().split('T')[0],
                                                });
                                            }}
                                        >
                                            Última Semana
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={() => {
                                                const hoje = new Date();
                                                const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, hoje.getDate());
                                                setFiltroFaturamento({
                                                    data_inicio: inicio.toISOString().split('T')[0],
                                                    data_fim: hoje.toISOString().split('T')[0],
                                                });
                                            }}
                                        >
                                            Último Mês
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={() => {
                                                setFiltroFaturamento({ data_inicio: '', data_fim: '' });
                                            }}
                                        >
                                            Limpar
                                        </Button>
                                        <Button
                                            variant="contained"
                                            size="small"
                                            onClick={carregarFaturamentoComFiltro}
                                            disabled={carregandoRelatorio}
                                            sx={{ bgcolor: '#1a1a2e' }}
                                        >
                                            {carregandoRelatorio ? 'Carregando...' : 'Aplicar Filtro'}
                                        </Button>
                                    </Box>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>

                    <Grid container spacing={3} sx={{ mb: 3 }}>
                        <Grid item xs={12} md={4}>
                            <Card sx={{ 
                                borderRadius: 3, 
                                boxShadow: '0 2px 8px rgba(0,0,0,0.05)', 
                                bgcolor: '#f0f4ff',
                                transition: 'transform 0.2s',
                                '&:hover': { transform: 'scale(1.02)' },
                            }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Box sx={{ 
                                            width: 48, 
                                            height: 48, 
                                            borderRadius: '50%', 
                                            bgcolor: '#4A9EFF', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            color: 'white',
                                        }}>
                                            <AttachMoney />
                                        </Box>
                                        <Box>
                                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                💰 Faturamento Total
                                            </Typography>
                                            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1a1a2e' }}>
                                                {formatarValor(resumoFaturamento.total)}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                {faturamento.reduce((acc, f) => acc + (f.total_consultas || 0), 0)} consultas
                                            </Typography>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Card sx={{ 
                                borderRadius: 3, 
                                boxShadow: '0 2px 8px rgba(0,0,0,0.05)', 
                                bgcolor: '#e8f5e9',
                                transition: 'transform 0.2s',
                                '&:hover': { transform: 'scale(1.02)' },
                            }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Box sx={{ 
                                            width: 48, 
                                            height: 48, 
                                            borderRadius: '50%', 
                                            bgcolor: '#4A9EFF', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            color: 'white',
                                        }}>
                                            <TrendingUp />
                                        </Box>
                                        <Box>
                                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                 Clínica (60%)
                                            </Typography>
                                            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                                                {formatarValor(resumoFaturamento.comissao_clinica)}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Card sx={{ 
                                borderRadius: 3, 
                                boxShadow: '0 2px 8px rgba(0,0,0,0.05)', 
                                bgcolor: '#fff3e0',
                                transition: 'transform 0.2s',
                                '&:hover': { transform: 'scale(1.02)' },
                            }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Box sx={{ 
                                            width: 48, 
                                            height: 48, 
                                            borderRadius: '50%', 
                                            bgcolor: '#FF6B6B', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            color: 'white',
                                        }}>
                                            <TrendingDown />
                                        </Box>
                                        <Box>
                                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                 Psicólogo (40%)
                                            </Typography>
                                            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#e65100' }}>
                                                {formatarValor(resumoFaturamento.repasse_psicologo)}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                                <CardContent>
                                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                                         Distribuição do Faturamento
                                    </Typography>
                                    {resumoFaturamento.total > 0 ? (
                                        <Box sx={{ height: 300 }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={pieData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={60}
                                                        outerRadius={100}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                                                        labelLine={true}
                                                    >
                                                        {pieData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip formatter={(value) => formatarValor(value)} />
                                                    <Legend />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </Box>
                                    ) : (
                                        <Box sx={{ textAlign: 'center', py: 4 }}>
                                            <Typography sx={{ color: 'text.secondary' }}>
                                                Nenhum dado de faturamento disponível.
                                            </Typography>
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                                <CardContent>
                                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                                        📊 Faturamento por Psicólogo
                                    </Typography>
                                    {barData.length > 0 && barData.some(b => b.total > 0) ? (
                                        <Box sx={{ height: 300 }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={barData} layout="vertical" margin={{ left: 10 }}>
                                                    <XAxis type="number" tickFormatter={(value) => `R$ ${value}`} />
                                                    <YAxis type="category" dataKey="name" width={100} />
                                                    <Tooltip formatter={(value) => formatarValor(value)} />
                                                    <Legend />
                                                    <Bar 
                                                        dataKey="repasse_psicologo" 
                                                        name="Repasse (40%)" 
                                                        fill="#FF6B6B" 
                                                        radius={[0, 4, 4, 0]}
                                                    />
                                                    <Bar 
                                                        dataKey="comissao_clinica" 
                                                        name="Comissão Clínica (60%)" 
                                                        fill="#4A9EFF" 
                                                        radius={[0, 4, 4, 0]}
                                                    />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </Box>
                                    ) : (
                                        <Box sx={{ textAlign: 'center', py: 4 }}>
                                            <Typography sx={{ color: 'text.secondary' }}>
                                                Nenhum dado de faturamento por psicólogo disponível.
                                            </Typography>
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {areaData.length > 0 && areaData.some(a => a.valor > 0) && (
                        <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', mt: 3 }}>
                            <CardContent>
                                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                                    📈 Evolução do Faturamento por Psicólogo
                                </Typography>
                                <Box sx={{ height: 250 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={areaData}>
                                            <XAxis dataKey="name" />
                                            <YAxis tickFormatter={(value) => `R$ ${value}`} />
                                            <Tooltip formatter={(value) => formatarValor(value)} />
                                            <Area 
                                                type="monotone" 
                                                dataKey="valor" 
                                                stroke="#4A9EFF" 
                                                fill="#4A9EFF" 
                                                fillOpacity={0.3}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </Box>
                            </CardContent>
                        </Card>
                    )}

                    <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', mt: 3 }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                                💰 Detalhamento do Faturamento
                            </Typography>
                            {faturamento.length > 0 && faturamento.some(f => f.total_faturamento > 0) ? (
                                <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
                                    <Table>
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: '#f5f7fb' }}>
                                                <TableCell><strong>Psicólogo</strong></TableCell>
                                                <TableCell align="right"><strong>Consultas</strong></TableCell>
                                                <TableCell align="right"><strong>Total</strong></TableCell>
                                                <TableCell align="right"><strong>Repasse (40%)</strong></TableCell>
                                                <TableCell align="right"><strong>Comissão (60%)</strong></TableCell>
                                                <TableCell align="right"><strong>Média</strong></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {faturamento.map((f, index) => (
                                                <TableRow key={f.psicologo_id} sx={{ bgcolor: index % 2 === 0 ? 'white' : '#fafafa' }}>
                                                    <TableCell><strong>{f.psicologo_nome}</strong></TableCell>
                                                    <TableCell align="right">{f.total_consultas || 0}</TableCell>
                                                    <TableCell align="right"><strong>{formatarValor(f.total_faturamento)}</strong></TableCell>
                                                    <TableCell align="right" sx={{ color: '#FF6B6B' }}>{formatarValor(f.repasse_psicologo)}</TableCell>
                                                    <TableCell align="right" sx={{ color: '#4A9EFF' }}>{formatarValor(f.comissao_clinica)}</TableCell>
                                                    <TableCell align="right">{formatarValor(f.media_por_consulta)}</TableCell>
                                                </TableRow>
                                            ))}
                                            <TableRow sx={{ bgcolor: '#f5f7fb', borderTop: '2px solid #ddd' }}>
                                                <TableCell><strong>TOTAL</strong></TableCell>
                                                <TableCell align="right">
                                                    <strong>{faturamento.reduce((acc, f) => acc + (f.total_consultas || 0), 0)}</strong>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <strong>{formatarValor(faturamento.reduce((acc, f) => acc + parseFloat(f.total_faturamento || 0), 0))}</strong>
                                                </TableCell>
                                                <TableCell align="right" sx={{ color: '#FF6B6B' }}>
                                                    <strong>{formatarValor(faturamento.reduce((acc, f) => acc + parseFloat(f.repasse_psicologo || 0), 0))}</strong>
                                                </TableCell>
                                                <TableCell align="right" sx={{ color: '#4A9EFF' }}>
                                                    <strong>{formatarValor(faturamento.reduce((acc, f) => acc + parseFloat(f.comissao_clinica || 0), 0))}</strong>
                                                </TableCell>
                                                <TableCell align="right">-</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            ) : (
                                <Typography sx={{ textAlign: 'center', color: 'text.secondary', py: 2 }}>
                                    Nenhum agendamento com valor registrado.
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Box>
            )}

            {tab === 3 && (
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                        📅 Agenda Geral - Todos os Psicólogos
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                        Visualize e gerencie todos os agendamentos da clínica.
                    </Typography>
                    <CalendarioAgenda isAdminView={true} />
                </Box>
            )}

            <Dialog open={openConfirm} onClose={() => setOpenConfirm(false)}>
                <DialogTitle>Confirmar Remoção</DialogTitle>
                <DialogContent>
                    <Typography>
                        Tem certeza que deseja remover o psicólogo <strong>"{selectedPsicologo?.nome_completo}"</strong>?
                    </Typography>
                    <Typography color="error" sx={{ mt: 2 }}>
                        ⚠️ Todos os dados deste psicólogo serão excluídos permanentemente.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenConfirm(false)}>Cancelar</Button>
                    <Button onClick={handleRemover} variant="contained" color="error">
                        Remover Permanentemente
                    </Button>
                </DialogActions>
            </Dialog>
        </Layout>
    );
}