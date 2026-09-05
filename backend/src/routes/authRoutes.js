const express = require('express');

const router = express.Router();

const authController = require('../controllers/authController');
const { authMiddleware } = require('../middlewares/auth');

router.post('/login', authController.login);

router.post('/register', authController.register);

router.put(
    '/alterar-senha',
    authMiddleware,
    authController.alterarSenha
);

module.exports = router;