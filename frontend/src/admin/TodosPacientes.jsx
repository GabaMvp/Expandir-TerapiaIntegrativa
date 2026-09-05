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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    Tooltip,
} from '@mui/material';

import {
    Search,
    Visibility,
    Close,
    Edit,
} from '@mui/icons-material';

import Layout from '../components/Layout';
import api from '../services/api';

export default function TodosPacientes() {
    const [pacientes, setPacientes] = useState([]);
    const [pacientesFiltrados, setPacientesFiltrados] = useState([]);
    const [psicologos, setPsicologos] = useState([]);

    const [search, setSearch] = useState('');

    const [openProntuario, setOpenProntuario] = useState(false);
    const [pacienteSelecionado, setPacienteSelecionado] = useState(null);
    const [prontuario, setProntuario] = useState(null);
    const [evolucoes, setEvolucoes] = useState([]);
    const [tab, setTab] = useState(0);

    const [openEditar, setOpenEditar] = useState(false);
    const [pacienteEditando, setPacienteEditando] = useState(null);

    const [loadingEditar, setLoadingEditar] = useState(false);
    const [erroEditar, setErroEditar] = useState('');
    const [sucessoEditar, setSucessoEditar] = useState('');

    const [formData, setFormData] = useState({
        nome_completo: '',
        data_nascimento: '',
        genero: '',
        telefone: '',
        email: '',
        endereco: '',
        ocupacao: '',
        estado_civil: '',
        convenio: '',
        psicologo_id: '',
    });

    useEffect(() => {
        carregarDados();
    }, []);

    useEffect(() => {
        const termo = search.toLowerCase();

        const filtered = pacientes.filter((p) =>
            p.nome_completo?.toLowerCase().includes(termo) ||
            p.email?.toLowerCase().includes(termo) ||
            p.telefone?.includes(search)
        );

        setPacientesFiltrados(filtered);
    }, [search, pacientes]);

    const carregarDados = async () => {
        try {
            const [pacientesRes, psicologosRes] = await Promise.all([
                api.get('/admin/pacientes'),
                api.get('/admin/psicologos/disponiveis'),
            ]);

            setPacientes(pacientesRes.data);
            setPacientesFiltrados(pacientesRes.data);
            setPsicologos(psicologosRes.data);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        }
    };

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
            const response = await api.get(
                `/prontuarios/paciente/${pacienteId}`
            );

            setProntuario(response.data);
        } catch (error) {
            setProntuario(null);
        }
    };

    const carregarEvolucoes = async (pacienteId) => {
        try {
            const response = await api.get(
                `/prontuarios/paciente/${pacienteId}/evolucoes`
            );

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

    const normalizarData = (data) => {
        if (!data) return '';

        return String(data).split('T')[0];
    };

    const formatarData = (data) => {
        if (!data) return '-';

        const dataNormalizada = normalizarData(data);
        const [ano, mes, dia] = dataNormalizada.split('-');

        if (!ano || !mes || !dia) {
            return '-';
        }

        return `${dia}/${mes}/${ano}`;
    };

    const handleAbrirEditar = (paciente) => {
        setPacienteEditando(paciente);
        setErroEditar('');
        setSucessoEditar('');

        setFormData({
            nome_completo: paciente.nome_completo || '',
            data_nascimento: normalizarData(paciente.data_nascimento),
            genero: paciente.genero || '',
            telefone: paciente.telefone || '',
            email: paciente.email || '',
            endereco: paciente.endereco || '',
            ocupacao: paciente.ocupacao || '',
            estado_civil: paciente.estado_civil || '',
            convenio: paciente.convenio || '',
            psicologo_id: paciente.psicologo_id || '',
        });

        setOpenEditar(true);
    };

    const handleFecharEditar = () => {
        if (loadingEditar) {
            return;
        }

        setOpenEditar(false);
        setPacienteEditando(null);
        setErroEditar('');
        setSucessoEditar('');
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSalvarEdicao = async () => {
        setErroEditar('');
        setSucessoEditar('');

        if (!formData.nome_completo.trim()) {
            setErroEditar('O nome do paciente é obrigatório.');
            return;
        }

        try {
            setLoadingEditar(true);

            await api.put(
                `/pacientes/${pacienteEditando.id}`,
                {
                    ...formData,
                    data_nascimento:
                        formData.data_nascimento || null,
                    psicologo_id:
                        formData.psicologo_id || null,
                }
            );

            setSucessoEditar(
                'Paciente atualizado com sucesso!'
            );

            await carregarPacientes();

            setTimeout(() => {
                setOpenEditar(false);
                setPacienteEditando(null);
                setSucessoEditar('');
            }, 700);
        } catch (error) {
            console.error(
                'Erro ao atualizar paciente:',
                error
            );

            setErroEditar(
                error?.response?.data?.error ||
                'Erro ao atualizar paciente.'
            );
        } finally {
            setLoadingEditar(false);
        }
    };

    return (
        <Layout>
            <Box sx={{ mb: 4 }}>
                <Typography
                    variant="h4"
                    sx={{ fontWeight: 'bold' }}
                >
                    Todos os Pacientes
                </Typography>

                <Typography
                    variant="body2"
                    sx={{ color: 'text.secondary' }}
                >
                    Visualize e edite todos os pacientes.
                </Typography>
            </Box>

            <Card
                sx={{
                    borderRadius: 3,
                    boxShadow:
                        '0 2px 8px rgba(0,0,0,0.05)',
                    mb: 3,
                }}
            >
                <CardContent>
                    <TextField
                        fullWidth
                        placeholder="Buscar paciente por nome, email ou telefone..."
                        value={search}
                        onChange={(e) =>
                            setSearch(e.target.value)
                        }
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search />
                                </InputAdornment>
                            ),
                            endAdornment: search && (
                                <InputAdornment position="end">
                                    <IconButton
                                        size="small"
                                        onClick={() =>
                                            setSearch('')
                                        }
                                    >
                                        <Close fontSize="small" />
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                </CardContent>
            </Card>

            <Card
                sx={{
                    borderRadius: 3,
                    boxShadow:
                        '0 2px 8px rgba(0,0,0,0.05)',
                }}
            >
                <CardContent>
                    <Typography
                        variant="body2"
                        sx={{
                            mb: 2,
                            color: 'text.secondary',
                        }}
                    >
                        {pacientesFiltrados.length} pacientes encontrados
                    </Typography>

                    <TableContainer
                        component={Paper}
                        sx={{ boxShadow: 'none' }}
                    >
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>
                                        <strong>Nome</strong>
                                    </TableCell>

                                    <TableCell>
                                        <strong>Telefone</strong>
                                    </TableCell>

                                    <TableCell>
                                        <strong>Email</strong>
                                    </TableCell>

                                    <TableCell>
                                        <strong>Psicólogo</strong>
                                    </TableCell>

                                    <TableCell>
                                        <strong>Ações</strong>
                                    </TableCell>
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {pacientesFiltrados.map(
                                    (p) => (
                                        <TableRow key={p.id}>
                                            <TableCell>
                                                {p.nome_completo}
                                            </TableCell>

                                            <TableCell>
                                                {p.telefone || '-'}
                                            </TableCell>

                                            <TableCell>
                                                {p.email || '-'}
                                            </TableCell>

                                            <TableCell>
                                                {p.psicologo_nome ||
                                                    '-'}
                                            </TableCell>

                                            <TableCell>
                                                <Tooltip title="Ver prontuário">
                                                    <IconButton
                                                        onClick={() =>
                                                            handleVerProntuario(
                                                                p
                                                            )
                                                        }
                                                        size="small"
                                                        color="primary"
                                                    >
                                                        <Visibility />
                                                    </IconButton>
                                                </Tooltip>

                                                <Tooltip title="Editar paciente">
                                                    <IconButton
                                                        onClick={() =>
                                                            handleAbrirEditar(
                                                                p
                                                            )
                                                        }
                                                        size="small"
                                                        sx={{
                                                            color:
                                                                '#7B944A',
                                                        }}
                                                    >
                                                        <Edit />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    )
                                )}

                                {pacientesFiltrados.length ===
                                    0 && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={5}
                                            align="center"
                                        >
                                            Nenhum paciente encontrado.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>

            {/* EDITAR PACIENTE */}

            <Dialog
                open={openEditar}
                onClose={handleFecharEditar}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Editar Paciente
                </DialogTitle>

                <DialogContent>
                    <Box sx={{ pt: 1 }}>
                        {erroEditar && (
                            <Alert
                                severity="error"
                                sx={{ mb: 2 }}
                            >
                                {erroEditar}
                            </Alert>
                        )}

                        {sucessoEditar && (
                            <Alert
                                severity="success"
                                sx={{ mb: 2 }}
                            >
                                {sucessoEditar}
                            </Alert>
                        )}

                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    required
                                    label="Nome completo"
                                    name="nome_completo"
                                    value={
                                        formData.nome_completo
                                    }
                                    onChange={handleChange}
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Data de nascimento"
                                    name="data_nascimento"
                                    type="date"
                                    value={
                                        formData.data_nascimento
                                    }
                                    onChange={handleChange}
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth>
                                    <InputLabel>
                                        Gênero
                                    </InputLabel>

                                    <Select
                                        name="genero"
                                        value={formData.genero}
                                        onChange={handleChange}
                                        label="Gênero"
                                    >
                                        <MenuItem value="">
                                            Não informado
                                        </MenuItem>

                                        <MenuItem value="masculino">
                                            Masculino
                                        </MenuItem>

                                        <MenuItem value="feminino">
                                            Feminino
                                        </MenuItem>

                                        <MenuItem value="outro">
                                            Outro
                                        </MenuItem>
                                    </Select>
                                </FormControl>
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
                                    label="Email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
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
                                <FormControl fullWidth>
                                    <InputLabel>
                                        Estado civil
                                    </InputLabel>

                                    <Select
                                        name="estado_civil"
                                        value={
                                            formData.estado_civil
                                        }
                                        onChange={handleChange}
                                        label="Estado civil"
                                    >
                                        <MenuItem value="">
                                            Não informado
                                        </MenuItem>

                                        <MenuItem value="solteiro">
                                            Solteiro(a)
                                        </MenuItem>

                                        <MenuItem value="casado">
                                            Casado(a)
                                        </MenuItem>

                                        <MenuItem value="divorciado">
                                            Divorciado(a)
                                        </MenuItem>

                                        <MenuItem value="viuvo">
                                            Viúvo(a)
                                        </MenuItem>

                                        <MenuItem value="uniao_estavel">
                                            União estável
                                        </MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Convênio"
                                    name="convenio"
                                    value={formData.convenio}
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

                            <Grid item xs={12}>
                                <FormControl fullWidth>
                                    <InputLabel>
                                        Psicólogo responsável
                                    </InputLabel>

                                    <Select
                                        name="psicologo_id"
                                        value={
                                            formData.psicologo_id
                                        }
                                        onChange={handleChange}
                                        label="Psicólogo responsável"
                                    >
                                        <MenuItem value="">
                                            Sem psicólogo definido
                                        </MenuItem>

                                        {psicologos.map((p) => (
                                            <MenuItem
                                                key={p.id}
                                                value={p.id}
                                            >
                                                {p.nome_completo}
                                                {p.crp
                                                    ? ` - ${p.crp}`
                                                    : ''}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                    </Box>
                </DialogContent>

                <DialogActions sx={{ p: 3 }}>
                    <Button
                        onClick={handleFecharEditar}
                        disabled={loadingEditar}
                    >
                        Cancelar
                    </Button>

                    <Button
                        variant="contained"
                        onClick={handleSalvarEdicao}
                        disabled={loadingEditar}
                        sx={{
                            bgcolor: '#7B944A',
                            '&:hover': {
                                bgcolor: '#687F3E',
                            },
                        }}
                    >
                        {loadingEditar
                            ? 'Salvando...'
                            : 'Salvar Alterações'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* PRONTUÁRIO */}

            <Dialog
                open={openProntuario}
                onClose={handleCloseProntuario}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent:
                                'space-between',
                            alignItems: 'center',
                        }}
                    >
                        <Typography variant="h6">
                            Prontuário de{' '}
                            {
                                pacienteSelecionado?.nome_completo
                            }
                        </Typography>

                        <IconButton
                            onClick={
                                handleCloseProntuario
                            }
                        >
                            <Close />
                        </IconButton>
                    </Box>
                </DialogTitle>

                <DialogContent>
                    <Box sx={{ mb: 2 }}>
                        <Grid container spacing={1}>
                            <Grid item xs={6}>
                                <Typography variant="body2">
                                    <strong>Nome:</strong>{' '}
                                    {
                                        pacienteSelecionado?.nome_completo
                                    }
                                </Typography>
                            </Grid>

                            <Grid item xs={6}>
                                <Typography variant="body2">
                                    <strong>
                                        Telefone:
                                    </strong>{' '}
                                    {pacienteSelecionado?.telefone ||
                                        '-'}
                                </Typography>
                            </Grid>

                            <Grid item xs={6}>
                                <Typography variant="body2">
                                    <strong>Email:</strong>{' '}
                                    {pacienteSelecionado?.email ||
                                        '-'}
                                </Typography>
                            </Grid>

                            <Grid item xs={6}>
                                <Typography variant="body2">
                                    <strong>
                                        Data Nasc.:
                                    </strong>{' '}
                                    {formatarData(
                                        pacienteSelecionado?.data_nascimento
                                    )}
                                </Typography>
                            </Grid>

                            <Grid item xs={12}>
                                <Typography variant="body2">
                                    <strong>
                                        Psicólogo:
                                    </strong>{' '}
                                    {pacienteSelecionado?.psicologo_nome ||
                                        '-'}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Box>

                    <Divider sx={{ mb: 2 }} />

                    <Tabs
                        value={tab}
                        onChange={(e, v) => setTab(v)}
                        sx={{ mb: 2 }}
                    >
                        <Tab label="📋 Prontuário" />
                        <Tab label="📝 Evoluções" />
                    </Tabs>

                    {tab === 0 && (
                        <Box>
                            {prontuario ? (
                                <Grid
                                    container
                                    spacing={2}
                                >
                                    <Grid item xs={12}>
                                        <Typography
                                            variant="subtitle2"
                                            sx={{
                                                fontWeight:
                                                    'bold',
                                            }}
                                        >
                                            Queixa Principal
                                        </Typography>

                                        <Typography variant="body2">
                                            {prontuario.queixa_principal ||
                                                'Não informado'}
                                        </Typography>
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Typography
                                            variant="subtitle2"
                                            sx={{
                                                fontWeight:
                                                    'bold',
                                            }}
                                        >
                                            História da Doença Atual
                                        </Typography>

                                        <Typography variant="body2">
                                            {prontuario.historia_doenca_atual ||
                                                'Não informado'}
                                        </Typography>
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Typography
                                            variant="subtitle2"
                                            sx={{
                                                fontWeight:
                                                    'bold',
                                            }}
                                        >
                                            Impressão Diagnóstica
                                        </Typography>

                                        <Typography variant="body2">
                                            {prontuario.impressao_diagnostica ||
                                                'Não informado'}
                                        </Typography>
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Typography
                                            variant="subtitle2"
                                            sx={{
                                                fontWeight:
                                                    'bold',
                                            }}
                                        >
                                            Conduta Terapêutica
                                        </Typography>

                                        <Typography variant="body2">
                                            {prontuario.conduta_terapeutica ||
                                                'Não informado'}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            ) : (
                                <Typography
                                    sx={{
                                        color:
                                            'text.secondary',
                                    }}
                                >
                                    Nenhum prontuário registrado para este paciente.
                                </Typography>
                            )}
                        </Box>
                    )}

                    {tab === 1 && (
                        <Box>
                            {evolucoes.length === 0 ? (
                                <Typography
                                    sx={{
                                        color:
                                            'text.secondary',
                                    }}
                                >
                                    Nenhuma evolução registrada.
                                </Typography>
                            ) : (
                                evolucoes.map((e) => (
                                    <Paper
                                        key={e.id}
                                        sx={{
                                            p: 2,
                                            mb: 2,
                                            bgcolor:
                                                '#f8f9fa',
                                        }}
                                    >
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                color:
                                                    'text.secondary',
                                            }}
                                        >
                                            {formatarData(
                                                e.data
                                            )}
                                        </Typography>

                                        <Typography
                                            sx={{ mt: 1 }}
                                        >
                                            <strong>
                                                Descrição:
                                            </strong>{' '}
                                            {e.conteudo}
                                        </Typography>

                                        {e.procedimentos && (
                                            <Typography
                                                sx={{ mt: 1 }}
                                            >
                                                <strong>
                                                    Procedimentos:
                                                </strong>{' '}
                                                {
                                                    e.procedimentos
                                                }
                                            </Typography>
                                        )}

                                        {e.progresso && (
                                            <Typography
                                                sx={{ mt: 1 }}
                                            >
                                                <strong>
                                                    Progresso:
                                                </strong>{' '}
                                                {e.progresso}
                                            </Typography>
                                        )}
                                    </Paper>
                                ))
                            )}
                        </Box>
                    )}
                </DialogContent>

                <DialogActions>
                    <Button
                        onClick={
                            handleCloseProntuario
                        }
                    >
                        Fechar
                    </Button>
                </DialogActions>
            </Dialog>
        </Layout>
    );
}