// config/passport.js
const GitHubStrategy = require('passport-github2').Strategy;
const passport = require('passport');

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL || "https://foodhub-api-mhb6.onrender.com/github/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    // En producción, aquí guardarías/buscarías el usuario en la BD
    return done(null, profile);
  }
));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

module.exports = passport;