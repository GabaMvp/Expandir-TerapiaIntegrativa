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
    Chip,
    IconButton,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    Tooltip,
} from '@mui/material';

import {
    Edit,
    CheckCircle,
    Cancel,
} from '@mui/icons-material';

import Layout from '../components/Layout';
import api from '../services/api';

export default function TodosAgendamentos() {
    const [agendamentos, setAgendamentos] = useState([]);
    const [pacientes, setPacientes] = useState([]);
    const [psicologos, setPsicologos] = useState([]);

    const [openEditar, setOpenEditar] = useState(false);
    const [agendamentoSelecionado, setAgendamentoSelecionado] = useState(null);

    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState('');
    const [sucesso, setSucesso] = useState('');

    const [formData, setFormData] = useState({
        paciente_id: '',
        psicologo_id_agendamento: '',
        data: '',
        horario: '',
        duracao: 50,
        tipo_consulta: 'presencial',
        valor_consulta: '',
        observacoes: '',
    });

    useEffect(() => {
        carregarTudo();
    }, []);

    const carregarTudo = async () => {
        try {
            const [
                agendamentosRes,
                pacientesRes,
                psicologosRes,
            ] = await Promise.all([
                api.get('/admin/agendamentos'),
                api.get('/admin/pacientes'),
                api.get('/admin/psicologos/disponiveis'),
            ]);

            setAgendamentos(agendamentosRes.data);
            setPacientes(pacientesRes.data);
            setPsicologos(psicologosRes.data);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        }
    };

    const carregarAgendamentos = async () => {
        try {
            const response = await api.get('/admin/agendamentos');
            setAgendamentos(response.data);
        } catch (error) {
            console.error('Erro ao carregar agendamentos:', error);
        }
    };

    const formatarData = (data) => {
        if (!data) return '-';

        const dataString = String(data).split('T')[0];
        const [ano, mes, dia] = dataString.split('-');

        if (!ano || !mes || !dia) {
            return data;
        }

        return `${dia}/${mes}/${ano}`;
    };

    const prepararDataInput = (data) => {
        if (!data) return '';
        return String(data).split('T')[0];
    };

    const prepararHorarioInput = (horario) => {
        if (!horario) return '';
        return String(horario).slice(0, 5);
    };

    const handleEditar = (agendamento) => {
        setAgendamentoSelecionado(agendamento);
        setErro('');
        setSucesso('');

        setFormData({
            paciente_id: agendamento.paciente_id || '',
            psicologo_id_agendamento: agendamento.psicologo_id || '',
            data: prepararDataInput(agendamento.data),
            horario: prepararHorarioInput(agendamento.horario),
            duracao: agendamento.duracao || 50,
            tipo_consulta: agendamento.tipo_consulta || 'presencial',
            valor_consulta:
                agendamento.valor_consulta !== null &&
                agendamento.valor_consulta !== undefined
                    ? agendamento.valor_consulta
                    : '',
            observacoes: agendamento.observacoes || '',
        });

        setOpenEditar(true);
    };

    const handleFecharEditar = () => {
        if (loading) return;

        setOpenEditar(false);
        setAgendamentoSelecionado(null);
        setErro('');
        setSucesso('');
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSalvarEdicao = async () => {
        setErro('');
        setSucesso('');

        if (!formData.psicologo_id_agendamento) {
            setErro('Selecione um psicólogo.');
            return;
        }

        if (!formData.paciente_id) {
            setErro('Selecione um paciente.');
            return;
        }

        if (!formData.data) {
            setErro('Selecione uma data.');
            return;
        }

        if (!formData.horario) {
            setErro('Selecione um horário.');
            return;
        }

        try {
            setLoading(true);

            const dados = {
                ...formData,
                duracao: Number(formData.duracao) || 50,
                valor_consulta: formData.valor_consulta
                    ? parseFloat(formData.valor_consulta)
                    : 0,
            };

            await api.put(
                `/agendamentos/${agendamentoSelecionado.id}`,
                dados
            );

            setSucesso('Agendamento atualizado com sucesso!');

            await carregarAgendamentos();

            setTimeout(() => {
                setOpenEditar(false);
                setAgendamentoSelecionado(null);
                setSucesso('');
            }, 700);
        } catch (error) {
            console.error('Erro ao editar agendamento:', error);

            setErro(
                error?.response?.data?.error ||
                'Erro ao editar agendamento.'
            );
        } finally {
            setLoading(false);
        }
    };

    const marcarComparecimento = async (agendamento, compareceu) => {
        try {
            await api.put(
                `/agendamentos/${agendamento.id}/compareceu`,
                {
                    compareceu,
                }
            );

            await carregarAgendamentos();
        } catch (error) {
            console.error(
                'Erro ao registrar comparecimento:',
                error
            );

            alert(
                error?.response?.data?.error ||
                'Erro ao registrar comparecimento.'
            );
        }
    };

    const renderStatus = (status) => {
        let color = 'default';

        if (status === 'confirmado') {
            color = 'success';
        }

        if (status === 'cancelado') {
            color = 'error';
        }

        return (
            <Chip
                label={status || 'agendado'}
                size="small"
                color={color}
            />
        );
    };

    const renderPresenca = (agendamento) => {
        if (agendamento.compareceu === true) {
            return (
                <Chip
                    label="Compareceu"
                    color="success"
                    size="small"
                />
            );
        }

        if (agendamento.compareceu === false) {
            return (
                <Chip
                    label="Não compareceu"
                    color="error"
                    size="small"
                />
            );
        }

        return (
            <Chip
                label="Pendente"
                size="small"
                variant="outlined"
            />
        );
    };

    return (
        <Layout>
            <Box sx={{ mb: 4 }}>
                <Typography
                    variant="h4"
                    sx={{ fontWeight: 'bold' }}
                >
                    Todos os Agendamentos
                </Typography>

                <Typography
                    variant="body2"
                    sx={{ color: 'text.secondary' }}
                >
                    Visualize, edite e registre a presença dos agendamentos.
                </Typography>
            </Box>

            <Card
                sx={{
                    borderRadius: 3,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                }}
            >
                <CardContent>
                    <TableContainer
                        component={Paper}
                        sx={{ boxShadow: 'none' }}
                    >
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>
                                        <strong>Data</strong>
                                    </TableCell>

                                    <TableCell>
                                        <strong>Horário</strong>
                                    </TableCell>

                                    <TableCell>
                                        <strong>Paciente</strong>
                                    </TableCell>

                                    <TableCell>
                                        <strong>Psicólogo</strong>
                                    </TableCell>

                                    <TableCell>
                                        <strong>Tipo</strong>
                                    </TableCell>

                                    <TableCell>
                                        <strong>Valor</strong>
                                    </TableCell>

                                    <TableCell>
                                        <strong>Status</strong>
                                    </TableCell>

                                    <TableCell>
                                        <strong>Presença</strong>
                                    </TableCell>

                                    <TableCell align="center">
                                        <strong>Ações</strong>
                                    </TableCell>
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {agendamentos.map((a) => (
                                    <TableRow key={a.id}>
                                        <TableCell>
                                            {formatarData(a.data)}
                                        </TableCell>

                                        <TableCell>
                                            {a.horario
                                                ? a.horario.slice(0, 5)
                                                : '-'}
                                        </TableCell>

                                        <TableCell>
                                            {a.paciente_nome}
                                        </TableCell>

                                        <TableCell>
                                            {a.psicologo_nome}
                                        </TableCell>

                                        <TableCell>
                                            {a.tipo_consulta || '-'}
                                        </TableCell>

                                        <TableCell>
                                            R$ {Number(
                                                a.valor_consulta || 0
                                            ).toFixed(2)}
                                        </TableCell>

                                        <TableCell>
                                            {renderStatus(a.status)}
                                        </TableCell>

                                        <TableCell>
                                            {renderPresenca(a)}
                                        </TableCell>

                                        <TableCell align="center">
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    gap: 0.5,
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <Tooltip title="Editar agendamento">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() =>
                                                            handleEditar(a)
                                                        }
                                                        sx={{
                                                            color: '#7B944A',
                                                        }}
                                                    >
                                                        <Edit />
                                                    </IconButton>
                                                </Tooltip>

                                                {a.status !== 'cancelado' && (
                                                    <>
                                                        <Tooltip title="Marcar como compareceu">
                                                            <IconButton
                                                                size="small"
                                                                color="success"
                                                                onClick={() =>
                                                                    marcarComparecimento(
                                                                        a,
                                                                        true
                                                                    )
                                                                }
                                                            >
                                                                <CheckCircle />
                                                            </IconButton>
                                                        </Tooltip>

                                                        <Tooltip title="Marcar como não compareceu">
                                                            <IconButton
                                                                size="small"
                                                                color="error"
                                                                onClick={() =>
                                                                    marcarComparecimento(
                                                                        a,
                                                                        false
                                                                    )
                                                                }
                                                            >
                                                                <Cancel />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </>
                                                )}
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))}

                                {agendamentos.length === 0 && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={9}
                                            align="center"
                                        >
                                            Nenhum agendamento encontrado.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>

            <Dialog
                open={openEditar}
                onClose={handleFecharEditar}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Editar Agendamento
                </DialogTitle>

                <DialogContent>
                    <Box sx={{ pt: 1 }}>
                        {erro && (
                            <Alert
                                severity="error"
                                sx={{ mb: 2 }}
                            >
                                {erro}
                            </Alert>
                        )}

                        {sucesso && (
                            <Alert
                                severity="success"
                                sx={{ mb: 2 }}
                            >
                                {sucesso}
                            </Alert>
                        )}

                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <FormControl
                                    fullWidth
                                    required
                                >
                                    <InputLabel>
                                        Psicólogo
                                    </InputLabel>

                                    <Select
                                        name="psicologo_id_agendamento"
                                        value={
                                            formData.psicologo_id_agendamento
                                        }
                                        onChange={handleChange}
                                        label="Psicólogo"
                                    >
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

                            <Grid item xs={12} md={6}>
                                <FormControl
                                    fullWidth
                                    required
                                >
                                    <InputLabel>
                                        Paciente
                                    </InputLabel>

                                    <Select
                                        name="paciente_id"
                                        value={formData.paciente_id}
                                        onChange={handleChange}
                                        label="Paciente"
                                    >
                                        {pacientes.map((p) => (
                                            <MenuItem
                                                key={p.id}
                                                value={p.id}
                                            >
                                                {p.nome_completo}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    required
                                    label="Data da Consulta"
                                    name="data"
                                    type="date"
                                    value={formData.data}
                                    onChange={handleChange}
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    required
                                    label="Horário"
                                    name="horario"
                                    type="time"
                                    value={formData.horario}
                                    onChange={handleChange}
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth>
                                    <InputLabel>
                                        Tipo de Consulta
                                    </InputLabel>

                                    <Select
                                        name="tipo_consulta"
                                        value={formData.tipo_consulta}
                                        onChange={handleChange}
                                        label="Tipo de Consulta"
                                    >
                                        <MenuItem value="presencial">
                                            Presencial
                                        </MenuItem>

                                        <MenuItem value="online">
                                            Online
                                        </MenuItem>
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
                                    InputProps={{
                                        inputProps: {
                                            min: 15,
                                            max: 120,
                                        },
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Valor da Consulta (R$)"
                                    name="valor_consulta"
                                    type="number"
                                    value={formData.valor_consulta}
                                    onChange={handleChange}
                                    inputProps={{
                                        min: 0,
                                        step: '0.01',
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
                                />
                            </Grid>
                        </Grid>
                    </Box>
                </DialogContent>

                <DialogActions sx={{ p: 3 }}>
                    <Button
                        onClick={handleFecharEditar}
                        disabled={loading}
                    >
                        Cancelar
                    </Button>

                    <Button
                        variant="contained"
                        onClick={handleSalvarEdicao}
                        disabled={loading}
                        sx={{
                            bgcolor: '#7B944A',
                            '&:hover': {
                                bgcolor: '#687F3E',
                            },
                        }}
                    >
                        {loading
                            ? 'Salvando...'
                            : 'Salvar Alterações'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Layout>
    );
}