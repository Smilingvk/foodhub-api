// config/database.js
const { MongoClient } = require('mongodb');
require('dotenv').config();

let database;

const initDb = (callback) => {
  if (database) {
    console.log('Database is already initialized');
    return callback(null, database);
  }
  
  MongoClient.connect(process.env.MONGODB_URL)
    .then((client) => {
      database = client;
      console.log('✅ Database connection established');
      callback(null, database);
    })
    .catch((err) => {
      console.error('❌ Database connection failed:', err);
      callback(err);
    });
};

const getDatabase = () => {
  if (!database) {
    throw new Error('Database not initialized');
  }
  return database;
};

module.exports = {
  initDb,
  getDatabase
};