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
    FormControl,
    InputLabel,
    Select,
    Paper,
    Divider,
    Tabs,
    Tab,
    Chip,
} from '@mui/material';

import Layout from '../components/Layout';
import api from '../services/api';

export default function Prontuarios() {
    const obterDataLocal = () => {
        const agora = new Date();
        const ano = agora.getFullYear();
        const mes = String(agora.getMonth() + 1).padStart(2, '0');
        const dia = String(agora.getDate()).padStart(2, '0');

        return `${ano}-${mes}-${dia}`;
    };

    const prontuarioVazio = {
        naturalidade: '',
        nacionalidade: '',
        religiao: '',
        escolaridade: '',
        profissao: '',
        estado_civil: '',
        motivo_busca: '',
        objetivos_terapeuticos: '',
        queixa_principal: '',
        historia_doenca_atual: '',
        historico_familiar: '',
        historico_pessoal: '',
        medicamentos_atuais: '',
        alergias: '',
        impressao_diagnostica: '',
        hipoteses_diagnosticas: '',
        cid_codigo: '',
        conduta_terapeutica: '',
        frequencia_atendimento: '',
        data_encerramento: '',
        motivo_encerramento: '',
        encaminhamento_para: '',
        observacoes_encerramento: '',
    };

    const [pacientes, setPacientes] = useState([]);
    const [pacienteSelecionado, setPacienteSelecionado] = useState('');
    const [evolucoes, setEvolucoes] = useState([]);
    const [tab, setTab] = useState(0);

    const [novaEvolucao, setNovaEvolucao] = useState({
        data: obterDataLocal(),
        conteudo: '',
        procedimentos: '',
        progresso: '',
    });

    const [formData, setFormData] = useState(prontuarioVazio);

    const carregarPacientes = async () => {
        try {
            const response = await api.get('/pacientes');
            setPacientes(response.data);
        } catch (error) {
            console.error('Erro ao carregar pacientes:', error);
        }
    };

    const carregarProntuario = async (pacienteId) => {
        if (!pacienteId) {
            return;
        }

        try {
            const response = await api.get(
                `/prontuarios/paciente/${pacienteId}`
            );

            setFormData({
                ...prontuarioVazio,
                ...(response.data || {}),
            });
        } catch (error) {
            setFormData(prontuarioVazio);
        }
    };

    const carregarEvolucoes = async (pacienteId) => {
        if (!pacienteId) {
            return;
        }

        try {
            const response = await api.get(
                `/prontuarios/paciente/${pacienteId}/evolucoes`
            );

            setEvolucoes(response.data);
        } catch (error) {
            setEvolucoes([]);
        }
    };

    useEffect(() => {
        carregarPacientes();
    }, []);

    useEffect(() => {
        if (pacienteSelecionado) {
            carregarProntuario(pacienteSelecionado);
            carregarEvolucoes(pacienteSelecionado);
        } else {
            setFormData(prontuarioVazio);
            setEvolucoes([]);
        }
    }, [pacienteSelecionado]);

    const handleSalvarProntuario = async () => {
        try {
            await api.post(
                `/prontuarios/paciente/${pacienteSelecionado}`,
                formData
            );

            alert('Prontuário salvo com sucesso!');

            carregarProntuario(pacienteSelecionado);
        } catch (error) {
            console.error('Erro ao salvar prontuário:', error);

            alert(
                error?.response?.data?.error ||
                    'Erro ao salvar prontuário.'
            );
        }
    };

    const handleAdicionarEvolucao = async () => {
        try {
            await api.post(
                `/prontuarios/paciente/${pacienteSelecionado}/evolucoes`,
                {
                    data: novaEvolucao.data || '',
                    conteudo: novaEvolucao.conteudo || '',
                    procedimentos:
                        novaEvolucao.procedimentos || '',
                    progresso: novaEvolucao.progresso || '',
                    sigiloso: true,
                }
            );

            setNovaEvolucao({
                data: obterDataLocal(),
                conteudo: '',
                procedimentos: '',
                progresso: '',
            });

            await carregarEvolucoes(pacienteSelecionado);

            alert('Evolução adicionada com sucesso!');
        } catch (error) {
            console.error('Erro ao adicionar evolução:', error);

            alert(
                error?.response?.data?.error ||
                    'Erro ao adicionar evolução.'
            );
        }
    };

    const handleEncerrarCaso = async () => {
        if (
            !window.confirm(
                'Tem certeza que deseja encerrar este caso?'
            )
        ) {
            return;
        }

        try {
            await api.post(
                `/prontuarios/paciente/${pacienteSelecionado}`,
                {
                    ...formData,
                    data_encerramento: obterDataLocal(),
                }
            );

            alert('Caso encerrado com sucesso!');

            carregarProntuario(pacienteSelecionado);
        } catch (error) {
            console.error('Erro ao encerrar caso:', error);

            alert(
                error?.response?.data?.error ||
                    'Erro ao encerrar caso.'
            );
        }
    };

    const pacienteInfo = pacientes.find(
        (p) => p.id === pacienteSelecionado
    );

    const formatarData = (data) => {
        if (!data) {
            return '-';
        }

        const dataString = String(data).split('T')[0];
        const [ano, mes, dia] = dataString.split('-');

        if (!ano || !mes || !dia) {
            return data;
        }

        return `${dia}/${mes}/${ano}`;
    };

    return (
        <Layout>
            <Box sx={{ mb: 3 }}>
                <Typography
                    variant="h4"
                    sx={{ fontWeight: 'bold' }}
                >
                    Prontuários
                </Typography>
            </Box>

            <Card
                sx={{
                    borderRadius: 3,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    mb: 3,
                }}
            >
                <CardContent>
                    <FormControl fullWidth>
                        <InputLabel>
                            Selecione o paciente
                        </InputLabel>

                        <Select
                            value={pacienteSelecionado}
                            onChange={(e) =>
                                setPacienteSelecionado(
                                    e.target.value
                                )
                            }
                            label="Selecione o paciente"
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
                </CardContent>
            </Card>

            {pacienteSelecionado && (
                <>
                    <Card
                        sx={{
                            borderRadius: 3,
                            boxShadow:
                                '0 2px 8px rgba(0,0,0,0.05)',
                            mb: 3,
                        }}
                    >
                        <CardContent>
                            <Typography
                                variant="h6"
                                sx={{
                                    fontWeight: 'bold',
                                    mb: 2,
                                }}
                            >
                                👤 Identificação do Paciente
                            </Typography>

                            <Grid container spacing={2}>
                                <Grid
                                    item
                                    xs={12}
                                    md={6}
                                >
                                    <Typography variant="body2">
                                        <strong>Nome:</strong>{' '}
                                        {pacienteInfo?.nome_completo ||
                                            '-'}
                                    </Typography>
                                </Grid>

                                <Grid
                                    item
                                    xs={12}
                                    md={6}
                                >
                                    <Typography variant="body2">
                                        <strong>
                                            Telefone:
                                        </strong>{' '}
                                        {pacienteInfo?.telefone ||
                                            '-'}
                                    </Typography>
                                </Grid>

                                <Grid
                                    item
                                    xs={12}
                                    md={6}
                                >
                                    <Typography variant="body2">
                                        <strong>Email:</strong>{' '}
                                        {pacienteInfo?.email ||
                                            '-'}
                                    </Typography>
                                </Grid>

                                <Grid
                                    item
                                    xs={12}
                                    md={6}
                                >
                                    <Typography variant="body2">
                                        <strong>
                                            Data de Nascimento:
                                        </strong>{' '}
                                        {formatarData(
                                            pacienteInfo?.data_nascimento
                                        )}
                                    </Typography>
                                </Grid>

                                {formData.data_encerramento && (
                                    <Grid item xs={12}>
                                        <Chip
                                            label={`Caso encerrado em: ${formatarData(
                                                formData.data_encerramento
                                            )}`}
                                            color="error"
                                        />
                                    </Grid>
                                )}
                            </Grid>
                        </CardContent>
                    </Card>

                    <Tabs
                        value={tab}
                        onChange={(e, v) => setTab(v)}
                        sx={{ mb: 2 }}
                    >
                        <Tab label="📋 Avaliação" />
                        <Tab label="📝 Evoluções" />
                        <Tab label="🔚 Encerramento" />
                    </Tabs>

                    {tab === 0 && (
                        <Card
                            sx={{
                                borderRadius: 3,
                                boxShadow:
                                    '0 2px 8px rgba(0,0,0,0.05)',
                            }}
                        >
                            <CardContent>
                                <Typography
                                    variant="h6"
                                    sx={{
                                        fontWeight: 'bold',
                                        mb: 2,
                                    }}
                                >
                                    🎯 Avaliação da Demanda
                                </Typography>

                                <Typography
                                    variant="body2"
                                    sx={{
                                        color: 'text.secondary',
                                        mb: 2,
                                    }}
                                >
                                    Todos os campos abaixo são
                                    opcionais.
                                </Typography>

                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Motivo da Busca"
                                            multiline
                                            rows={2}
                                            value={
                                                formData.motivo_busca ||
                                                ''
                                            }
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    motivo_busca:
                                                        e.target
                                                            .value,
                                                })
                                            }
                                        />
                                    </Grid>

                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Objetivos do Trabalho Terapêutico"
                                            multiline
                                            rows={2}
                                            value={
                                                formData.objetivos_terapeuticos ||
                                                ''
                                            }
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    objetivos_terapeuticos:
                                                        e.target
                                                            .value,
                                                })
                                            }
                                        />
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Divider
                                            sx={{ my: 2 }}
                                        />

                                        <Typography
                                            variant="h6"
                                            sx={{
                                                fontWeight:
                                                    'bold',
                                                mb: 2,
                                            }}
                                        >
                                            📋 Histórico do Paciente
                                        </Typography>
                                    </Grid>

                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Queixa Principal"
                                            multiline
                                            rows={2}
                                            value={
                                                formData.queixa_principal ||
                                                ''
                                            }
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    queixa_principal:
                                                        e.target
                                                            .value,
                                                })
                                            }
                                        />
                                    </Grid>

                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="História da Doença Atual"
                                            multiline
                                            rows={3}
                                            value={
                                                formData.historia_doenca_atual ||
                                                ''
                                            }
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    historia_doenca_atual:
                                                        e.target
                                                            .value,
                                                })
                                            }
                                        />
                                    </Grid>

                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Histórico Familiar"
                                            multiline
                                            rows={2}
                                            value={
                                                formData.historico_familiar ||
                                                ''
                                            }
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    historico_familiar:
                                                        e.target
                                                            .value,
                                                })
                                            }
                                        />
                                    </Grid>

                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Histórico Pessoal"
                                            multiline
                                            rows={2}
                                            value={
                                                formData.historico_pessoal ||
                                                ''
                                            }
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    historico_pessoal:
                                                        e.target
                                                            .value,
                                                })
                                            }
                                        />
                                    </Grid>

                                    <Grid
                                        item
                                        xs={12}
                                        md={6}
                                    >
                                        <TextField
                                            fullWidth
                                            label="Medicamentos Atuais"
                                            value={
                                                formData.medicamentos_atuais ||
                                                ''
                                            }
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    medicamentos_atuais:
                                                        e.target
                                                            .value,
                                                })
                                            }
                                        />
                                    </Grid>

                                    <Grid
                                        item
                                        xs={12}
                                        md={6}
                                    >
                                        <TextField
                                            fullWidth
                                            label="Alergias"
                                            value={
                                                formData.alergias ||
                                                ''
                                            }
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    alergias:
                                                        e.target
                                                            .value,
                                                })
                                            }
                                        />
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Divider
                                            sx={{ my: 2 }}
                                        />

                                        <Typography
                                            variant="h6"
                                            sx={{
                                                fontWeight:
                                                    'bold',
                                                mb: 2,
                                            }}
                                        >
                                            🧠 Diagnóstico e Conduta
                                        </Typography>
                                    </Grid>

                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Impressão Diagnóstica"
                                            multiline
                                            rows={2}
                                            value={
                                                formData.impressao_diagnostica ||
                                                ''
                                            }
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    impressao_diagnostica:
                                                        e.target
                                                            .value,
                                                })
                                            }
                                        />
                                    </Grid>

                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Hipóteses Diagnósticas"
                                            multiline
                                            rows={2}
                                            value={
                                                formData.hipoteses_diagnosticas ||
                                                ''
                                            }
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    hipoteses_diagnosticas:
                                                        e.target
                                                            .value,
                                                })
                                            }
                                        />
                                    </Grid>

                                    <Grid
                                        item
                                        xs={12}
                                        md={6}
                                    >
                                        <TextField
                                            fullWidth
                                            label="CID"
                                            value={
                                                formData.cid_codigo ||
                                                ''
                                            }
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    cid_codigo:
                                                        e.target
                                                            .value,
                                                })
                                            }
                                            placeholder="Ex: F41.1"
                                        />
                                    </Grid>

                                    <Grid
                                        item
                                        xs={12}
                                        md={6}
                                    >
                                        <TextField
                                            fullWidth
                                            label="Frequência de Atendimento"
                                            value={
                                                formData.frequencia_atendimento ||
                                                ''
                                            }
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    frequencia_atendimento:
                                                        e.target
                                                            .value,
                                                })
                                            }
                                            placeholder="Ex: 1x/semana"
                                        />
                                    </Grid>

                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Conduta Terapêutica"
                                            multiline
                                            rows={2}
                                            value={
                                                formData.conduta_terapeutica ||
                                                ''
                                            }
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    conduta_terapeutica:
                                                        e.target
                                                            .value,
                                                })
                                            }
                                        />
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Button
                                            variant="contained"
                                            onClick={
                                                handleSalvarProntuario
                                            }
                                            sx={{
                                                bgcolor:
                                                    '#1a1a2e',
                                                '&:hover': {
                                                    bgcolor:
                                                        '#2a2a4e',
                                                },
                                            }}
                                        >
                                            Salvar Prontuário
                                        </Button>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    )}

                    {tab === 1 && (
                        <Card
                            sx={{
                                borderRadius: 3,
                                boxShadow:
                                    '0 2px 8px rgba(0,0,0,0.05)',
                            }}
                        >
                            <CardContent>
                                <Typography
                                    variant="h6"
                                    sx={{
                                        fontWeight: 'bold',
                                        mb: 2,
                                    }}
                                >
                                    📝 Nova Evolução
                                </Typography>

                                <Typography
                                    variant="body2"
                                    sx={{
                                        color: 'text.secondary',
                                        mb: 2,
                                    }}
                                >
                                    Todos os campos abaixo são
                                    opcionais.
                                </Typography>

                                <Grid container spacing={2}>
                                    <Grid
                                        item
                                        xs={12}
                                        md={4}
                                    >
                                        <TextField
                                            fullWidth
                                            label="Data da Sessão"
                                            type="date"
                                            value={
                                                novaEvolucao.data
                                            }
                                            onChange={(e) =>
                                                setNovaEvolucao({
                                                    ...novaEvolucao,
                                                    data: e.target
                                                        .value,
                                                })
                                            }
                                            InputLabelProps={{
                                                shrink: true,
                                            }}
                                        />
                                    </Grid>

                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Descrição da Sessão"
                                            multiline
                                            rows={3}
                                            placeholder="Descreva o que aconteceu na sessão..."
                                            value={
                                                novaEvolucao.conteudo
                                            }
                                            onChange={(e) =>
                                                setNovaEvolucao({
                                                    ...novaEvolucao,
                                                    conteudo:
                                                        e.target
                                                            .value,
                                                })
                                            }
                                        />
                                    </Grid>

                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Procedimentos Técnico-Científicos Adotados"
                                            multiline
                                            rows={2}
                                            placeholder="Quais técnicas ou abordagens foram utilizadas?"
                                            value={
                                                novaEvolucao.procedimentos
                                            }
                                            onChange={(e) =>
                                                setNovaEvolucao({
                                                    ...novaEvolucao,
                                                    procedimentos:
                                                        e.target
                                                            .value,
                                                })
                                            }
                                        />
                                    </Grid>

                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Progresso do Paciente"
                                            multiline
                                            rows={2}
                                            placeholder="Como o paciente evoluiu? O que mudou?"
                                            value={
                                                novaEvolucao.progresso
                                            }
                                            onChange={(e) =>
                                                setNovaEvolucao({
                                                    ...novaEvolucao,
                                                    progresso:
                                                        e.target
                                                            .value,
                                                })
                                            }
                                        />
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Button
                                            variant="contained"
                                            onClick={
                                                handleAdicionarEvolucao
                                            }
                                            sx={{
                                                bgcolor:
                                                    '#1a1a2e',
                                                '&:hover': {
                                                    bgcolor:
                                                        '#2a2a4e',
                                                },
                                            }}
                                        >
                                            Adicionar Evolução
                                        </Button>
                                    </Grid>
                                </Grid>

                                <Divider sx={{ my: 3 }} />

                                <Typography
                                    variant="h6"
                                    sx={{
                                        fontWeight: 'bold',
                                        mb: 2,
                                    }}
                                >
                                    📋 Histórico de Evoluções
                                </Typography>

                                {evolucoes.length === 0 ? (
                                    <Typography
                                        sx={{
                                            color: 'text.secondary',
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
                                                    color: 'text.secondary',
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
                                                {e.conteudo ||
                                                    'Não informado'}
                                            </Typography>

                                            {e.procedimentos && (
                                                <Typography
                                                    sx={{
                                                        mt: 1,
                                                    }}
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
                                                    sx={{
                                                        mt: 1,
                                                    }}
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
                            </CardContent>
                        </Card>
                    )}

                    {tab === 2 && (
                        <Card
                            sx={{
                                borderRadius: 3,
                                boxShadow:
                                    '0 2px 8px rgba(0,0,0,0.05)',
                            }}
                        >
                            <CardContent>
                                <Typography
                                    variant="h6"
                                    sx={{
                                        fontWeight: 'bold',
                                        mb: 2,
                                    }}
                                >
                                    🔚 Encaminhamento /
                                    Encerramento
                                </Typography>

                                <Typography
                                    variant="body2"
                                    sx={{
                                        color: 'text.secondary',
                                        mb: 2,
                                    }}
                                >
                                    Todos os campos abaixo são
                                    opcionais.
                                </Typography>

                                <Grid container spacing={2}>
                                    {formData.data_encerramento ? (
                                        <>
                                            <Grid item xs={12}>
                                                <Typography
                                                    variant="body1"
                                                    sx={{
                                                        color: 'text.secondary',
                                                    }}
                                                >
                                                    <strong>
                                                        Caso
                                                        encerrado
                                                        em:
                                                    </strong>{' '}
                                                    {formatarData(
                                                        formData.data_encerramento
                                                    )}
                                                </Typography>
                                            </Grid>

                                            <Grid item xs={12}>
                                                <TextField
                                                    fullWidth
                                                    label="Motivo do Encerramento"
                                                    multiline
                                                    rows={2}
                                                    value={
                                                        formData.motivo_encerramento ||
                                                        ''
                                                    }
                                                    disabled
                                                />
                                            </Grid>

                                            <Grid item xs={12}>
                                                <TextField
                                                    fullWidth
                                                    label="Encaminhamento para"
                                                    value={
                                                        formData.encaminhamento_para ||
                                                        ''
                                                    }
                                                    disabled
                                                />
                                            </Grid>

                                            <Grid item xs={12}>
                                                <TextField
                                                    fullWidth
                                                    label="Observações sobre o Encerramento"
                                                    multiline
                                                    rows={2}
                                                    value={
                                                        formData.observacoes_encerramento ||
                                                        ''
                                                    }
                                                    disabled
                                                />
                                            </Grid>
                                        </>
                                    ) : (
                                        <>
                                            <Grid item xs={12}>
                                                <TextField
                                                    fullWidth
                                                    label="Motivo do Encerramento"
                                                    multiline
                                                    rows={2}
                                                    value={
                                                        formData.motivo_encerramento ||
                                                        ''
                                                    }
                                                    onChange={(e) =>
                                                        setFormData(
                                                            {
                                                                ...formData,
                                                                motivo_encerramento:
                                                                    e
                                                                        .target
                                                                        .value,
                                                            }
                                                        )
                                                    }
                                                    placeholder="Ex: Alta, transferência, abandono, etc."
                                                />
                                            </Grid>

                                            <Grid item xs={12}>
                                                <TextField
                                                    fullWidth
                                                    label="Encaminhamento para"
                                                    value={
                                                        formData.encaminhamento_para ||
                                                        ''
                                                    }
                                                    onChange={(e) =>
                                                        setFormData(
                                                            {
                                                                ...formData,
                                                                encaminhamento_para:
                                                                    e
                                                                        .target
                                                                        .value,
                                                            }
                                                        )
                                                    }
                                                    placeholder="Ex: Psiquiatra, outro profissional, serviço especializado"
                                                />
                                            </Grid>

                                            <Grid item xs={12}>
                                                <TextField
                                                    fullWidth
                                                    label="Observações sobre o Encerramento"
                                                    multiline
                                                    rows={2}
                                                    value={
                                                        formData.observacoes_encerramento ||
                                                        ''
                                                    }
                                                    onChange={(e) =>
                                                        setFormData(
                                                            {
                                                                ...formData,
                                                                observacoes_encerramento:
                                                                    e
                                                                        .target
                                                                        .value,
                                                            }
                                                        )
                                                    }
                                                />
                                            </Grid>

                                            <Grid
                                                item
                                                xs={12}
                                                sx={{
                                                    display:
                                                        'flex',
                                                    gap: 2,
                                                }}
                                            >
                                                <Button
                                                    variant="contained"
                                                    onClick={
                                                        handleSalvarProntuario
                                                    }
                                                    sx={{
                                                        bgcolor:
                                                            '#1a1a2e',
                                                        '&:hover':
                                                            {
                                                                bgcolor:
                                                                    '#2a2a4e',
                                                            },
                                                    }}
                                                >
                                                    Salvar
                                                </Button>

                                                <Button
                                                    variant="contained"
                                                    color="error"
                                                    onClick={
                                                        handleEncerrarCaso
                                                    }
                                                >
                                                    Encerrar Caso
                                                </Button>
                                            </Grid>
                                        </>
                                    )}
                                </Grid>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </Layout>
    );
}