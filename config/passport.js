// config/passport.js
const GitHubStrategy = require('passport-github2').Strategy;
const passport = require('passport');

// Validar que las variables de entorno existan
if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
  console.error('❌ ERROR: GITHUB_CLIENT_ID y GITHUB_CLIENT_SECRET son requeridos en .env');
  process.exit(1);
}

// Determinar la callback URL según el ambiente
const getCallbackURL = () => {
  if (process.env.CALLBACK_URL) {
    return process.env.CALLBACK_URL;
  }
  
  // Fallback basado en el ambiente
  if (process.env.NODE_ENV === 'production') {
    return 'https://foodhub-api-mhb6.onrender.com/auth/callback';
  }
  
  return 'http://localhost:3000/auth/callback';
};

const callbackURL = getCallbackURL();
console.log('🔐 GitHub OAuth Callback URL:', callbackURL);

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: callbackURL
  },
  function(accessToken, refreshToken, profile, done) {
    console.log('✅ GitHub authentication successful for user:', profile.username);
    // En producción, aquí guardarías/buscarías el usuario en la BD
    return done(null, profile);
  }
));

passport.serializeUser((user, done) => {
  console.log('📝 Serializing user:', user.username || user.id);
  // Guardamos el objeto completo del usuario
  done(null, {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    email: user.emails && user.emails[0] ? user.emails[0].value : null,
    avatarUrl: user.photos && user.photos[0] ? user.photos[0].value : null,
    profileUrl: user.profileUrl
  });
});

passport.deserializeUser((user, done) => {
  console.log('📖 Deserializing user:', user.username || user.id);
  // Retornamos el usuario que guardamos
  done(null, user);
});

module.exports = passport;