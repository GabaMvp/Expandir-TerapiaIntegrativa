require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

// Middlewares
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Importar rotas
const authRoutes = require('./src/routes/authRoutes');
const pacienteRoutes = require('./src/routes/pacienteRoutes');
const agendamentoRoutes = require('./src/routes/agendamentoRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const prontuarioRoutes = require('./src/routes/prontuarioRoutes');

// Usar rotas com /api
app.use('/api/auth', authRoutes);
app.use('/api/pacientes', pacienteRoutes);
app.use('/api/agendamentos', agendamentoRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/prontuarios', prontuarioRoutes);

// Rota raiz
app.get('/', (req, res) => {
    res.json({
        message: 'API Expandir Terapias Integrativa',
        status: 'online',
        endpoints: {
            auth: '/api/auth/login',
            pacientes: '/api/pacientes',
            agendamentos: '/api/agendamentos',
            admin: '/api/admin'
        }
    });
});

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});


app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`🚀 Servidor na porta ${PORT}`);
    console.log(`📡 POST /api/auth/login`);
    console.log(`📡 POST /api/auth/register`);
    console.log(`📡 GET /api/pacientes`);
    console.log(`📡 GET /api/agendamentos`);
});