import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Chip,
    IconButton,
    InputAdornment,
} from '@mui/material';
import { Delete } from '@mui/icons-material';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function CalendarioAgenda({ isAdminView }) {
    const { isAdmin } = useAuth();
    const [date, setDate] = useState(new Date());
    const [agendamentos, setAgendamentos] = useState([]);
    const [pacientes, setPacientes] = useState([]);
    const [psicologos, setPsicologos] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [marcando, setMarcando] = useState(null);
    const [formData, setFormData] = useState({
        paciente_id: '',
        psicologo_id_agendamento: '',
        data: new Date().toISOString().split('T')[0],
        horario: '09:00',
        duracao: 50,
        tipo_consulta: 'presencial',
        valor_consulta: '',
        observacoes: '',
    });

    const carregarDados = async () => {
        try {
            const [agendamentosRes, pacientesRes] = await Promise.all([
                api.get('/agendamentos'),
                api.get('/pacientes'),
            ]);
            setAgendamentos(agendamentosRes.data);
            setPacientes(pacientesRes.data);

            if (isAdmin) {
                const psicologosRes = await api.get('/admin/psicologos/disponiveis');
                setPsicologos(psicologosRes.data);
            }
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        }
    };

    useEffect(() => {
        carregarDados();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleOpenDialog = () => {
        setFormData({
            paciente_id: '',
            psicologo_id_agendamento: '',
            data: date.toISOString().split('T')[0],
            horario: '09:00',
            duracao: 50,
            tipo_consulta: 'presencial',
            valor_consulta: '',
            observacoes: '',
        });
        setOpenDialog(true);
    };

    const handleCloseDialog = () => setOpenDialog(false);

    const handleSubmit = async () => {
        try {
            const dataToSend = {
                ...formData,
                valor_consulta: formData.valor_consulta ? parseFloat(formData.valor_consulta) : 0
            };
            await api.post('/agendamentos', dataToSend);
            handleCloseDialog();
            carregarDados();
        } catch (error) {
            alert(error.response?.data?.error || 'Erro ao criar agendamento');
        }
    };

    const handleComparecimento = async (id, compareceu) => {
        setMarcando(id);
        try {
            await api.put(`/agendamentos/${id}/compareceu`, { compareceu });
            carregarDados();
        } catch (error) {
            alert('Erro ao registrar comparecimento.');
        } finally {
            setMarcando(null);
        }
    };

    const handleCancelar = async (id) => {
        if (!isAdmin) {
            alert('Apenas administradores podem cancelar agendamentos.');
            return;
        }
        if (window.confirm('Cancelar este agendamento?')) {
            try {
                await api.delete(`/agendamentos/${id}`);
                carregarDados();
            } catch (error) {
                console.error('Erro ao cancelar:', error);
            }
        }
    };

    const formatarValor = (valor) => {
        if (!valor) return 'R$ 0,00';
        return `R$ ${parseFloat(valor).toFixed(2).replace('.', ',')}`;
    };

    const extrairData = (data) => {
        if (!data) return '';
        if (typeof data === 'string' && data.includes('T')) {
            return data.split('T')[0];
        }
        if (data instanceof Date) {
            return data.toISOString().split('T')[0];
        }
        return data;
    };

    const dataSelecionada = date.toISOString().split('T')[0];
    const agendamentosDoDia = agendamentos.filter(a => {
        const dataAgendamento = extrairData(a.data);
        return dataAgendamento === dataSelecionada;
    });

    return (
        <Box>
            <Grid container spacing={3}>
                <Grid item xs={12} md={5}>
                    <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <CardContent>
                            <Calendar
                                onChange={setDate}
                                value={date}
                                locale="pt-BR"
                                tileContent={({ date: tileDate }) => {
                                    const dataStr = tileDate.toISOString().split('T')[0];
                                    const agendamentosData = agendamentos.filter(a => {
                                        const aData = extrairData(a.data);
                                        return aData === dataStr;
                                    });
                                    return agendamentosData.length > 0 ? (
                                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                                            <Box sx={{ width: 6, height: 6, bgcolor: '#4a9eff', borderRadius: '50%' }} />
                                        </Box>
                                    ) : null;
                                }}
                            />
                            {isAdmin && (
                                <Button
                                    fullWidth
                                    variant="contained"
                                    onClick={handleOpenDialog}
                                    sx={{ mt: 2, bgcolor: '#1a1a2e', '&:hover': { bgcolor: '#2a2a4e' } }}
                                >
                                    + Novo Agendamento
                                </Button>
                            )}
                            {!isAdmin && (
                                <Typography variant="caption" sx={{ display: 'block', mt: 2, textAlign: 'center', color: 'text.secondary' }}>
                                    A criação de agendamentos é feita pela administração.
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={7}>
                    <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', height: '100%' }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                                📅 {date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </Typography>

                            {agendamentosDoDia.length === 0 ? (
                                <Typography sx={{ color: 'text.secondary' }}>
                                    Nenhum agendamento para este dia.
                                </Typography>
                            ) : (
                                agendamentosDoDia.map((ag) => (
                                    <Box key={ag.id} sx={{ mb: 2, p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Box>
                                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                    {ag.horario.slice(0, 5)} - {ag.paciente_nome}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                    {ag.tipo_consulta}
                                                    {isAdmin && ag.valor_consulta && ` - ${formatarValor(ag.valor_consulta)}`}
                                                    {isAdmin && ` - Psicólogo: ${ag.psicologo_nome}`}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                {ag.compareceu === null ? (
                                                    <>
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            color="success"
                                                            onClick={() => handleComparecimento(ag.id, true)}
                                                            disabled={marcando === ag.id}
                                                            sx={{ fontSize: '0.7rem' }}
                                                        >
                                                            Sim
                                                        </Button>
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            color="error"
                                                            onClick={() => handleComparecimento(ag.id, false)}
                                                            disabled={marcando === ag.id}
                                                            sx={{ fontSize: '0.7rem' }}
                                                        >
                                                            Não
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <Chip
                                                        label={ag.compareceu ? '✅ Compareceu' : '❌ Faltou'}
                                                        size="small"
                                                        color={ag.compareceu ? 'success' : 'error'}
                                                    />
                                                )}
                                                <Chip
                                                    label={ag.status}
                                                    size="small"
                                                    color={ag.status === 'confirmado' ? 'success' : ag.status === 'cancelado' ? 'error' : 'default'}
                                                />
                                                {isAdmin && ag.status !== 'cancelado' && (
                                                    <IconButton onClick={() => handleCancelar(ag.id)} size="small" color="error">
                                                        <Delete fontSize="small" />
                                                    </IconButton>
                                                )}
                                            </Box>
                                        </Box>
                                    </Box>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>Novo Agendamento</DialogTitle>
                <DialogContent>
                    {isAdmin && (
                        <TextField
                            select
                            fullWidth
                            label="Selecione o Psicólogo"
                            value={formData.psicologo_id_agendamento}
                            onChange={(e) => setFormData({ ...formData, psicologo_id_agendamento: e.target.value })}
                            margin="normal"
                            required
                            helperText="Escolha o psicólogo que irá atender"
                        >
                            {psicologos.length === 0 ? (
                                <MenuItem disabled value="">
                                    Nenhum psicólogo disponível
                                </MenuItem>
                            ) : (
                                psicologos.map((p) => (
                                    <MenuItem key={p.id} value={p.id}>
                                        {p.nome_completo} - {p.crp}
                                    </MenuItem>
                                ))
                            )}
                        </TextField>
                    )}

                    <TextField
                        select
                        fullWidth
                        label="Selecione o Paciente"
                        value={formData.paciente_id}
                        onChange={(e) => setFormData({ ...formData, paciente_id: e.target.value })}
                        margin="normal"
                        required
                    >
                        {pacientes.length === 0 ? (
                            <MenuItem disabled value="">
                                Nenhum paciente cadastrado
                            </MenuItem>
                        ) : (
                            pacientes.map((p) => (
                                <MenuItem key={p.id} value={p.id}>{p.nome_completo}</MenuItem>
                            ))
                        )}
                    </TextField>

                    <TextField
                        fullWidth
                        label="Data"
                        type="date"
                        value={formData.data}
                        onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                        margin="normal"
                        InputLabelProps={{ shrink: true }}
                        required
                    />

                    <TextField
                        fullWidth
                        label="Horário"
                        type="time"
                        value={formData.horario}
                        onChange={(e) => setFormData({ ...formData, horario: e.target.value })}
                        margin="normal"
                        InputLabelProps={{ shrink: true }}
                        required
                    />

                    <TextField
                        select
                        fullWidth
                        label="Tipo de consulta"
                        value={formData.tipo_consulta}
                        onChange={(e) => setFormData({ ...formData, tipo_consulta: e.target.value })}
                        margin="normal"
                    >
                        <MenuItem value="presencial">Presencial</MenuItem>
                        <MenuItem value="online">Online</MenuItem>
                    </TextField>

                    <TextField
                        fullWidth
                        label="Valor da Consulta (R$)"
                        type="text"
                        value={formData.valor_consulta}
                        onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            setFormData({ ...formData, valor_consulta: value });
                        }}
                        margin="normal"
                        placeholder="Digite o valor (ex: 150)"
                        InputProps={{
                            startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                        }}
                    />

                    <TextField
                        fullWidth
                        label="Observações"
                        multiline
                        rows={2}
                        value={formData.observacoes}
                        onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                        margin="normal"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancelar</Button>
                    <Button onClick={handleSubmit} variant="contained" sx={{ bgcolor: '#1a1a2e' }}>
                        Salvar Agendamento
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}