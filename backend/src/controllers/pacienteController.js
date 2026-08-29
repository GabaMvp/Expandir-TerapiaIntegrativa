const pool = require('../config/database');

exports.listar = async (req, res) => {
    try {
        const psicologo_id = req.psicologoId;
        const result = await pool.query(
            'SELECT * FROM pacientes WHERE psicologo_id = $1 ORDER BY nome_completo',
            [psicologo_id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao listar pacientes:', error);
        res.status(500).json({ error: 'Erro ao listar pacientes.' });
    }
};

exports.criar = async (req, res) => {
    try {
        const psicologo_id = req.psicologoId;
        const { nome_completo, data_nascimento, genero, telefone, email, endereco, ocupacao, estado_civil, convenio } = req.body;

        if (!nome_completo) {
            return res.status(400).json({ error: 'Nome é obrigatório.' });
        }

        const result = await pool.query(
            `INSERT INTO pacientes 
            (psicologo_id, nome_completo, data_nascimento, genero, telefone, email, endereco, ocupacao, estado_civil, convenio) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
            RETURNING *`,
            [psicologo_id, nome_completo, data_nascimento, genero, telefone, email, endereco, ocupacao, estado_civil, convenio]
        );

        res.status(201).json({ message: 'Paciente criado!', paciente: result.rows[0] });
    } catch (error) {
        console.error('Erro ao criar paciente:', error);
        res.status(500).json({ error: 'Erro ao criar paciente.' });
    }
};

exports.buscar = async (req, res) => {
    try {
        const { id } = req.params;
        const psicologo_id = req.psicologoId;

        const result = await pool.query(
            'SELECT * FROM pacientes WHERE id = $1 AND psicologo_id = $2',
            [id, psicologo_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Paciente não encontrado.' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao buscar paciente:', error);
        res.status(500).json({ error: 'Erro ao buscar paciente.' });
    }
};

exports.atualizar = async (req, res) => {
    try {
        const { id } = req.params;
        const psicologo_id = req.psicologoId;
        const { nome_completo, data_nascimento, genero, telefone, email, endereco, ocupacao, estado_civil, convenio } = req.body;

        const result = await pool.query(
            `UPDATE pacientes 
            SET nome_completo = $1, data_nascimento = $2, genero = $3, telefone = $4, email = $5, 
                endereco = $6, ocupacao = $7, estado_civil = $8, convenio = $9
            WHERE id = $10 AND psicologo_id = $11
            RETURNING *`,
            [nome_completo, data_nascimento, genero, telefone, email, endereco, ocupacao, estado_civil, convenio, id, psicologo_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Paciente não encontrado.' });
        }

        res.json({ message: 'Paciente atualizado!', paciente: result.rows[0] });
    } catch (error) {
        console.error('Erro ao atualizar paciente:', error);
        res.status(500).json({ error: 'Erro ao atualizar paciente.' });
    }
};

exports.deletar = async (req, res) => {
    try {
        const { id } = req.params;
        const psicologo_id = req.psicologoId;

        const paciente = await pool.query(
            'SELECT id, nome_completo FROM pacientes WHERE id = $1 AND psicologo_id = $2',
            [id, psicologo_id]
        );

        if (paciente.rows.length === 0) {
            return res.status(404).json({ error: 'Paciente não encontrado.' });
        }

        await pool.query('DELETE FROM agendamentos WHERE paciente_id = $1', [id]);
        await pool.query('DELETE FROM evolucoes WHERE paciente_id = $1', [id]);
        await pool.query('DELETE FROM prontuarios WHERE paciente_id = $1', [id]);
        await pool.query('DELETE FROM pacientes WHERE id = $1', [id]);

        res.json({ message: 'Paciente removido com sucesso!' });
    } catch (error) {
        console.error('Erro ao deletar paciente:', error);
        res.status(500).json({ error: 'Erro ao deletar paciente.' });
    }
};