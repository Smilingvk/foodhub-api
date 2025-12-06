// routes/auth.js
const express = require('express');
const passport = require('passport');
const router = express.Router();

// GET /auth/login - Iniciar sesión con GitHub OAuth
router.get('/login', (req, res, next) => {
  console.log('🔐 Iniciando flujo de login...');
  passport.authenticate('github', { scope: ['user:email'] })(req, res, next);
});

// GET /auth/callback - Callback de GitHub OAuth
router.get('/callback', 
  passport.authenticate('github', { 
    failureRedirect: '/',
    failureMessage: true 
  }),
  (req, res) => {
    console.log('=== CALLBACK SUCCESS ===');
    console.log('✅ User authenticated:', req.user ? (req.user.username || req.user.displayName) : 'NO USER');
    console.log('📝 Session ID before save:', req.sessionID);
    console.log('👤 User object:', JSON.stringify(req.user, null, 2));
    
    // IMPORTANTE: Guardar usuario en sesión ANTES de forzar el save
    req.session.user = {
      id: req.user.id,
      username: req.user.username,
      displayName: req.user.displayName,
      email: req.user.emails && req.user.emails[0] ? req.user.emails[0].value : null,
      avatarUrl: req.user.photos && req.user.photos[0] ? req.user.photos[0].value : null,
      profileUrl: req.user.profileUrl
    };
    
    console.log('💾 Session user set:', JSON.stringify(req.session.user, null, 2));
    
    // Forzar el guardado de la sesión antes de redirigir
    req.session.save((err) => {
      if (err) {
        console.error('❌ Error saving session:', err);
        return res.redirect('/?error=session-save-failed');
      }
      
      console.log('✅ Session saved successfully!');
      console.log('📝 Session ID after save:', req.sessionID);
      console.log('📦 Full session data:', JSON.stringify(req.session, null, 2));
      
      // Redirigir a la página principal
      res.redirect('/');
    });
  }
);

// GET /auth/logout - Cerrar sesión
router.get('/logout', (req, res) => {
  console.log('=== LOGOUT ===');
  console.log('👤 Logging out user:', req.session.user ? req.session.user.username : 'No user');
  
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
      res.redirect('/');
    });
  });
});

// GET /auth/status - Verificar estado de autenticación (para debugging)
router.get('/status', (req, res) => {
  res.json({
    isAuthenticated: req.isAuthenticated(),
    sessionID: req.sessionID,
    user: req.session.user || null,
    passportUser: req.user || null,
    session: req.session
  });
});

module.exports = router;