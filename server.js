// server.js - FoodHub API Main Server
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('./config/passport');
const mongodb = require('./config/database');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger/swagger.json');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// ========== MIDDLEWARE ==========
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'foodhub-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// ========== SWAGGER DOCUMENTATION ==========
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// ========== ROUTES ==========
app.use('/auth', require('./routes/auth'));
app.use('/users', require('./routes/users'));
app.use('/products', require('./routes/products'));

app.get('/auth/callback', 
  passport.authenticate('github', { 
    failureRedirect: '/',
    failureMessage: true 
  }),
  (req, res) => {
    console.log('=== CALLBACK DEBUG ===');
    console.log('User authenticated:', req.user ? (req.user.username || req.user.displayName) : 'NO USER');
    console.log('Session ID:', req.sessionID);
    console.log('Session before save:', req.session);
    
    // Guardar usuario en sesión
    req.session.user = req.user;
    
    req.session.save((err) => {
      if (err) {
        console.error('Error saving session:', err);
        return res.redirect('/?error=session-save-failed');
      }
      console.log('Session saved successfully');
      console.log('Session after save:', req.session);
      res.redirect('/');
    });
  }
);

// ========== ROOT ROUTE ==========
app.get('/', (req, res) => {
  const isLoggedIn = req.session && req.session.user;
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>FoodHub API</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 50px auto;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .container {
          background: white;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
          color: #ff6b6b;
        }
        .status {
          padding: 10px;
          border-radius: 4px;
          margin: 20px 0;
        }
        .logged-in {
          background-color: #d4edda;
          color: #155724;
        }
        .logged-out {
          background-color: #f8d7da;
          color: #721c24;
        }
        a {
          display: inline-block;
          margin: 10px 10px 10px 0;
          padding: 10px 20px;
          background-color: #007bff;
          color: white;
          text-decoration: none;
          border-radius: 4px;
        }
        a:hover {
          background-color: #0056b3;
        }
        .logout-btn {
          background-color: #dc3545;
        }
        .logout-btn:hover {
          background-color: #c82333;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🍔 Welcome to FoodHub API</h1>
        <p>Backend service for online food store - meals, snacks, and drinks</p>
        
        <div class="status ${isLoggedIn ? 'logged-in' : 'logged-out'}">
          <strong>Status:</strong> ${isLoggedIn ? '✓ Logged In' : '✗ Not Logged In'}
          ${isLoggedIn ? `<br><strong>User:</strong> ${req.session.user.displayName || req.session.user.username}` : ''}
        </div>

        <h3>Quick Links:</h3>
        ${!isLoggedIn ? '<a href="/auth/login">🔐 Login with GitHub</a>' : '<a href="/auth/logout" class="logout-btn">🚪 Logout</a>'}
        <a href="/api-docs">📚 API Documentation</a>
        
        <h3>Available Endpoints:</h3>
        <ul>
          <li><strong>Authentication:</strong> /auth/login, /auth/logout</li>
          <li><strong>Users:</strong> GET, POST, PUT, DELETE /users</li>
          <li><strong>Products:</strong> GET, POST, PUT, DELETE /products</li>
        </ul>

        <p><em>Created by: Valeria Guzman</em></p>
      </div>
    </body>
    </html>
  `);
});

// ========== 404 HANDLER ==========
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableEndpoints: [
      'GET /',
      'GET /api-docs',
      'GET /auth/login',
      'GET /auth/logout',
      'GET /users',
      'GET /products'
    ]
  });
});

// ========== ERROR HANDLER ==========
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ========== START SERVER ==========
mongodb.initDb((err) => {
  if (err) {
    console.error('❌ Failed to initialize database:', err);
    process.exit(1);
  }
  
  app.listen(port, () => {
    console.log('========================================');
    console.log('🍔 FoodHub API Server');
    console.log('========================================');
    console.log(`🚀 Server running on port ${port}`);
    console.log(`📚 API Docs: http://localhost:${port}/api-docs`);
    console.log(`🔐 Login: http://localhost:${port}/auth/login`);
    console.log(`✅ Database connected successfully`);
    console.log('========================================');
  });
});