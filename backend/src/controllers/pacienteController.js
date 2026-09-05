const pool = require('../config/database');

exports.listar = async (req, res) => {
    try {
        const psicologo_id = req.psicologoId;
        const role = req.psicologoRole;

        let query;
        let params = [];

        if (role === 'admin') {
            query = `
                SELECT
                    p.*,
                    psi.nome_completo AS psicologo_nome
                FROM pacientes p
                LEFT JOIN psicologos psi
                    ON p.psicologo_id = psi.id
                ORDER BY p.nome_completo
            `;
        } else {
            query = `
                SELECT
                    p.*,
                    psi.nome_completo AS psicologo_nome
                FROM pacientes p
                LEFT JOIN psicologos psi
                    ON p.psicologo_id = psi.id
                WHERE p.psicologo_id = $1
                ORDER BY p.nome_completo
            `;

            params = [psicologo_id];
        }

        const result = await pool.query(query, params);

        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao listar pacientes:', error);

        res.status(500).json({
            error: 'Erro ao listar pacientes.',
        });
    }
};

exports.criar = async (req, res) => {
    try {
        const psicologo_id = req.psicologoId;

        const {
            nome_completo,
            data_nascimento,
            genero,
            telefone,
            email,
            endereco,
            ocupacao,
            estado_civil,
            convenio,
            psicologo_id: psicologo_id_body,
        } = req.body;

        if (!nome_completo) {
            return res.status(400).json({
                error: 'Nome é obrigatório.',
            });
        }

        const psicologoFinal =
            psicologo_id_body || psicologo_id;

        if (psicologo_id_body) {
            const psicologoExiste = await pool.query(
                `
                    SELECT id
                    FROM psicologos
                    WHERE id = $1
                    AND role != 'admin'
                    AND ativo = true
                `,
                [psicologo_id_body]
            );

            if (psicologoExiste.rows.length === 0) {
                return res.status(400).json({
                    error: 'Psicólogo inválido ou inativo.',
                });
            }
        }

        const result = await pool.query(
            `
                INSERT INTO pacientes
                (
                    psicologo_id,
                    nome_completo,
                    data_nascimento,
                    genero,
                    telefone,
                    email,
                    endereco,
                    ocupacao,
                    estado_civil,
                    convenio
                )
                VALUES
                ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
                RETURNING *
            `,
            [
                psicologoFinal,
                nome_completo,
                data_nascimento || null,
                genero || null,
                telefone || null,
                email || null,
                endereco || null,
                ocupacao || null,
                estado_civil || null,
                convenio || null,
            ]
        );

        res.status(201).json({
            message: 'Paciente criado com sucesso!',
            paciente: result.rows[0],
        });
    } catch (error) {
        console.error('Erro ao criar paciente:', error);

        res.status(500).json({
            error: 'Erro ao criar paciente.',
        });
    }
};

exports.buscar = async (req, res) => {
    try {
        const { id } = req.params;
        const psicologo_id = req.psicologoId;
        const role = req.psicologoRole;

        let query;
        let params;

        if (role === 'admin') {
            query = `
                SELECT
                    p.*,
                    psi.nome_completo AS psicologo_nome
                FROM pacientes p
                LEFT JOIN psicologos psi
                    ON p.psicologo_id = psi.id
                WHERE p.id = $1
            `;

            params = [id];
        } else {
            query = `
                SELECT
                    p.*,
                    psi.nome_completo AS psicologo_nome
                FROM pacientes p
                LEFT JOIN psicologos psi
                    ON p.psicologo_id = psi.id
                WHERE p.id = $1
                AND p.psicologo_id = $2
            `;

            params = [id, psicologo_id];
        }

        const result = await pool.query(query, params);

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Paciente não encontrado.',
            });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao buscar paciente:', error);

        res.status(500).json({
            error: 'Erro ao buscar paciente.',
        });
    }
};

exports.atualizar = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            nome_completo,
            data_nascimento,
            genero,
            telefone,
            email,
            endereco,
            ocupacao,
            estado_civil,
            convenio,
            psicologo_id,
        } = req.body;

        if (!nome_completo) {
            return res.status(400).json({
                error: 'Nome é obrigatório.',
            });
        }

        if (psicologo_id) {
            const psicologoExiste = await pool.query(
                `
                    SELECT id
                    FROM psicologos
                    WHERE id = $1
                    AND role != 'admin'
                    AND ativo = true
                `,
                [psicologo_id]
            );

            if (psicologoExiste.rows.length === 0) {
                return res.status(400).json({
                    error: 'Psicólogo inválido ou inativo.',
                });
            }
        }

        const result = await pool.query(
            `
                UPDATE pacientes
                SET
                    nome_completo = $1,
                    data_nascimento = $2,
                    genero = $3,
                    telefone = $4,
                    email = $5,
                    endereco = $6,
                    ocupacao = $7,
                    estado_civil = $8,
                    convenio = $9,
                    psicologo_id = COALESCE($10, psicologo_id)
                WHERE id = $11
                RETURNING *
            `,
            [
                nome_completo,
                data_nascimento || null,
                genero || null,
                telefone || null,
                email || null,
                endereco || null,
                ocupacao || null,
                estado_civil || null,
                convenio || null,
                psicologo_id || null,
                id,
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Paciente não encontrado.',
            });
        }

        res.json({
            message: 'Paciente atualizado com sucesso!',
            paciente: result.rows[0],
        });
    } catch (error) {
        console.error('Erro ao atualizar paciente:', error);

        res.status(500).json({
            error: 'Erro ao atualizar paciente.',
        });
    }
};

exports.deletar = async (req, res) => {
    const client = await pool.connect();

    try {
        const { id } = req.params;

        await client.query('BEGIN');

        const paciente = await client.query(
            `
                SELECT id, nome_completo
                FROM pacientes
                WHERE id = $1
            `,
            [id]
        );

        if (paciente.rows.length === 0) {
            await client.query('ROLLBACK');

            return res.status(404).json({
                error: 'Paciente não encontrado.',
            });
        }

        await client.query(
            'DELETE FROM agendamentos WHERE paciente_id = $1',
            [id]
        );

        await client.query(
            'DELETE FROM evolucoes WHERE paciente_id = $1',
            [id]
        );

        await client.query(
            'DELETE FROM prontuarios WHERE paciente_id = $1',
            [id]
        );

        await client.query(
            'DELETE FROM pacientes WHERE id = $1',
            [id]
        );

        await client.query('COMMIT');

        res.json({
            message: 'Paciente removido com sucesso!',
        });
    } catch (error) {
        await client.query('ROLLBACK');

        console.error('Erro ao deletar paciente:', error);

        res.status(500).json({
            error: 'Erro ao deletar paciente.',
        });
    } finally {
        client.release();
    }
};