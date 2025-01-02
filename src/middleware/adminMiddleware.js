// src/middleware/adminMiddleware.js

exports.isAdmin = (req, res, next) => {
    const userRole = req.user?.role;
  
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'No tienes permisos de administrador' });
    }
  
    next();
  };
  