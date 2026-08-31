const express = require('express');
const router = express.Router();

const {
    authMiddleware,
    adminMiddleware,
} = require('../middlewares/auth');

const pacienteController = require('../controllers/pacienteController');

router.use(authMiddleware);

router.get('/', pacienteController.listar);
router.get('/:id', pacienteController.buscar);

router.post('/', adminMiddleware, pacienteController.criar);
router.put('/:id', adminMiddleware, pacienteController.atualizar);
router.delete('/:id', adminMiddleware, pacienteController.deletar);

module.exports = router;