const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'segredo';

exports.login = async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    try {
        const result = await pool.query(
            'SELECT * FROM psicologos WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Email ou senha inválidos' });
        }

        const psicologo = result.rows[0];

        // ✅ CORRIGIDO: compara com senha_hash
        const senhaValida = await bcrypt.compare(senha, psicologo.senha_hash);

        if (!senhaValida) {
            return res.status(401).json({ error: 'Email ou senha inválidos' });
        }

        const token = jwt.sign(
            { 
                id: psicologo.id, 
                email: psicologo.email, 
                role: psicologo.role 
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            psicologo: {
                id: psicologo.id,
                nome: psicologo.nome_completo,
                email: psicologo.email,
                role: psicologo.role
            }
        });
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

exports.register = async (req, res) => {
    const { nome, email, senha, role, crp, especialidade, telefone } = req.body;

    try {
        const senhaHash = await bcrypt.hash(senha, 10);
        
        const result = await pool.query(
            `INSERT INTO psicologos 
            (email, senha_hash, nome_completo, role, crp, especialidade, telefone) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) 
            RETURNING *`,
            [email, senhaHash, nome, role || 'psicologo', crp, especialidade, telefone]
        );

        res.status(201).json({ 
            message: 'Usuário criado com sucesso',
            psicologo: result.rows[0]
        });
    } catch (error) {
        console.error('Erro no registro:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};