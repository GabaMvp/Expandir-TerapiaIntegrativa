const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    try {
        const { email, senha, nome_completo, crp, especialidade, telefone } = req.body;

        if (!email || !senha || !nome_completo || !crp) {
            return res.status(400).json({ error: 'Email, senha, nome e CRP são obrigatórios.' });
        }

        const emailCheck = await pool.query('SELECT id FROM psicologos WHERE email = $1', [email]);
        if (emailCheck.rows.length > 0) {
            return res.status(400).json({ error: 'Email já cadastrado.' });
        }

        const crpCheck = await pool.query('SELECT id FROM psicologos WHERE crp = $1', [crp]);
        if (crpCheck.rows.length > 0) {
            return res.status(400).json({ error: 'CRP já cadastrado.' });
        }

        const senhaHash = await bcrypt.hash(senha, 10);

        const result = await pool.query(
            `INSERT INTO psicologos 
            (email, senha_hash, nome_completo, crp, especialidade, telefone, role) 
            VALUES ($1, $2, $3, $4, $5, $6, 'psicologo') 
            RETURNING id, email, nome_completo, crp, especialidade, role`,
            [email, senhaHash, nome_completo, crp, especialidade, telefone]
        );

        res.status(201).json({ 
            message: 'Psicólogo cadastrado com sucesso!', 
            psicologo: result.rows[0] 
        });
    } catch (error) {
        console.error('Erro no cadastro:', error);
        res.status(500).json({ error: 'Erro ao cadastrar psicólogo.' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
        }

        const result = await pool.query('SELECT * FROM psicologos WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Email ou senha inválidos.' });
        }

        const psicologo = result.rows[0];
        const senhaValida = await bcrypt.compare(senha, psicologo.senha_hash);

        if (!senhaValida) {
            return res.status(401).json({ error: 'Email ou senha inválidos.' });
        }

        const token = jwt.sign(
            { 
                id: psicologo.id, 
                email: psicologo.email,
                nome: psicologo.nome_completo,
                role: psicologo.role || 'psicologo'
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );

        res.json({
            message: 'Login realizado!',
            token,
            psicologo: {
                id: psicologo.id,
                email: psicologo.email,
                nome_completo: psicologo.nome_completo,
                crp: psicologo.crp,
                role: psicologo.role || 'psicologo'
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao fazer login.' });
    }
};