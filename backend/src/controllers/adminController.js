const pool = require('../config/database');

const FUSO_HORARIO = 'America/Sao_Paulo';

exports.listarPsicologos = async (req, res) => {
    try {
        const agoraBrasil = `(CURRENT_TIMESTAMP AT TIME ZONE '${FUSO_HORARIO}')`;

        const result = await pool.query(`
            SELECT
                p.id,
                p.email,
                p.nome_completo,
                p.crp,
                p.especialidade,
                p.telefone,
                p.role,
                p.ativo,
                p.criado_em,
                COALESCE(pac.total_pacientes, 0) AS total_pacientes,
                COALESCE(ag.total_agendamentos, 0) AS total_agendamentos,
                COALESCE(ag.total_faturamento, 0) AS total_faturamento
            FROM psicologos p

            LEFT JOIN (
                SELECT
                    psicologo_id,
                    COUNT(*) AS total_pacientes
                FROM pacientes
                GROUP BY psicologo_id
            ) pac
                ON pac.psicologo_id = p.id

            LEFT JOIN (
                SELECT
                    psicologo_id,
                    COUNT(*) AS total_agendamentos,
                    COALESCE(
                        SUM(
                            CASE
                                WHEN status IS DISTINCT FROM 'cancelado'
                                AND (data + horario) <= ${agoraBrasil}
                                AND compareceu IS DISTINCT FROM false
                                THEN valor_consulta
                                ELSE 0
                            END
                        ),
                        0
                    ) AS total_faturamento
                FROM agendamentos
                GROUP BY psicologo_id
            ) ag
                ON ag.psicologo_id = p.id

            WHERE p.role != 'admin'
            ORDER BY p.nome_completo
        `);

        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao listar psicólogos:', error);
        res.status(500).json({
            error: 'Erro ao listar psicólogos.',
        });
    }
};

exports.listarPsicologosDisponiveis = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                id,
                nome_completo,
                crp,
                especialidade
            FROM psicologos
            WHERE role != 'admin'
            AND ativo = true
            ORDER BY nome_completo
        `);

        res.json(result.rows);
    } catch (error) {
        console.error(
            'Erro ao listar psicólogos disponíveis:',
            error
        );

        res.status(500).json({
            error: 'Erro ao listar psicólogos disponíveis.',
        });
    }
};

exports.atualizarPsicologo = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            nome_completo,
            email,
            crp,
            especialidade,
            telefone,
        } = req.body;

        if (!nome_completo || !email) {
            return res.status(400).json({
                error: 'Nome e email são obrigatórios.',
            });
        }

        const psicologoExiste = await pool.query(
            `
                SELECT id
                FROM psicologos
                WHERE id = $1
                AND role != 'admin'
            `,
            [id]
        );

        if (psicologoExiste.rows.length === 0) {
            return res.status(404).json({
                error: 'Psicólogo não encontrado.',
            });
        }

        const emailEmUso = await pool.query(
            `
                SELECT id
                FROM psicologos
                WHERE LOWER(email) = LOWER($1)
                AND id != $2
            `,
            [email, id]
        );

        if (emailEmUso.rows.length > 0) {
            return res.status(400).json({
                error: 'Este email já está sendo utilizado.',
            });
        }

        if (crp) {
            const crpEmUso = await pool.query(
                `
                    SELECT id
                    FROM psicologos
                    WHERE LOWER(crp) = LOWER($1)
                    AND id != $2
                `,
                [crp, id]
            );

            if (crpEmUso.rows.length > 0) {
                return res.status(400).json({
                    error: 'Este CRP já está sendo utilizado.',
                });
            }
        }

        const result = await pool.query(
            `
                UPDATE psicologos
                SET
                    nome_completo = $1,
                    email = $2,
                    crp = $3,
                    especialidade = $4,
                    telefone = $5
                WHERE id = $6
                AND role != 'admin'
                RETURNING
                    id,
                    nome_completo,
                    email,
                    crp,
                    especialidade,
                    telefone,
                    ativo
            `,
            [
                nome_completo.trim(),
                email.trim(),
                crp?.trim() || null,
                especialidade?.trim() || null,
                telefone?.trim() || null,
                id,
            ]
        );

        res.json({
            message: 'Psicólogo atualizado com sucesso!',
            psicologo: result.rows[0],
        });
    } catch (error) {
        console.error('Erro ao atualizar psicólogo:', error);

        res.status(500).json({
            error: 'Erro ao atualizar psicólogo.',
        });
    }
};

exports.bloquearPsicologo = async (req, res) => {
    try {
        const { id } = req.params;
        const { ativo } = req.body;

        if (id === req.psicologoId) {
            return res.status(400).json({
                error: 'Não é possível bloquear a si mesmo.',
            });
        }

        const result = await pool.query(
            `
                UPDATE psicologos
                SET ativo = $1
                WHERE id = $2
                AND role != $3
                RETURNING
                    id,
                    email,
                    nome_completo,
                    ativo
            `,
            [ativo, id, 'admin']
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Psicólogo não encontrado.',
            });
        }

        res.json({
            message: ativo
                ? 'Psicólogo desbloqueado!'
                : 'Psicólogo bloqueado!',
            psicologo: result.rows[0],
        });
    } catch (error) {
        console.error('Erro ao bloquear psicólogo:', error);

        res.status(500).json({
            error: 'Erro ao bloquear psicólogo.',
        });
    }
};

exports.removerPsicologo = async (req, res) => {
    try {
        const { id } = req.params;

        if (id === req.psicologoId) {
            return res.status(400).json({
                error: 'Não é possível remover a si mesmo.',
            });
        }

        const psicologo = await pool.query(
            `
                SELECT id, nome_completo
                FROM psicologos
                WHERE id = $1
                AND role != $2
            `,
            [id, 'admin']
        );

        if (psicologo.rows.length === 0) {
            return res.status(404).json({
                error: 'Psicólogo não encontrado.',
            });
        }

        await pool.query(
            'DELETE FROM agendamentos WHERE psicologo_id = $1',
            [id]
        );

        await pool.query(
            'DELETE FROM evolucoes WHERE psicologo_id = $1',
            [id]
        );

        await pool.query(
            'DELETE FROM prontuarios WHERE psicologo_id = $1',
            [id]
        );

        await pool.query(
            'DELETE FROM pacientes WHERE psicologo_id = $1',
            [id]
        );

        await pool.query(
            'DELETE FROM psicologos WHERE id = $1',
            [id]
        );

        res.json({
            message: `Psicólogo "${psicologo.rows[0].nome_completo}" removido!`,
        });
    } catch (error) {
        console.error('Erro ao remover psicólogo:', error);

        res.status(500).json({
            error: 'Erro ao remover psicólogo.',
        });
    }
};

exports.listarTodosPacientes = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                p.*,
                psi.nome_completo AS psicologo_nome,
                psi.email AS psicologo_email
            FROM pacientes p
            LEFT JOIN psicologos psi
                ON p.psicologo_id = psi.id
            ORDER BY p.nome_completo
        `);

        res.json(result.rows);
    } catch (error) {
        console.error(
            'Erro ao listar todos os pacientes:',
            error
        );

        res.status(500).json({
            error: 'Erro ao listar pacientes.',
        });
    }
};

exports.listarTodosAgendamentos = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                a.*,
                p.nome_completo AS paciente_nome,
                psi.nome_completo AS psicologo_nome
            FROM agendamentos a
            JOIN pacientes p
                ON a.paciente_id = p.id
            JOIN psicologos psi
                ON a.psicologo_id = psi.id
            WHERE psi.role != 'admin'
            ORDER BY a.data DESC, a.horario DESC
        `);

        res.json(result.rows);
    } catch (error) {
        console.error(
            'Erro ao listar todos os agendamentos:',
            error
        );

        res.status(500).json({
            error: 'Erro ao listar agendamentos.',
        });
    }
};

exports.relatorioAtendimentos = async (req, res) => {
    try {
        const {
            psicologo_id,
            data_inicio,
            data_fim,
            tipo,
        } = req.query;

        let query = `
            SELECT
                a.*,
                p.nome_completo AS paciente_nome,
                psi.nome_completo AS psicologo_nome
            FROM agendamentos a
            JOIN pacientes p
                ON a.paciente_id = p.id
            JOIN psicologos psi
                ON a.psicologo_id = psi.id
            WHERE psi.role != 'admin'
        `;

        const params = [];
        let paramCount = 1;

        if (psicologo_id) {
            query += ` AND a.psicologo_id = $${paramCount}`;
            params.push(psicologo_id);
            paramCount++;
        }

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

        if (tipo) {
            query += ` AND a.tipo_consulta = $${paramCount}`;
            params.push(tipo);
            paramCount++;
        }

        query += `
            ORDER BY a.data DESC, a.horario DESC
        `;

        const result = await pool.query(query, params);

        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao gerar relatório:', error);

        res.status(500).json({
            error: 'Erro ao gerar relatório.',
        });
    }
};

exports.pacientesPorPsicologo = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                psi.id AS psicologo_id,
                psi.nome_completo AS psicologo_nome,
                COUNT(pac.id) AS total_pacientes
            FROM psicologos psi
            LEFT JOIN pacientes pac
                ON psi.id = pac.psicologo_id
            WHERE psi.role != 'admin'
            GROUP BY
                psi.id,
                psi.nome_completo
            ORDER BY total_pacientes DESC
        `);

        res.json(result.rows);
    } catch (error) {
        console.error(
            'Erro ao listar pacientes por psicólogo:',
            error
        );

        res.status(500).json({
            error: 'Erro ao listar pacientes por psicólogo.',
        });
    }
};

exports.agendamentosCancelados = async (req, res) => {
    try {
        const { data_inicio, data_fim } = req.query;

        let query = `
            SELECT
                psi.nome_completo AS psicologo_nome,

                COUNT(
                    CASE
                        WHEN a.status = 'cancelado'
                        THEN 1
                    END
                ) AS total_cancelados,

                COUNT(*) AS total_agendamentos,

                ROUND(
                    CAST(
                        COUNT(
                            CASE
                                WHEN a.status = 'cancelado'
                                THEN 1
                            END
                        ) * 100.0
                        /
                        NULLIF(COUNT(*), 0)
                        AS NUMERIC
                    ),
                    2
                ) AS taxa_cancelamento

            FROM agendamentos a

            JOIN psicologos psi
                ON a.psicologo_id = psi.id

            WHERE psi.role != 'admin'
        `;

        const params = [];
        let paramCount = 1;

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

        query += `
            GROUP BY
                psi.id,
                psi.nome_completo

            ORDER BY taxa_cancelamento DESC
        `;

        const result = await pool.query(query, params);

        res.json(result.rows);
    } catch (error) {
        console.error(
            'Erro ao listar agendamentos cancelados:',
            error
        );

        res.status(500).json({
            error: 'Erro ao listar agendamentos cancelados.',
        });
    }
};

exports.faturamentoCompleto = async (req, res) => {
    try {
        const {
            psicologo_id,
            data_inicio,
            data_fim,
        } = req.query;

        const agoraBrasil =
            `(CURRENT_TIMESTAMP AT TIME ZONE '${FUSO_HORARIO}')`;

        let query = `
            SELECT
                psi.id AS psicologo_id,
                psi.nome_completo AS psicologo_nome,

                COUNT(
                    CASE
                        WHEN a.status IS DISTINCT FROM 'cancelado'
                        AND (a.data + a.horario) <= ${agoraBrasil}
                        AND a.compareceu IS DISTINCT FROM false
                        THEN 1
                    END
                ) AS total_consultas,

                COUNT(
                    CASE
                        WHEN a.status IS DISTINCT FROM 'cancelado'
                        AND (a.data + a.horario) <= ${agoraBrasil}
                        AND a.compareceu IS DISTINCT FROM false
                        THEN 1
                    END
                ) AS consultas_realizadas,

                COUNT(
                    CASE
                        WHEN a.status IS DISTINCT FROM 'cancelado'
                        AND (a.data + a.horario) <= ${agoraBrasil}
                        AND a.compareceu = false
                        THEN 1
                    END
                ) AS faltas,

                COALESCE(
                    SUM(
                        CASE
                            WHEN a.status IS DISTINCT FROM 'cancelado'
                            AND (a.data + a.horario) <= ${agoraBrasil}
                            AND a.compareceu IS DISTINCT FROM false
                            THEN a.valor_consulta
                            ELSE 0
                        END
                    ),
                    0
                ) AS faturamento_realizado,

                COALESCE(
                    SUM(
                        CASE
                            WHEN a.status IS DISTINCT FROM 'cancelado'
                            AND (a.data + a.horario) <= ${agoraBrasil}
                            AND a.compareceu IS DISTINCT FROM false
                            THEN a.valor_consulta
                            ELSE 0
                        END
                    ),
                    0
                ) AS total_faturamento,

                COALESCE(
                    SUM(
                        CASE
                            WHEN a.status IS DISTINCT FROM 'cancelado'
                            AND (a.data + a.horario) <= ${agoraBrasil}
                            AND a.compareceu IS DISTINCT FROM false
                            THEN a.valor_consulta * 0.4
                            ELSE 0
                        END
                    ),
                    0
                ) AS repasse_psicologo,

                COALESCE(
                    SUM(
                        CASE
                            WHEN a.status IS DISTINCT FROM 'cancelado'
                            AND (a.data + a.horario) <= ${agoraBrasil}
                            AND a.compareceu IS DISTINCT FROM false
                            THEN a.valor_consulta * 0.6
                            ELSE 0
                        END
                    ),
                    0
                ) AS comissao_clinica,

                COALESCE(
                    AVG(
                        CASE
                            WHEN a.status IS DISTINCT FROM 'cancelado'
                            AND (a.data + a.horario) <= ${agoraBrasil}
                            AND a.compareceu IS DISTINCT FROM false
                            THEN a.valor_consulta
                            ELSE NULL
                        END
                    ),
                    0
                ) AS media_por_consulta

            FROM psicologos psi

            LEFT JOIN agendamentos a
                ON psi.id = a.psicologo_id

            WHERE psi.role != 'admin'
        `;

        const params = [];
        let paramCount = 1;

        if (psicologo_id) {
            query += ` AND psi.id = $${paramCount}`;
            params.push(psicologo_id);
            paramCount++;
        }

        if (data_inicio) {
            query += ` AND (
                a.data >= $${paramCount}
                OR a.id IS NULL
            )`;
            params.push(data_inicio);
            paramCount++;
        }

        if (data_fim) {
            query += ` AND (
                a.data <= $${paramCount}
                OR a.id IS NULL
            )`;
            params.push(data_fim);
            paramCount++;
        }

        query += `
            GROUP BY
                psi.id,
                psi.nome_completo

            ORDER BY faturamento_realizado DESC
        `;

        const result = await pool.query(query, params);

        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao calcular faturamento:', error);

        res.status(500).json({
            error: 'Erro ao calcular faturamento.',
        });
    }
};

exports.resumoFaturamento = async (req, res) => {
    try {
        const { data_inicio, data_fim } = req.query;

        const agoraBrasil =
            `(CURRENT_TIMESTAMP AT TIME ZONE '${FUSO_HORARIO}')`;

        let query = `
            SELECT
                COALESCE(
                    SUM(
                        CASE
                            WHEN (a.data + a.horario) <= ${agoraBrasil}
                            AND a.compareceu IS DISTINCT FROM false
                            THEN a.valor_consulta
                            ELSE 0
                        END
                    ),
                    0
                ) AS faturamento_realizado,

                COALESCE(
                    SUM(
                        CASE
                            WHEN (a.data + a.horario) > ${agoraBrasil}
                            THEN a.valor_consulta
                            ELSE 0
                        END
                    ),
                    0
                ) AS faturamento_previsto,

                COALESCE(
                    SUM(
                        CASE
                            WHEN (a.data + a.horario) <= ${agoraBrasil}
                            AND a.compareceu IS DISTINCT FROM false
                            THEN a.valor_consulta
                            ELSE 0
                        END
                    ),
                    0
                ) AS total,

                COALESCE(
                    SUM(
                        CASE
                            WHEN (a.data + a.horario) <= ${agoraBrasil}
                            AND a.compareceu IS DISTINCT FROM false
                            THEN a.valor_consulta * 0.4
                            ELSE 0
                        END
                    ),
                    0
                ) AS repasse_psicologo,

                COALESCE(
                    SUM(
                        CASE
                            WHEN (a.data + a.horario) <= ${agoraBrasil}
                            AND a.compareceu IS DISTINCT FROM false
                            THEN a.valor_consulta * 0.6
                            ELSE 0
                        END
                    ),
                    0
                ) AS comissao_clinica,

                COUNT(
                    CASE
                        WHEN (a.data + a.horario) <= ${agoraBrasil}
                        AND a.compareceu IS DISTINCT FROM false
                        THEN 1
                    END
                ) AS consultas_realizadas,

                COUNT(
                    CASE
                        WHEN (a.data + a.horario) > ${agoraBrasil}
                        THEN 1
                    END
                ) AS consultas_previstas,

                COUNT(
                    CASE
                        WHEN (a.data + a.horario) <= ${agoraBrasil}
                        AND a.compareceu = false
                        THEN 1
                    END
                ) AS faltas,

                COALESCE(
                    AVG(
                        CASE
                            WHEN (a.data + a.horario) <= ${agoraBrasil}
                            AND a.compareceu IS DISTINCT FROM false
                            THEN a.valor_consulta
                            ELSE NULL
                        END
                    ),
                    0
                ) AS ticket_medio

            FROM agendamentos a

            JOIN psicologos psi
                ON a.psicologo_id = psi.id

            WHERE psi.role != 'admin'
            AND a.status IS DISTINCT FROM 'cancelado'
        `;

        const params = [];
        let paramCount = 1;

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

        const result = await pool.query(query, params);

        res.json(
            result.rows[0] || {
                faturamento_realizado: 0,
                faturamento_previsto: 0,
                total: 0,
                repasse_psicologo: 0,
                comissao_clinica: 0,
                consultas_realizadas: 0,
                consultas_previstas: 0,
                faltas: 0,
                ticket_medio: 0,
            }
        );
    } catch (error) {
        console.error(
            'Erro ao buscar resumo de faturamento:',
            error
        );

        res.status(500).json({
            error: 'Erro ao buscar resumo de faturamento.',
        });
    }
};

exports.estatisticas = async (req, res) => {
    try {
        const hojeBrasil =
            `(CURRENT_TIMESTAMP AT TIME ZONE '${FUSO_HORARIO}')::date`;

        const agoraBrasil =
            `(CURRENT_TIMESTAMP AT TIME ZONE '${FUSO_HORARIO}')`;

        const [
            totalPsicologos,
            totalPacientes,
            totalAgendamentos,
            financeiro,
            agendamentosHoje,
        ] = await Promise.all([
            pool.query(`
                SELECT COUNT(*)
                FROM psicologos
                WHERE role != 'admin'
            `),

            pool.query(`
                SELECT COUNT(*)
                FROM pacientes
            `),

            pool.query(`
                SELECT COUNT(*)
                FROM agendamentos a
                WHERE a.status IS DISTINCT FROM 'cancelado'
                AND a.psicologo_id IN (
                    SELECT id
                    FROM psicologos
                    WHERE role != 'admin'
                )
            `),

            pool.query(`
                SELECT
                    COALESCE(
                        SUM(
                            CASE
                                WHEN a.status IS DISTINCT FROM 'cancelado'
                                AND (a.data + a.horario) <= ${agoraBrasil}
                                AND a.compareceu IS DISTINCT FROM false
                                THEN a.valor_consulta
                                ELSE 0
                            END
                        ),
                        0
                    ) AS faturamento_realizado,

                    COALESCE(
                        SUM(
                            CASE
                                WHEN a.status IS DISTINCT FROM 'cancelado'
                                AND (a.data + a.horario) > ${agoraBrasil}
                                THEN a.valor_consulta
                                ELSE 0
                            END
                        ),
                        0
                    ) AS faturamento_previsto

                FROM agendamentos a

                WHERE a.psicologo_id IN (
                    SELECT id
                    FROM psicologos
                    WHERE role != 'admin'
                )
            `),

            pool.query(`
                SELECT COUNT(*)
                FROM agendamentos a
                WHERE a.data = ${hojeBrasil}
                AND a.status IS DISTINCT FROM 'cancelado'
                AND a.psicologo_id IN (
                    SELECT id
                    FROM psicologos
                    WHERE role != 'admin'
                )
            `),
        ]);

        const faturamentoRealizado =
            parseFloat(
                financeiro.rows[0]?.faturamento_realizado
            ) || 0;

        const faturamentoPrevisto =
            parseFloat(
                financeiro.rows[0]?.faturamento_previsto
            ) || 0;

        res.json({
            total_psicologos:
                parseInt(totalPsicologos.rows[0].count, 10) || 0,

            total_pacientes:
                parseInt(totalPacientes.rows[0].count, 10) || 0,

            total_agendamentos:
                parseInt(totalAgendamentos.rows[0].count, 10) || 0,

            agendamentos_hoje:
                parseInt(agendamentosHoje.rows[0].count, 10) || 0,

            total_faturamento: faturamentoRealizado,

            faturamento_realizado: faturamentoRealizado,

            faturamento_previsto: faturamentoPrevisto,

            faturamento_potencial:
                faturamentoRealizado + faturamentoPrevisto,
        });
    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);

        res.status(500).json({
            error: 'Erro ao buscar estatísticas.',
        });
    }
};

exports.estatisticasPresenca = async (req, res) => {
    try {
        const agoraBrasil =
            `(CURRENT_TIMESTAMP AT TIME ZONE '${FUSO_HORARIO}')`;

        const result = await pool.query(`
            SELECT
                psi.id AS psicologo_id,
                psi.nome_completo AS psicologo_nome,

                COUNT(
                    CASE
                        WHEN a.status IS DISTINCT FROM 'cancelado'
                        AND (a.data + a.horario) <= ${agoraBrasil}
                        THEN 1
                    END
                ) AS total_agendamentos,

                COUNT(
                    CASE
                        WHEN a.status IS DISTINCT FROM 'cancelado'
                        AND (a.data + a.horario) <= ${agoraBrasil}
                        AND a.compareceu IS DISTINCT FROM false
                        THEN 1
                    END
                ) AS compareceram,

                COUNT(
                    CASE
                        WHEN a.status IS DISTINCT FROM 'cancelado'
                        AND (a.data + a.horario) <= ${agoraBrasil}
                        AND a.compareceu = false
                        THEN 1
                    END
                ) AS faltaram,

                COUNT(
                    CASE
                        WHEN a.status IS DISTINCT FROM 'cancelado'
                        AND (a.data + a.horario) > ${agoraBrasil}
                        THEN 1
                    END
                ) AS pendentes,

                COALESCE(
                    ROUND(
                        (
                            COUNT(
                                CASE
                                    WHEN a.status IS DISTINCT FROM 'cancelado'
                                    AND (a.data + a.horario) <= ${agoraBrasil}
                                    AND a.compareceu IS DISTINCT FROM false
                                    THEN 1
                                END
                            ) * 100.0
                        )
                        /
                        NULLIF(
                            COUNT(
                                CASE
                                    WHEN a.status IS DISTINCT FROM 'cancelado'
                                    AND (a.data + a.horario) <= ${agoraBrasil}
                                    THEN 1
                                END
                            ),
                            0
                        ),
                        2
                    ),
                    0
                ) AS taxa_presenca

            FROM psicologos psi

            LEFT JOIN agendamentos a
                ON psi.id = a.psicologo_id

            WHERE psi.role != 'admin'

            GROUP BY
                psi.id,
                psi.nome_completo

            ORDER BY
                taxa_presenca DESC,
                psi.nome_completo
        `);

        res.json(result.rows);
    } catch (error) {
        console.error(
            'Erro ao buscar estatísticas de presença:',
            error
        );

        res.status(500).json({
            error: 'Erro ao buscar estatísticas de presença.',
        });
    }
};