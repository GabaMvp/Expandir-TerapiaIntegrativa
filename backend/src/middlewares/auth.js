const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ error: 'Acesso negado.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.psicologoId = decoded.id;
        req.psicologoEmail = decoded.email;
        req.psicologoRole = decoded.role || 'psicologo';
        next();
    } catch (error) {
        res.status(401).json({ error: 'Token inválido.' });
    }
};

const adminMiddleware = (req, res, next) => {
    if (req.psicologoRole !== 'admin') {
        return res.status(403).json({ 
            error: 'Acesso negado. Apenas administradores podem realizar esta ação.' 
        });
    }
    next();
};

module.exports = { authMiddleware, adminMiddleware };