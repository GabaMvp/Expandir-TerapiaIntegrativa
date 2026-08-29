const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { adminMiddleware, authMiddleware } = require('../middlewares/auth');

router.post('/login', authController.login);
router.post('/register', authMiddleware, adminMiddleware, authController.register);

module.exports = router;