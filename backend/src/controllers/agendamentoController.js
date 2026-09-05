const pool = require('../config/database');

exports.listar = async (req, res) => {
    try {
        const psicologo_id = req.psicologoId;
        const role = req.psicologoRole;
        const { data_inicio, data_fim } = req.query;

        let query = `
            SELECT 
                a.id,
                a.psicologo_id,
                a.paciente_id,
                a.data,
                a.horario,
                a.duracao,
                a.tipo_consulta,
                a.status,
                a.compareceu,
                a.observacoes,
                p.nome_completo AS paciente_nome,
                psi.nome_completo AS psicologo_nome
        `;

        if (role === 'admin') {
            query += `, a.valor_consulta`;
        }

        query += `
            FROM agendamentos a
            JOIN pacientes p ON a.paciente_id = p.id
            JOIN psicologos psi ON a.psicologo_id = psi.id
            WHERE 1=1
        `;

        const params = [];

        if (role !== 'admin') {
            query += ` AND a.psicologo_id = $1`;
            params.push(psicologo_id);
        }

        let paramCount = params.length + 1;

        if (data_inicio) {
            query += ` AND a.data >= $${paramCount}`;
            params.push(data_inicio);
            paramCount++;
        }

        if (data_fim) {
            query += ` AND a.data <= $${paramCount}`;
            params.push(data_fim);
            paramCount++;
        }

        query += ` ORDER BY a.data ASC, a.horario ASC`;

        const result = await pool.query(query, params);

        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao listar agendamentos:', error);

        res.status(500).json({
            error: 'Erro ao listar agendamentos.',
        });
    }
};

exports.criar = async (req, res) => {
    try {
        const role = req.psicologoRole;

        const {
            paciente_id,
            psicologo_id_agendamento,
            data,
            horario,
            duracao,
            tipo_consulta,
            valor_consulta,
            observacoes,
        } = req.body;

        if (role !== 'admin') {
            return res.status(403).json({
                error: 'Apenas administradores podem criar agendamentos.',
            });
        }

        if (
            !paciente_id ||
            !psicologo_id_agendamento ||
            !data ||
            !horario
        ) {
            return res.status(400).json({
                error: 'Paciente, psicólogo, data e horário são obrigatórios.',
            });
        }

        const checkPsicologo = await pool.query(
            `
                SELECT id, nome_completo
                FROM psicologos
                WHERE id = $1
                AND role != $2
                AND ativo = true
            `,
            [
                psicologo_id_agendamento,
                'admin',
            ]
        );

        if (checkPsicologo.rows.length === 0) {
            return res.status(400).json({
                error: 'Psicólogo inválido ou inativo.',
            });
        }

        const checkPaciente = await pool.query(
            `
                SELECT id
                FROM pacientes
                WHERE id = $1
            `,
            [paciente_id]
        );

        if (checkPaciente.rows.length === 0) {
            return res.status(400).json({
                error: 'Paciente inválido.',
            });
        }

        const conflito = await pool.query(
            `
                SELECT id
                FROM agendamentos
                WHERE psicologo_id = $1
                AND data = $2
                AND horario = $3
                AND status != 'cancelado'
            `,
            [
                psicologo_id_agendamento,
                data,
                horario,
            ]
        );

        if (conflito.rows.length > 0) {
            return res.status(409).json({
                error: 'Já existe agendamento neste horário para este psicólogo.',
            });
        }

        const valor = parseFloat(valor_consulta) || 0;

        const result = await pool.query(
            `
                INSERT INTO agendamentos
                (
                    psicologo_id,
                    paciente_id,
                    data,
                    horario,
                    duracao,
                    tipo_consulta,
                    valor_consulta,
                    observacoes,
                    status
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6,
                    $7,
                    $8,
                    'confirmado'
                )
                RETURNING *
            `,
            [
                psicologo_id_agendamento,
                paciente_id,
                data,
                horario,
                duracao || 50,
                tipo_consulta || 'presencial',
                valor,
                observacoes,
            ]
        );

        await pool.query(
            `
                UPDATE pacientes
                SET psicologo_id = $1
                WHERE id = $2
            `,
            [
                psicologo_id_agendamento,
                paciente_id,
            ]
        );

        res.status(201).json({
            message: 'Agendamento criado com sucesso!',
            agendamento: result.rows[0],
        });
    } catch (error) {
        console.error('Erro ao criar agendamento:', error);

        res.status(500).json({
            error: 'Erro ao criar agendamento.',
        });
    }
};

exports.atualizar = async (req, res) => {
    try {
        const { id } = req.params;
        const role = req.psicologoRole;

        if (role !== 'admin') {
            return res.status(403).json({
                error: 'Apenas administradores podem editar agendamentos.',
            });
        }

        const {
            paciente_id,
            psicologo_id_agendamento,
            data,
            horario,
            duracao,
            tipo_consulta,
            valor_consulta,
            observacoes,
        } = req.body;

        if (
            !paciente_id ||
            !psicologo_id_agendamento ||
            !data ||
            !horario
        ) {
            return res.status(400).json({
                error: 'Paciente, psicólogo, data e horário são obrigatórios.',
            });
        }

        const checkPsicologo = await pool.query(
            `
                SELECT id
                FROM psicologos
                WHERE id = $1
                AND role != 'admin'
                AND ativo = true
            `,
            [psicologo_id_agendamento]
        );

        if (checkPsicologo.rows.length === 0) {
            return res.status(400).json({
                error: 'Psicólogo inválido ou inativo.',
            });
        }

        const checkPaciente = await pool.query(
            `
                SELECT id
                FROM pacientes
                WHERE id = $1
            `,
            [paciente_id]
        );

        if (checkPaciente.rows.length === 0) {
            return res.status(400).json({
                error: 'Paciente inválido.',
            });
        }

        const conflito = await pool.query(
            `
                SELECT id
                FROM agendamentos
                WHERE psicologo_id = $1
                AND data = $2
                AND horario = $3
                AND id != $4
                AND status != 'cancelado'
            `,
            [
                psicologo_id_agendamento,
                data,
                horario,
                id,
            ]
        );

        if (conflito.rows.length > 0) {
            return res.status(409).json({
                error: 'Já existe agendamento neste horário para este psicólogo.',
            });
        }

        const valor = parseFloat(valor_consulta) || 0;

        const result = await pool.query(
            `
                UPDATE agendamentos
                SET
                    paciente_id = $1,
                    psicologo_id = $2,
                    data = $3,
                    horario = $4,
                    duracao = $5,
                    tipo_consulta = $6,
                    valor_consulta = $7,
                    observacoes = $8
                WHERE id = $9
                RETURNING *
            `,
            [
                paciente_id,
                psicologo_id_agendamento,
                data,
                horario,
                duracao || 50,
                tipo_consulta || 'presencial',
                valor,
                observacoes,
                id,
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Agendamento não encontrado.',
            });
        }

        await pool.query(
            `
                UPDATE pacientes
                SET psicologo_id = $1
                WHERE id = $2
            `,
            [
                psicologo_id_agendamento,
                paciente_id,
            ]
        );

        res.json({
            message: 'Agendamento atualizado com sucesso!',
            agendamento: result.rows[0],
        });
    } catch (error) {
        console.error('Erro ao atualizar agendamento:', error);

        res.status(500).json({
            error: 'Erro ao atualizar agendamento.',
        });
    }
};

exports.cancelar = async (req, res) => {
    try {
        const { id } = req.params;
        const role = req.psicologoRole;

        if (role !== 'admin') {
            return res.status(403).json({
                error: 'Apenas administradores podem cancelar agendamentos.',
            });
        }

        const result = await pool.query(
            `
                UPDATE agendamentos
                SET status = 'cancelado'
                WHERE id = $1
                RETURNING *
            `,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Agendamento não encontrado.',
            });
        }

        res.json({
            message: 'Agendamento cancelado!',
            agendamento: result.rows[0],
        });
    } catch (error) {
        console.error('Erro ao cancelar agendamento:', error);

        res.status(500).json({
            error: 'Erro ao cancelar agendamento.',
        });
    }
};

exports.atualizarStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const role = req.psicologoRole;
        const { status } = req.body;

        if (role !== 'admin') {
            return res.status(403).json({
                error: 'Apenas administradores podem alterar status.',
            });
        }

        if (!['confirmado', 'cancelado'].includes(status)) {
            return res.status(400).json({
                error: 'Status inválido.',
            });
        }

        const agendamentoAtual = await pool.query(
            `
                SELECT
                    id,
                    psicologo_id,
                    data,
                    horario,
                    status
                FROM agendamentos
                WHERE id = $1
            `,
            [id]
        );

        if (agendamentoAtual.rows.length === 0) {
            return res.status(404).json({
                error: 'Agendamento não encontrado.',
            });
        }

        const agendamento = agendamentoAtual.rows[0];

        if (status === 'confirmado') {
            const conflito = await pool.query(
                `
                    SELECT id
                    FROM agendamentos
                    WHERE psicologo_id = $1
                    AND data = $2
                    AND horario = $3
                    AND id != $4
                    AND status != 'cancelado'
                `,
                [
                    agendamento.psicologo_id,
                    agendamento.data,
                    agendamento.horario,
                    id,
                ]
            );

            if (conflito.rows.length > 0) {
                return res.status(409).json({
                    error: 'Não é possível confirmar este atendimento porque o horário já está ocupado.',
                });
            }
        }

        const result = await pool.query(
            `
                UPDATE agendamentos
                SET status = $1
                WHERE id = $2
                RETURNING *
            `,
            [status, id]
        );

        res.json({
            message:
                status === 'confirmado'
                    ? 'Atendimento confirmado com sucesso!'
                    : 'Atendimento cancelado com sucesso!',
            agendamento: result.rows[0],
        });
    } catch (error) {
        console.error('Erro ao atualizar status:', error);

        res.status(500).json({
            error: 'Erro ao atualizar status.',
        });
    }
};

exports.marcarComparecimento = async (req, res) => {
    try {
        const { id } = req.params;
        const psicologo_id = req.psicologoId;
        const role = req.psicologoRole;
        const { compareceu } = req.body;

        if (typeof compareceu !== 'boolean') {
            return res.status(400).json({
                error: 'O campo compareceu deve ser verdadeiro ou falso.',
            });
        }

        let query = `
            UPDATE agendamentos
            SET compareceu = $1
            WHERE id = $2
        `;

        const params = [
            compareceu,
            id,
        ];

        if (role !== 'admin') {
            query += ` AND psicologo_id = $3`;
            params.push(psicologo_id);
        }

        query += ` RETURNING *`;

        const result = await pool.query(
            query,
            params
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Agendamento não encontrado.',
            });
        }

        res.json({
            message: compareceu
                ? 'Comparecimento registrado!'
                : 'Falta registrada!',
            agendamento: result.rows[0],
        });
    } catch (error) {
        console.error(
            'Erro ao marcar comparecimento:',
            error
        );

        res.status(500).json({
            error: 'Erro ao marcar comparecimento.',
        });
    }
};