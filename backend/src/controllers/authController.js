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

        const senhaValida = await bcrypt.compare(
            senha,
            psicologo.senha_hash
        );

        if (!senhaValida) {
            return res.status(401).json({ error: 'Email ou senha inválidos' });
        }

        const token = jwt.sign(
            {
                id: psicologo.id,
                email: psicologo.email,
                role: psicologo.role,
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
                role: psicologo.role,
            },
        });
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

exports.register = async (req, res) => {
    const {
        nome,
        email,
        senha,
        role,
        crp,
        especialidade,
        telefone,
    } = req.body;

    try {
        const senhaHash = await bcrypt.hash(senha, 10);

        const result = await pool.query(
            `
            INSERT INTO psicologos
            (
                email,
                senha_hash,
                nome_completo,
                role,
                crp,
                especialidade,
                telefone
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING
                id,
                email,
                nome_completo,
                role,
                crp,
                especialidade,
                telefone,
                ativo,
                criado_em
            `,
            [
                email,
                senhaHash,
                nome,
                role || 'psicologo',
                crp,
                especialidade,
                telefone,
            ]
        );

        res.status(201).json({
            message: 'Usuário criado com sucesso',
            psicologo: result.rows[0],
        });
    } catch (error) {
        console.error('Erro no registro:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

exports.alterarSenha = async (req, res) => {
    const psicologoId = req.psicologoId;

    const {
        senhaAtual,
        novaSenha,
        confirmarNovaSenha,
    } = req.body;

    if (!senhaAtual || !novaSenha || !confirmarNovaSenha) {
        return res.status(400).json({
            error: 'Preencha todos os campos de senha.',
        });
    }

    if (novaSenha !== confirmarNovaSenha) {
        return res.status(400).json({
            error: 'A nova senha e a confirmação não são iguais.',
        });
    }

    if (novaSenha.length < 8) {
        return res.status(400).json({
            error: 'A nova senha deve possuir pelo menos 8 caracteres.',
        });
    }

    const possuiMaiuscula = /[A-Z]/.test(novaSenha);
    const possuiMinuscula = /[a-z]/.test(novaSenha);
    const possuiNumero = /[0-9]/.test(novaSenha);
    const possuiEspecial = /[^A-Za-z0-9]/.test(novaSenha);

    if (
        !possuiMaiuscula ||
        !possuiMinuscula ||
        !possuiNumero ||
        !possuiEspecial
    ) {
        return res.status(400).json({
            error:
                'A nova senha deve conter letra maiúscula, letra minúscula, número e caractere especial.',
        });
    }

    if (senhaAtual === novaSenha) {
        return res.status(400).json({
            error: 'A nova senha deve ser diferente da senha atual.',
        });
    }

    try {
        const result = await pool.query(
            `
            SELECT id, senha_hash
            FROM psicologos
            WHERE id = $1
            `,
            [psicologoId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Usuário não encontrado.',
            });
        }

        const psicologo = result.rows[0];

        const senhaAtualValida = await bcrypt.compare(
            senhaAtual,
            psicologo.senha_hash
        );

        if (!senhaAtualValida) {
            return res.status(401).json({
                error: 'Senha atual incorreta.',
            });
        }

        const novoHash = await bcrypt.hash(novaSenha, 10);

        await pool.query(
            `
            UPDATE psicologos
            SET senha_hash = $1
            WHERE id = $2
            `,
            [novoHash, psicologoId]
        );

        return res.json({
            message: 'Senha alterada com sucesso.',
        });
    } catch (error) {
        console.error('Erro ao alterar senha:', error);

        return res.status(500).json({
            error: 'Erro interno do servidor.',
        });
    }
};