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

    const obterDataLocal = () => {
        const agora = new Date();

        const ano = agora.getFullYear();
        const mes = String(agora.getMonth() + 1).padStart(2, '0');
        const dia = String(agora.getDate()).padStart(2, '0');

        return `${ano}-${mes}-${dia}`;
    };

    const hoje = obterDataLocal();

    const agendamentosHoje = agendamentos
        .filter((a) => normalizarData(a.data) === hoje)
        .sort((a, b) =>
            String(a.horario || '').localeCompare(
                String(b.horario || '')
            )
        );

    return (
        <Layout>
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 3,
                    gap: 2,
                    flexWrap: 'wrap',
                }}
            >
                <Typography
                    variant="h4"
                    sx={{ fontWeight: 'bold' }}
                >
                    Minha Agenda
                </Typography>

                <Typography
                    variant="body2"
                    sx={{ color: 'text.secondary' }}
                >
                    Visualize seus agendamentos. A criação é feita pela administração.
                </Typography>
            </Box>

            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <Card
                        sx={{
                            borderRadius: 3,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                            height: '100%',
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
                                Hoje
                            </Typography>

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
                                agendamentosHoje.map((ag) => (
                                    <Box
                                        key={ag.id}
                                        sx={{
                                            mb: 2,
                                            p: 2,
                                            bgcolor: '#f8f9fa',
                                            borderRadius: 2,
                                        }}
                                    >
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                fontWeight: 'bold',
                                            }}
                                        >
                                            {ag.horario
                                                ? ag.horario.slice(0, 5)
                                                : '-'}{' '}
                                            - {ag.paciente_nome}
                                        </Typography>

                                        <Typography
                                            variant="caption"
                                            sx={{
                                                color: 'text.secondary',
                                            }}
                                        >
                                            {ag.tipo_consulta}
                                        </Typography>

                                        <Chip
                                            label={ag.status}
                                            size="small"
                                            color={
                                                ag.status === 'confirmado'
                                                    ? 'success'
                                                    : ag.status === 'cancelado'
                                                      ? 'error'
                                                      : 'default'
                                            }
                                            sx={{ ml: 1 }}
                                        />

                                        {ag.compareceu !== null &&
                                            ag.compareceu !== undefined && (
                                                <Chip
                                                    label={
                                                        ag.compareceu
                                                            ? 'Compareceu'
                                                            : 'Não compareceu'
                                                    }
                                                    size="small"
                                                    color={
                                                        ag.compareceu
                                                            ? 'success'
                                                            : 'error'
                                                    }
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
                                }}
                            >
                                Todos os Agendamentos
                            </Typography>

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
                                                <strong>Tipo</strong>
                                            </TableCell>

                                            <TableCell>
                                                <strong>Status</strong>
                                            </TableCell>

                                            <TableCell>
                                                <strong>Presença</strong>
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>

                                    <TableBody>
                                        {agendamentos.map((ag) => (
                                            <TableRow key={ag.id}>
                                                <TableCell>
                                                    {formatarData(ag.data)}
                                                </TableCell>

                                                <TableCell>
                                                    {ag.horario
                                                        ? ag.horario.slice(0, 5)
                                                        : '-'}
                                                </TableCell>

                                                <TableCell>
                                                    {ag.paciente_nome}
                                                </TableCell>

                                                <TableCell>
                                                    {ag.tipo_consulta || '-'}
                                                </TableCell>

                                                <TableCell>
                                                    <Chip
                                                        label={ag.status}
                                                        size="small"
                                                        color={
                                                            ag.status === 'confirmado'
                                                                ? 'success'
                                                                : ag.status === 'cancelado'
                                                                  ? 'error'
                                                                  : 'default'
                                                        }
                                                    />
                                                </TableCell>

                                                <TableCell>
                                                    {ag.compareceu === true && (
                                                        <Chip
                                                            label="Compareceu"
                                                            size="small"
                                                            color="success"
                                                        />
                                                    )}

                                                    {ag.compareceu === false && (
                                                        <Chip
                                                            label="Não compareceu"
                                                            size="small"
                                                            color="error"
                                                        />
                                                    )}

                                                    {(ag.compareceu === null ||
                                                        ag.compareceu === undefined) && (
                                                        <Chip
                                                            label="Pendente"
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}

                                        {!loading &&
                                            agendamentos.length === 0 && (
                                                <TableRow>
                                                    <TableCell
                                                        colSpan={6}
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
                </Grid>
            </Grid>
        </Layout>
    );
}