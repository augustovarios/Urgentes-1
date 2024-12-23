// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

exports.auth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log('authMiddleware -> Authorization header:', authHeader);

  if (!authHeader) {
    console.log('authMiddleware -> Falta el header Authorization');
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    console.log('authMiddleware -> Falta el token después de Bearer');
    return res.status(401).json({ error: 'Token inválido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.userId, role: decoded.role };
    next();
  } catch (error) {
    console.log('authMiddleware -> Error al verificar token:', error.message);
    return res.status(401).json({ error: 'Token inválido' });
  }
};
