const { Pool } = require('pg');
require('dotenv').config();

console.log('📡 Configurando conexão com o banco...');
console.log('🔗 DATABASE_URL:', process.env.DATABASE_URL ? '✅ Definida' : '❌ NÃO DEFINIDA');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Erro ao conectar ao banco:', err.message);
        return;
    }
    console.log('✅ Conectado ao Supabase com sucesso!');
    release();
});

module.exports = pool;