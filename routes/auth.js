// routes/auth.js
const express = require('express');
const passport = require('passport');
const router = express.Router();

// GET /auth/login - Iniciar sesión con GitHub OAuth
router.get('/login', passport.authenticate('github', { scope: ['user:email'] }));

// GET /auth/callback - Callback de GitHub OAuth
router.get('/callback', 
  passport.authenticate('github', { failureRedirect: '/api-docs' }),
  (req, res) => {
    // Guardar usuario en sesión
    req.session.user = req.user;
    res.redirect('/api-docs');
  }
);

// GET /auth/logout - Cerrar sesión
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Session destruction failed' });
      }
      res.redirect('/api-docs');
    });
  });
});

module.exports = router;