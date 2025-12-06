// routes/auth.js
const express = require('express');
const passport = require('passport');
const router = express.Router();

// GET /auth/login - Iniciar sesión con GitHub OAuth
router.get('/login', passport.authenticate('github', { scope: ['user:email'] }));

// GET /auth/callback - Callback de GitHub OAuth
router.get('/callback', 
  passport.authenticate('github', { 
    failureRedirect: '/',
    failureMessage: true 
  }),
  (req, res) => {
    console.log('=== CALLBACK SUCCESS ===');
    console.log('User authenticated:', req.user ? (req.user.username || req.user.displayName) : 'NO USER');
    console.log('Session ID:', req.sessionID);
    
    // Guardar usuario en sesión
    req.session.user = req.user;
    
    // Forzar el guardado de la sesión antes de redirigir
    req.session.save((err) => {
      if (err) {
        console.error('❌ Error saving session:', err);
        return res.redirect('/?error=session-save-failed');
      }
      console.log('✅ Session saved successfully');
      console.log('Session data:', req.session);
      // Redirigir a la página principal (la bonita)
      res.redirect('/');
    });
  }
);

// GET /auth/logout - Cerrar sesión
router.get('/logout', (req, res) => {
  console.log('=== LOGOUT ===');
  req.logout((err) => {
    if (err) {
      console.error('❌ Logout error:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }
    req.session.destroy((err) => {
      if (err) {
        console.error('❌ Session destroy error:', err);
        return res.status(500).json({ error: 'Session destruction failed' });
      }
      console.log('✅ Logged out successfully');
      // Redirigir a la página principal
      res.redirect('/');
    });
  });
});

module.exports = router;