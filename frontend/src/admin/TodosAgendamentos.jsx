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
} from '@mui/material';
import Layout from '../components/Layout';
import api from '../services/api';

export default function TodosAgendamentos() {
    const [agendamentos, setAgendamentos] = useState([]);

    useEffect(() => {
        carregarAgendamentos();
    }, []);

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
        const d = new Date(data);
        return d.toLocaleDateString('pt-BR');
    };

    return (
        <Layout>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    Todos os Agendamentos
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Visualize todos os agendamentos de todos os psicólogos.
                </Typography>
            </Box>

            <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <CardContent>
                    <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell><strong>Data</strong></TableCell>
                                    <TableCell><strong>Horário</strong></TableCell>
                                    <TableCell><strong>Paciente</strong></TableCell>
                                    <TableCell><strong>Psicólogo</strong></TableCell>
                                    <TableCell><strong>Tipo</strong></TableCell>
                                    <TableCell><strong>Valor</strong></TableCell>
                                    <TableCell><strong>Status</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {agendamentos.map((a) => (
                                    <TableRow key={a.id}>
                                        <TableCell>{formatarData(a.data)}</TableCell>
                                        <TableCell>{a.horario.slice(0, 5)}</TableCell>
                                        <TableCell>{a.paciente_nome}</TableCell>
                                        <TableCell>{a.psicologo_nome}</TableCell>
                                        <TableCell>{a.tipo_consulta}</TableCell>
                                        <TableCell>R$ {a.valor_consulta || 0}</TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={a.status} 
                                                size="small"
                                                color={a.status === 'confirmado' ? 'success' : a.status === 'cancelado' ? 'error' : 'default'}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>
        </Layout>
    );
}