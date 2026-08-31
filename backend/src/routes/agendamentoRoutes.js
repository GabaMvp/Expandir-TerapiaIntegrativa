const express = require('express');
const router = express.Router();

const {
    authMiddleware,
    adminMiddleware,
} = require('../middlewares/auth');

const agendamentoController = require('../controllers/agendamentoController');

router.use(authMiddleware);

router.post(
    '/',
    adminMiddleware,
    agendamentoController.criar
);

router.put(
    '/:id',
    adminMiddleware,
    agendamentoController.atualizar
);

router.put(
    '/:id/status',
    adminMiddleware,
    agendamentoController.atualizarStatus
);

router.delete(
    '/:id',
    adminMiddleware,
    agendamentoController.cancelar
);

router.get(
    '/',
    agendamentoController.listar
);


router.put(
    '/:id/compareceu',
    agendamentoController.marcarComparecimento
);

module.exports = router;