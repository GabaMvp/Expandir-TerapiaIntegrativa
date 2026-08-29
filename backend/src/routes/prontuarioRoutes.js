const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth');
const prontuarioController = require('../controllers/prontuarioController');

router.use(authMiddleware);

router.get('/paciente/:paciente_id', prontuarioController.buscar);
router.post('/paciente/:paciente_id', prontuarioController.salvar);
router.post('/paciente/:paciente_id/evolucoes', prontuarioController.adicionarEvolucao);
router.get('/paciente/:paciente_id/evolucoes', prontuarioController.listarEvolucoes);

module.exports = router;