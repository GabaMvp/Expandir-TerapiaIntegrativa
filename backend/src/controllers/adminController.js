const pool = require('../config/database');

exports.listarPsicologos = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                p.id, p.email, p.nome_completo, p.crp, p.especialidade, p.telefone, 
                p.role, p.ativo, p.criado_em,
                COUNT(DISTINCT pac.id) as total_pacientes,
                COUNT(DISTINCT ag.id) as total_agendamentos,
                COALESCE(SUM(CASE WHEN ag.status != 'cancelado' THEN ag.valor_consulta ELSE 0 END), 0) as total_faturamento
            FROM psicologos p
            LEFT JOIN pacientes pac ON p.id = pac.psicologo_id
            LEFT JOIN agendamentos ag ON p.id = ag.psicologo_id
            WHERE p.role != 'admin'
            GROUP BY p.id
            ORDER BY p.nome_completo
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao listar psicólogos:', error);
        res.status(500).json({ error: 'Erro ao listar psicólogos.' });
    }
};

exports.listarPsicologosDisponiveis = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, nome_completo, crp, especialidade FROM psicologos 
             WHERE role != 'admin' AND ativo = true 
             ORDER BY nome_completo`
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao listar psicólogos disponíveis:', error);
        res.status(500).json({ error: 'Erro ao listar psicólogos disponíveis.' });
    }
};

exports.bloquearPsicologo = async (req, res) => {
    try {
        const { id } = req.params;
        const { ativo } = req.body;

        if (id === req.psicologoId) {
            return res.status(400).json({ error: 'Não é possível bloquear a si mesmo.' });
        }

        const result = await pool.query(
            'UPDATE psicologos SET ativo = $1 WHERE id = $2 AND role != $3 RETURNING id, email, nome_completo, ativo',
            [ativo, id, 'admin']
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Psicólogo não encontrado.' });
        }

        res.json({
            message: ativo ? 'Psicólogo desbloqueado!' : 'Psicólogo bloqueado!',
            psicologo: result.rows[0]
        });
    } catch (error) {
        console.error('Erro ao bloquear psicólogo:', error);
        res.status(500).json({ error: 'Erro ao bloquear psicólogo.' });
    }
};

exports.removerPsicologo = async (req, res) => {
    try {
        const { id } = req.params;

        if (id === req.psicologoId) {
            return res.status(400).json({ error: 'Não é possível remover a si mesmo.' });
        }

        const psicologo = await pool.query(
            'SELECT id, nome_completo FROM psicologos WHERE id = $1 AND role != $2',
            [id, 'admin']
        );

        if (psicologo.rows.length === 0) {
            return res.status(404).json({ error: 'Psicólogo não encontrado.' });
        }

        await pool.query('DELETE FROM agendamentos WHERE psicologo_id = $1', [id]);
        await pool.query('DELETE FROM evolucoes WHERE psicologo_id = $1', [id]);
        await pool.query('DELETE FROM prontuarios WHERE psicologo_id = $1', [id]);
        await pool.query('DELETE FROM pacientes WHERE psicologo_id = $1', [id]);
        await pool.query('DELETE FROM psicologos WHERE id = $1', [id]);

        res.json({
            message: `Psicólogo "${psicologo.rows[0].nome_completo}" removido!`
        });
    } catch (error) {
        console.error('Erro ao remover psicólogo:', error);
        res.status(500).json({ error: 'Erro ao remover psicólogo.' });
    }
};

exports.listarTodosPacientes = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                p.*, 
                psi.nome_completo as psicologo_nome, 
                psi.email as psicologo_email
            FROM pacientes p
            LEFT JOIN psicologos psi ON p.psicologo_id = psi.id
            ORDER BY p.nome_completo
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao listar todos os pacientes:', error);
        res.status(500).json({ error: 'Erro ao listar pacientes.' });
    }
};

exports.listarTodosAgendamentos = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                a.*, 
                p.nome_completo as paciente_nome,
                psi.nome_completo as psicologo_nome
            FROM agendamentos a
            JOIN pacientes p ON a.paciente_id = p.id
            JOIN psicologos psi ON a.psicologo_id = psi.id
            WHERE psi.role != 'admin'
            ORDER BY a.data DESC, a.horario DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao listar todos os agendamentos:', error);
        res.status(500).json({ error: 'Erro ao listar agendamentos.' });
    }
};

exports.relatorioAtendimentos = async (req, res) => {
    try {
        const { psicologo_id, data_inicio, data_fim, tipo } = req.query;

        let query = `
            SELECT a.*, p.nome_completo as paciente_nome, psi.nome_completo as psicologo_nome
            FROM agendamentos a
            JOIN pacientes p ON a.paciente_id = p.id
            JOIN psicologos psi ON a.psicologo_id = psi.id
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

        query += ` ORDER BY a.data DESC, a.horario DESC`;
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao gerar relatório:', error);
        res.status(500).json({ error: 'Erro ao gerar relatório.' });
    }
};

exports.pacientesPorPsicologo = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT psi.id as psicologo_id, psi.nome_completo as psicologo_nome,
                   COUNT(pac.id) as total_pacientes
            FROM psicologos psi
            LEFT JOIN pacientes pac ON psi.id = pac.psicologo_id
            WHERE psi.role != 'admin'
            GROUP BY psi.id, psi.nome_completo
            ORDER BY total_pacientes DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao listar pacientes por psicólogo:', error);
        res.status(500).json({ error: 'Erro ao listar pacientes por psicólogo.' });
    }
};

exports.agendamentosCancelados = async (req, res) => {
    try {
        const { data_inicio, data_fim } = req.query;

        let query = `
            SELECT psi.nome_completo as psicologo_nome,
                   COUNT(CASE WHEN a.status = 'cancelado' THEN 1 END) as total_cancelados,
                   COUNT(*) as total_agendamentos,
                   ROUND(CAST(COUNT(CASE WHEN a.status = 'cancelado' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0) AS NUMERIC), 2) as taxa_cancelamento
            FROM agendamentos a
            JOIN psicologos psi ON a.psicologo_id = psi.id
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

        query += ` GROUP BY psi.id, psi.nome_completo ORDER BY taxa_cancelamento DESC`;
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao listar agendamentos cancelados:', error);
        res.status(500).json({ error: 'Erro ao listar agendamentos cancelados.' });
    }
};

exports.faturamentoCompleto = async (req, res) => {
    try {
        const { psicologo_id, data_inicio, data_fim } = req.query;

        let query = `
            SELECT 
                psi.id as psicologo_id,
                psi.nome_completo as psicologo_nome,
                COUNT(CASE WHEN a.status != 'cancelado' THEN 1 END) as total_consultas,
                COALESCE(SUM(CASE WHEN a.status != 'cancelado' THEN a.valor_consulta ELSE 0 END), 0) as total_faturamento,
                COALESCE(SUM(CASE WHEN a.status != 'cancelado' THEN a.valor_consulta * 0.4 ELSE 0 END), 0) as repasse_psicologo,
                COALESCE(SUM(CASE WHEN a.status != 'cancelado' THEN a.valor_consulta * 0.6 ELSE 0 END), 0) as comissao_clinica,
                COALESCE(AVG(CASE WHEN a.status != 'cancelado' THEN a.valor_consulta ELSE NULL END), 0) as media_por_consulta
            FROM psicologos psi
            LEFT JOIN agendamentos a ON psi.id = a.psicologo_id
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
            query += ` AND a.data >= $${paramCount}`;
            params.push(data_inicio);
            paramCount++;
        }

        if (data_fim) {
            query += ` AND a.data <= $${paramCount}`;
            params.push(data_fim);
            paramCount++;
        }

        query += ` GROUP BY psi.id, psi.nome_completo ORDER BY total_faturamento DESC`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao calcular faturamento:', error);
        res.status(500).json({ error: 'Erro ao calcular faturamento.' });
    }
};

exports.resumoFaturamento = async (req, res) => {
    try {
        const { data_inicio, data_fim } = req.query;

        let query = `
            SELECT 
                COALESCE(SUM(a.valor_consulta), 0) as total,
                COALESCE(SUM(a.valor_consulta) * 0.4, 0) as repasse_psicologo,
                COALESCE(SUM(a.valor_consulta) * 0.6, 0) as comissao_clinica
            FROM agendamentos a
            JOIN psicologos psi ON a.psicologo_id = psi.id
            WHERE psi.role != 'admin' AND a.status != 'cancelado'
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
        res.json(result.rows[0] || { total: 0, repasse_psicologo: 0, comissao_clinica: 0 });
    } catch (error) {
        console.error('Erro ao buscar resumo de faturamento:', error);
        res.status(500).json({ error: 'Erro ao buscar resumo de faturamento.' });
    }
};

exports.estatisticas = async (req, res) => {
    try {
        const [totalPsicologos, totalPacientes, totalAgendamentos, totalFaturamento] = await Promise.all([
            pool.query("SELECT COUNT(*) FROM psicologos WHERE role != 'admin'"),
            pool.query('SELECT COUNT(*) FROM pacientes'),
            pool.query("SELECT COUNT(*) FROM agendamentos WHERE psicologo_id IN (SELECT id FROM psicologos WHERE role != 'admin')"),
            pool.query("SELECT COALESCE(SUM(valor_consulta), 0) FROM agendamentos WHERE status != 'cancelado' AND psicologo_id IN (SELECT id FROM psicologos WHERE role != 'admin')"),
        ]);

        const hoje = new Date().toISOString().split('T')[0];
        const agendamentosHoje = await pool.query(
            "SELECT COUNT(*) FROM agendamentos WHERE data = $1 AND psicologo_id IN (SELECT id FROM psicologos WHERE role != 'admin')",
            [hoje]
        );

        res.json({
            total_psicologos: parseInt(totalPsicologos.rows[0].count),
            total_pacientes: parseInt(totalPacientes.rows[0].count),
            total_agendamentos: parseInt(totalAgendamentos.rows[0].count),
            agendamentos_hoje: parseInt(agendamentosHoje.rows[0].count),
            total_faturamento: parseFloat(totalFaturamento.rows[0].sum) || 0,
        });
    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({ error: 'Erro ao buscar estatísticas.' });
    }
};

exports.estatisticasPresenca = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                psi.id as psicologo_id,
                psi.nome_completo as psicologo_nome,
                COUNT(a.id) as total_agendamentos,
                COUNT(CASE WHEN a.compareceu = true THEN 1 END) as compareceram,
                COUNT(CASE WHEN a.compareceu = false THEN 1 END) as faltaram,
                COUNT(CASE WHEN a.compareceu IS NULL THEN 1 END) as pendentes,
                ROUND(CAST(COUNT(CASE WHEN a.compareceu = true THEN 1 END) * 100.0 / NULLIF(COUNT(a.id), 0) AS NUMERIC), 2) as taxa_presenca
            FROM psicologos psi
            LEFT JOIN agendamentos a ON psi.id = a.psicologo_id
            WHERE psi.role != 'admin'
            GROUP BY psi.id, psi.nome_completo
            ORDER BY taxa_presenca DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar estatísticas de presença:', error);
        res.status(500).json({ error: 'Erro ao buscar estatísticas de presença.' });
    }
};