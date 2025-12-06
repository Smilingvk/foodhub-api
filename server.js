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

// ========== ROOT ROUTE (debe ir ANTES de las rutas de auth) ==========
app.get('/', (req, res) => {
  console.log('=== HOME PAGE DEBUG ===');
  console.log('Session ID:', req.sessionID);
  console.log('Session user:', req.session.user);
  console.log('Is authenticated:', req.isAuthenticated());
  
  const isLoggedIn = req.session && req.session.user;
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>FoodHub API - Your Food Delivery Backend</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap" rel="stylesheet">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Poppins', sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        
        .container {
          background: white;
          padding: 50px;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          max-width: 600px;
          width: 100%;
          animation: slideUp 0.5s ease-out;
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .header {
          text-align: center;
          margin-bottom: 40px;
        }
        
        .logo {
          font-size: 60px;
          margin-bottom: 10px;
        }
        
        h1 {
          color: #667eea;
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 10px;
        }
        
        .tagline {
          color: #6b7280;
          font-size: 16px;
          font-weight: 300;
        }
        
        .status-card {
          padding: 20px;
          border-radius: 12px;
          margin: 30px 0;
          text-align: center;
          transition: transform 0.3s ease;
        }
        
        .status-card:hover {
          transform: translateY(-5px);
        }
        
        .logged-in {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        
        .logged-out {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
        }
        
        .status-icon {
          font-size: 48px;
          margin-bottom: 10px;
        }
        
        .status-text {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 5px;
        }
        
        .user-info {
          font-size: 14px;
          opacity: 0.9;
          margin-top: 10px;
        }
        
        .buttons {
          display: flex;
          flex-direction: column;
          gap: 15px;
          margin: 30px 0;
        }
        
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 16px 32px;
          text-decoration: none;
          border-radius: 12px;
          font-weight: 600;
          font-size: 16px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
          border: none;
          cursor: pointer;
        }
        
        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.3);
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        
        .btn-github {
          background: #24292e;
          color: white;
        }
        
        .btn-github:hover {
          background: #1a1f23;
        }
        
        .btn-danger {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
        }
        
        .btn-icon {
          margin-right: 10px;
          font-size: 20px;
        }
        
        .features {
          margin: 30px 0;
          padding: 25px;
          background: #f9fafb;
          border-radius: 12px;
        }
        
        .features h3 {
          color: #374151;
          font-size: 18px;
          margin-bottom: 15px;
          font-weight: 600;
        }
        
        .features ul {
          list-style: none;
        }
        
        .features li {
          padding: 10px 0;
          color: #6b7280;
          display: flex;
          align-items: center;
        }
        
        .features li:before {
          content: "🍔";
          margin-right: 10px;
          font-size: 20px;
        }
        
        .features li:nth-child(2):before { content: "🍟"; }
        .features li:nth-child(3):before { content: "🥤"; }
        .features li:nth-child(4):before { content: "🔐"; }
        
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          color: #9ca3af;
          font-size: 14px;
        }
        
        .badge {
          display: inline-block;
          padding: 4px 12px;
          background: #10b981;
          color: white;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          margin-left: 10px;
        }
        
        @media (max-width: 600px) {
          .container {
            padding: 30px 20px;
          }
          
          h1 {
            font-size: 24px;
          }
          
          .btn {
            padding: 14px 24px;
            font-size: 14px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🍔</div>
          <h1>FoodHub API <span class="badge">v1.0</span></h1>
          <p class="tagline">Backend service for your food delivery app</p>
        </div>
        
        <div class="status-card ${isLoggedIn ? 'logged-in' : 'logged-out'}">
          <div class="status-icon">${isLoggedIn ? '✓' : '🔒'}</div>
          <div class="status-text">
            ${isLoggedIn ? 'Successfully Authenticated' : 'Authentication Required'}
          </div>
          ${isLoggedIn ? `
            <div class="user-info">
              <strong>Welcome back, ${req.session.user.displayName || req.session.user.username}!</strong><br>
              Logged in via GitHub OAuth
            </div>
          ` : `
            <div class="user-info">
              Login with GitHub to access protected endpoints
            </div>
          `}
        </div>

        <div class="buttons">
          ${!isLoggedIn ? `
            <a href="/auth/login" class="btn btn-github">
              <span class="btn-icon">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </span>
              Sign in with GitHub
            </a>
          ` : `
            <a href="/auth/logout" class="btn btn-danger">
              <span class="btn-icon">🚪</span>
              Logout
            </a>
          `}
          
          <a href="/api-docs" class="btn btn-primary">
            <span class="btn-icon">📚</span>
            API Documentation
          </a>
        </div>
        
        <div class="features">
          <h3>🚀 Available Features</h3>
          <ul>
            <li><strong>User Management:</strong> CRUD operations for customer profiles</li>
            <li><strong>Product Inventory:</strong> Manage meals, snacks & drinks</li>
            <li><strong>Secure Authentication:</strong> GitHub OAuth integration</li>
            <li><strong>RESTful API:</strong> Full OpenAPI 3.0 documentation</li>
          </ul>
        </div>
        
        <div class="footer">
          <p>Created with ❤️ by <strong>Valeria Guzman</strong></p>
          <p style="margin-top: 10px; font-size: 12px;">
            MongoDB · Express.js · Node.js · Passport.js
          </p>
        </div>
      </div>
    </body>
    </html>
  `);
});

// ========== ROUTES ==========
app.use('/auth', require('./routes/auth'));
app.use('/users', require('./routes/users'));
app.use('/products', require('./routes/products'));

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