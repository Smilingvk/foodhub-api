// middleware/auth.js

// Middleware para verificar si el usuario está autenticado con OAuth
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  return res.status(401).json({ 
    error: 'Authentication required. Please login at /auth/login' 
  });
};

// Middleware para verificar si el usuario es admin (para Week 06)
const isAdmin = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ 
    error: 'Forbidden. Admin access required.' 
  });
};

module.exports = {
  isAuthenticated,
  isAdmin
};