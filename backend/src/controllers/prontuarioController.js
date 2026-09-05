const pool = require('../config/database');


exports.buscar = async (req, res) => {
    try {
        const { paciente_id } = req.params;
        const psicologo_id = req.psicologoId;

        const result = await pool.query(
            'SELECT * FROM prontuarios WHERE paciente_id = $1 AND psicologo_id = $2',
            [paciente_id, psicologo_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Prontuário não encontrado.' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao buscar prontuário:', error);
        res.status(500).json({ error: 'Erro ao buscar prontuário.' });
    }
};


exports.salvar = async (req, res) => {
    try {
        const { paciente_id } = req.params;
        const psicologo_id = req.psicologoId;

        /*
         * O PostgreSQL não aceita string vazia ("") em colunas do tipo DATE.
         * Quando data_encerramento não estiver preenchida, salvamos NULL.
         */
        const dados = {
            ...req.body,
            data_encerramento:
                req.body.data_encerramento &&
                String(req.body.data_encerramento).trim() !== ''
                    ? req.body.data_encerramento
                    : null
        };

        const existe = await pool.query(
            'SELECT id FROM prontuarios WHERE paciente_id = $1 AND psicologo_id = $2',
            [paciente_id, psicologo_id]
        );

        if (existe.rows.length > 0) {
            const campos = Object.keys(dados);

            if (campos.length === 0) {
                return res.status(400).json({
                    error: 'Nenhum dado informado para atualização.'
                });
            }

            const fields = campos
                .map((key, i) => `${key} = $${i + 1}`)
                .join(', ');

            const values = [
                ...Object.values(dados),
                paciente_id,
                psicologo_id
            ];

            const query = `
                UPDATE prontuarios
                SET ${fields}
                WHERE paciente_id = $${values.length - 1}
                  AND psicologo_id = $${values.length}
                RETURNING *
            `;

            const result = await pool.query(query, values);

            return res.json({
                message: 'Prontuário atualizado!',
                prontuario: result.rows[0]
            });
        }

        const campos = Object.keys(dados);
        const placeholders = campos
            .map((_, i) => `$${i + 1}`)
            .join(', ');

        const values = [
            ...Object.values(dados),
            paciente_id,
            psicologo_id
        ];

        const query = `
            INSERT INTO prontuarios (
                ${campos.join(', ')},
                paciente_id,
                psicologo_id
            )
            VALUES (
                ${placeholders},
                $${values.length - 1},
                $${values.length}
            )
            RETURNING *
        `;

        const result = await pool.query(query, values);

        return res.status(201).json({
            message: 'Prontuário criado!',
            prontuario: result.rows[0]
        });
    } catch (error) {
        console.error('Erro ao salvar prontuário:', error);
        res.status(500).json({
            error: 'Erro ao salvar prontuário.'
        });
    }
};


exports.adicionarEvolucao = async (req, res) => {
    try {
        const { paciente_id } = req.params;
        const psicologo_id = req.psicologoId;

        const {
            data,
            conteudo,
            procedimentos,
            progresso,
            sigiloso
        } = req.body;

        const pacienteCheck = await pool.query(
            'SELECT id FROM pacientes WHERE id = $1',
            [paciente_id]
        );

        if (pacienteCheck.rows.length === 0) {
            return res.status(404).json({
                error: 'Paciente não encontrado.'
            });
        }

        /*
         * Se nenhuma data for informada, usamos a data atual.
         * Os demais campos da evolução são opcionais.
         */
        const dataFormatada =
            data && String(data).trim() !== ''
                ? data
                : new Date().toISOString().split('T')[0];

        const result = await pool.query(
            `
                INSERT INTO evolucoes (
                    paciente_id,
                    psicologo_id,
                    data,
                    conteudo,
                    procedimentos,
                    progresso,
                    sigiloso
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
            `,
            [
                paciente_id,
                psicologo_id,
                dataFormatada,
                conteudo || '',
                procedimentos || '',
                progresso || '',
                sigiloso !== undefined ? sigiloso : true
            ]
        );

        return res.status(201).json({
            message: 'Evolução adicionada com sucesso!',
            evolucao: result.rows[0]
        });
    } catch (error) {
        console.error('Erro ao adicionar evolução:', error);
        res.status(500).json({
            error: 'Erro ao adicionar evolução: ' + error.message
        });
    }
};


exports.listarEvolucoes = async (req, res) => {
    try {
        const { paciente_id } = req.params;
        const psicologo_id = req.psicologoId;

        const result = await pool.query(
            `
                SELECT *
                FROM evolucoes
                WHERE paciente_id = $1
                  AND psicologo_id = $2
                ORDER BY data DESC, criado_em DESC
            `,
            [paciente_id, psicologo_id]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao listar evoluções:', error);
        res.status(500).json({
            error: 'Erro ao listar evoluções.'
        });
    }
};