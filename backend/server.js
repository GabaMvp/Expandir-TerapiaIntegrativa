require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();


app.use(cors({
    origin: ['https://expandir-terapia-integrativa.vercel.app', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

const authRoutes = require('./src/routes/authRoutes');
const pacienteRoutes = require('./src/routes/pacienteRoutes');
const agendamentoRoutes = require('./src/routes/agendamentoRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const prontuarioRoutes = require('./src/routes/prontuarioRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/pacientes', pacienteRoutes);
app.use('/api/agendamentos', agendamentoRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/prontuarios', prontuarioRoutes);

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

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`🚀 Servidor na porta ${PORT}`);
    console.log(`📡 Rotas disponíveis:`);
    console.log(`   - GET  /`);
    console.log(`   - POST /api/auth/login`);
    console.log(`   - POST /api/auth/register`);
    console.log(`   - GET  /api/pacientes`);
    console.log(`   - GET  /api/agendamentos`);
    console.log(`   - GET  /health`);
});