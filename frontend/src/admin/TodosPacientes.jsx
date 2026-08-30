import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Tabs,
    Tab,
    Grid,
    Divider,
    TextField,
    InputAdornment,
} from '@mui/material';
import { Search, Visibility, Close } from '@mui/icons-material';
import Layout from '../components/Layout';
import api from '../services/api';

export default function TodosPacientes() {
    const [pacientes, setPacientes] = useState([]);
    const [pacientesFiltrados, setPacientesFiltrados] = useState([]);
    const [search, setSearch] = useState('');
    const [openProntuario, setOpenProntuario] = useState(false);
    const [pacienteSelecionado, setPacienteSelecionado] = useState(null);
    const [prontuario, setProntuario] = useState(null);
    const [evolucoes, setEvolucoes] = useState([]);
    const [tab, setTab] = useState(0);

    useEffect(() => {
        carregarPacientes();
    }, []);

    useEffect(() => {
        const filtered = pacientes.filter(p =>
            p.nome_completo?.toLowerCase().includes(search.toLowerCase()) ||
            p.email?.toLowerCase().includes(search.toLowerCase()) ||
            p.telefone?.includes(search)
        );
        setPacientesFiltrados(filtered);
    }, [search, pacientes]);

    const carregarPacientes = async () => {
        try {
            const response = await api.get('/admin/pacientes');
            setPacientes(response.data);
            setPacientesFiltrados(response.data);
        } catch (error) {
            console.error('Erro ao carregar pacientes:', error);
        }
    };

    const carregarProntuario = async (pacienteId) => {
        try {
            const response = await api.get(`/prontuarios/paciente/${pacienteId}`);
            setProntuario(response.data);
        } catch (error) {
            setProntuario(null);
        }
    };

    const carregarEvolucoes = async (pacienteId) => {
        try {
            const response = await api.get(`/prontuarios/paciente/${pacienteId}/evolucoes`);
            setEvolucoes(response.data);
        } catch (error) {
            setEvolucoes([]);
        }
    };

    const handleVerProntuario = async (paciente) => {
        setPacienteSelecionado(paciente);
        await carregarProntuario(paciente.id);
        await carregarEvolucoes(paciente.id);
        setOpenProntuario(true);
        setTab(0);
    };

    const handleCloseProntuario = () => {
        setOpenProntuario(false);
        setPacienteSelecionado(null);
        setProntuario(null);
        setEvolucoes([]);
    };

    const formatarData = (data) => {
        if (!data) return '-';
        const d = new Date(data);
        return d.toLocaleDateString('pt-BR');
    };

    return (
        <Layout>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    Todos os Pacientes
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Visualize todos os pacientes de todos os psicólogos.
                </Typography>
            </Box>

            <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', mb: 3 }}>
                <CardContent>
                    <TextField
                        fullWidth
                        placeholder="Buscar paciente por nome, email ou telefone..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
                            endAdornment: search && (
                                <InputAdornment position="end">
                                    <IconButton size="small" onClick={() => setSearch('')}>
                                        <Close fontSize="small" />
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />
                </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <CardContent>
                    <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                        {pacientesFiltrados.length} pacientes encontrados
                    </Typography>
                    <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell><strong>Nome</strong></TableCell>
                                    <TableCell><strong>Telefone</strong></TableCell>
                                    <TableCell><strong>Email</strong></TableCell>
                                    <TableCell><strong>Psicólogo</strong></TableCell>
                                    <TableCell><strong>Ações</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {pacientesFiltrados.map((p) => (
                                    <TableRow key={p.id}>
                                        <TableCell>{p.nome_completo}</TableCell>
                                        <TableCell>{p.telefone || '-'}</TableCell>
                                        <TableCell>{p.email || '-'}</TableCell>
                                        <TableCell>{p.psicologo_nome || '-'}</TableCell>
                                        <TableCell>
                                            <IconButton 
                                                onClick={() => handleVerProntuario(p)} 
                                                size="small"
                                                color="primary"
                                                title="Ver Prontuário"
                                            >
                                                <Visibility />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>

            <Dialog 
                open={openProntuario} 
                onClose={handleCloseProntuario} 
                maxWidth="md" 
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">
                            Prontuário de {pacienteSelecionado?.nome_completo}
                        </Typography>
                        <IconButton onClick={handleCloseProntuario}>
                            <Close />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mb: 2 }}>
                        <Grid container spacing={1}>
                            <Grid item xs={6}>
                                <Typography variant="body2"><strong>Nome:</strong> {pacienteSelecionado?.nome_completo}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2"><strong>Telefone:</strong> {pacienteSelecionado?.telefone || '-'}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2"><strong>Email:</strong> {pacienteSelecionado?.email || '-'}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="body2"><strong>Data Nasc.:</strong> {formatarData(pacienteSelecionado?.data_nascimento)}</Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="body2"><strong>Psicólogo:</strong> {pacienteSelecionado?.psicologo_nome || '-'}</Typography>
                            </Grid>
                        </Grid>
                    </Box>
                    <Divider sx={{ mb: 2 }} />

                    <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 2 }}>
                        <Tab label="📋 Prontuário" />
                        <Tab label="📝 Evoluções" />
                    </Tabs>

                    {tab === 0 && (
                        <Box>
                            {prontuario ? (
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Queixa Principal</Typography>
                                        <Typography variant="body2">{prontuario.queixa_principal || 'Não informado'}</Typography>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>História da Doença Atual</Typography>
                                        <Typography variant="body2">{prontuario.historia_doenca_atual || 'Não informado'}</Typography>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Impressão Diagnóstica</Typography>
                                        <Typography variant="body2">{prontuario.impressao_diagnostica || 'Não informado'}</Typography>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Conduta Terapêutica</Typography>
                                        <Typography variant="body2">{prontuario.conduta_terapeutica || 'Não informado'}</Typography>
                                    </Grid>
                                </Grid>
                            ) : (
                                <Typography sx={{ color: 'text.secondary' }}>
                                    Nenhum prontuário registrado para este paciente.
                                </Typography>
                            )}
                        </Box>
                    )}

                    {tab === 1 && (
                        <Box>
                            {evolucoes.length === 0 ? (
                                <Typography sx={{ color: 'text.secondary' }}>
                                    Nenhuma evolução registrada.
                                </Typography>
                            ) : (
                                evolucoes.map((e) => (
                                    <Paper key={e.id} sx={{ p: 2, mb: 2, bgcolor: '#f8f9fa' }}>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            {formatarData(e.data)}
                                        </Typography>
                                        <Typography sx={{ mt: 1 }}><strong>Descrição:</strong> {e.conteudo}</Typography>
                                        {e.procedimentos && (
                                            <Typography sx={{ mt: 1 }}><strong>Procedimentos:</strong> {e.procedimentos}</Typography>
                                        )}
                                        {e.progresso && (
                                            <Typography sx={{ mt: 1 }}><strong>Progresso:</strong> {e.progresso}</Typography>
                                        )}
                                    </Paper>
                                ))
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseProntuario}>Fechar</Button>
                </DialogActions>
            </Dialog>
        </Layout>
    );
}