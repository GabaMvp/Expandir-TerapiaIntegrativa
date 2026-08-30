import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    TextField,
    Button,
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
    Chip,
} from '@mui/material';
import { Add, Edit, Delete, Search } from '@mui/icons-material';
import Layout from '../components/Layout';
import api from '../services/api';

export default function Pacientes() {
    const [pacientes, setPacientes] = useState([]);
    const [search, setSearch] = useState('');
    const [openDialog, setOpenDialog] = useState(false);
    const [editando, setEditando] = useState(null);
    const [formData, setFormData] = useState({
        nome_completo: '',
        telefone: '',
        email: '',
        data_nascimento: '',
        genero: '',
        endereco: '',
        ocupacao: '',
        estado_civil: '',
        convenio: '',
    });

    const carregarPacientes = async () => {
        try {
            const response = await api.get('/pacientes');
            setPacientes(response.data);
        } catch (error) {
            console.error('Erro ao carregar pacientes:', error);
        }
    };

    useEffect(() => {
        carregarPacientes();
    }, []);

    const handleOpenDialog = (paciente = null) => {
        if (paciente) {
            setEditando(paciente);
            setFormData({
                ...paciente,
                data_nascimento: paciente.data_nascimento || '',
            });
        } else {
            setEditando(null);
            setFormData({
                nome_completo: '',
                telefone: '',
                email: '',
                data_nascimento: '',
                genero: '',
                endereco: '',
                ocupacao: '',
                estado_civil: '',
                convenio: '',
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditando(null);
    };

    const handleSubmit = async () => {
        try {
            if (editando) {
                await api.put(`/pacientes/${editando.id}`, formData);
            } else {
                await api.post('/pacientes', formData);
            }
            handleCloseDialog();
            carregarPacientes();
        } catch (error) {
            console.error('Erro ao salvar paciente:', error);
            alert('Erro ao salvar paciente. Tente novamente.');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Tem certeza que deseja excluir este paciente?')) {
            try {
                await api.delete(`/pacientes/${id}`);
                alert('Paciente excluído com sucesso!');
                carregarPacientes();
            } catch (error) {
                console.error('Erro ao excluir paciente:', error);
                alert('Erro ao excluir paciente. Tente novamente.');
            }
        }
    };

    const filtered = pacientes.filter(p =>
        p.nome_completo?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Layout>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    Pacientes
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => handleOpenDialog()}
                    sx={{ bgcolor: '#1a1a2e', '&:hover': { bgcolor: '#2a2a4e' } }}
                >
                    Novo Paciente
                </Button>
            </Box>

            <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', mb: 3 }}>
                <CardContent>
                    <TextField
                        fullWidth
                        placeholder="Buscar paciente..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} /> }}
                    />
                </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell><strong>Nome</strong></TableCell>
                                <TableCell><strong>Telefone</strong></TableCell>
                                <TableCell><strong>Email</strong></TableCell>
                                <TableCell><strong>Status</strong></TableCell>
                                <TableCell align="right"><strong>Ações</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filtered.map((p) => (
                                <TableRow key={p.id}>
                                    <TableCell>{p.nome_completo}</TableCell>
                                    <TableCell>{p.telefone || '-'}</TableCell>
                                    <TableCell>{p.email || '-'}</TableCell>
                                    <TableCell>
                                        <Chip label="Ativo" size="small" color="success" />
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton onClick={() => handleOpenDialog(p)} size="small">
                                            <Edit fontSize="small" />
                                        </IconButton>
                                        <IconButton onClick={() => handleDelete(p.id)} size="small" color="error">
                                            <Delete fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>

            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editando ? 'Editar Paciente' : 'Novo Paciente'}
                </DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Nome completo"
                        value={formData.nome_completo}
                        onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
                        margin="normal"
                        required
                    />
                    <TextField
                        fullWidth
                        label="Telefone"
                        value={formData.telefone}
                        onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                        margin="normal"
                    />
                    <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        margin="normal"
                    />
                    <TextField
                        fullWidth
                        label="Data de nascimento"
                        type="date"
                        value={formData.data_nascimento}
                        onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                        margin="normal"
                        InputLabelProps={{ shrink: true }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancelar</Button>
                    <Button onClick={handleSubmit} variant="contained" sx={{ bgcolor: '#1a1a2e' }}>
                        Salvar
                    </Button>
                </DialogActions>
            </Dialog>
        </Layout>
    );
}