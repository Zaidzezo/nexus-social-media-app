const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; 
        
        if (decoded._id && !decoded.id) {
            req.user.id = decoded._id.toString();
        } else if (decoded.id && !decoded._id) {
            req.user._id = decoded.id;
        }
        
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid token.' });
    }
};

module.exports = authMiddleware;