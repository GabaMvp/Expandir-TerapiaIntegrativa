const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth');
const pacienteController = require('../controllers/pacienteController');

router.use(authMiddleware);

router.get('/', pacienteController.listar);
router.post('/', pacienteController.criar);
router.get('/:id', pacienteController.buscar);
router.put('/:id', pacienteController.atualizar);
router.delete('/:id', pacienteController.deletar);

module.exports = router;