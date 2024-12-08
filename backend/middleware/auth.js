const jwt = require('jsonwebtoken');

const authMiddleware = (roles = []) => {
    // Roles parameter can be a single role or an array of roles
    if (typeof roles === 'string') {
        roles = [roles];
    }

    return (req, res, next) => {
        const token = req.headers['authorization'];
        if (!token) return res.status(403).send('Access denied');

        try {
            const decoded = jwt.verify(token, 'secretKey');
            req.user = decoded;

            if (roles.length && !roles.includes(req.user.role)) {
                return res.status(403).send('Access denied: insufficient permissions');
            }

            next();
        } catch (err) {
            return res.status(401).send('Invalid token');
        }
    };
};

module.exports = authMiddleware;
