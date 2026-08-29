require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const authRoutes = require('./src/routes/authRoutes');
const pacienteRoutes = require('./src/routes/pacienteRoutes');
const agendamentoRoutes = require('./src/routes/agendamentoRoutes');
const prontuarioRoutes = require('./src/routes/prontuarioRoutes');
const adminRoutes = require('./src/routes/adminRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/pacientes', pacienteRoutes);
app.use('/api/agendamentos', agendamentoRoutes);
app.use('/api/prontuarios', prontuarioRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Servidor rodando!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor na porta ${PORT}`);
});