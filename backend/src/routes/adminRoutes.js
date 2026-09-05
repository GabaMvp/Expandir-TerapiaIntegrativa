const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');
const adminController = require('../controllers/adminController');

router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/estatisticas', adminController.estatisticas);

router.get('/psicologos', adminController.listarPsicologos);
router.get('/psicologos/disponiveis', adminController.listarPsicologosDisponiveis);
router.put('/psicologos/:id', adminController.atualizarPsicologo);
router.put('/psicologos/:id/bloquear', adminController.bloquearPsicologo);
router.delete('/psicologos/:id', adminController.removerPsicologo);

router.get('/pacientes', adminController.listarTodosPacientes);
router.get('/agendamentos', adminController.listarTodosAgendamentos);

router.get('/relatorios/atendimentos', adminController.relatorioAtendimentos);
router.get('/relatorios/pacientes-por-psicologo', adminController.pacientesPorPsicologo);
router.get('/relatorios/agendamentos-cancelados', adminController.agendamentosCancelados);

router.get('/faturamento/completo', adminController.faturamentoCompleto);
router.get('/faturamento/resumo', adminController.resumoFaturamento);

router.get('/estatisticas/presenca', adminController.estatisticasPresenca);

module.exports = router;