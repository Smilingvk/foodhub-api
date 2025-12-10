// __tests__/users.test.js
const request = require('supertest');
const express = require('express');
const usersRouter = require('../routes/users');
const mongodb = require('../config/database');

// Mock the database
jest.mock('../config/database');
jest.mock('../middleware/auth', () => ({
  isAuthenticated: (req, res, next) => next()
}));

const app = express();
app.use(express.json());
app.use('/users', usersRouter);

describe('Users API Endpoints', () => {
  beforeAll(() => {
    // Mock database connection
    mongodb.getDatabase = jest.fn(() => ({
      db: () => ({
        collection: () => ({
          find: () => ({
            toArray: async () => [
              {
                _id: '507f1f77bcf86cd799439011',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                phone: '+1234567890',
                address: '123 Main St'
              },
              {
                _id: '507f1f77bcf86cd799439012',
                firstName: 'Jane',
                lastName: 'Smith',
                email: 'jane@example.com',
                phone: '+0987654321',
                address: '456 Oak Ave'
              }
            ]
          }),
          findOne: async ({ _id }) => {
            if (_id.toString() === '507f1f77bcf86cd799439011') {
              return {
                _id: '507f1f77bcf86cd799439011',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                phone: '+1234567890',
                address: '123 Main St'
              };
            }
            return null;
          },
          insertOne: async (doc) => ({
            acknowledged: true,
            insertedId: '507f1f77bcf86cd799439013'
          }),
          updateOne: async ({ _id }, update) => {
            if (_id.toString() === '507f1f77bcf86cd799439011') {
              return { matchedCount: 1, modifiedCount: 1 };
            }
            return { matchedCount: 0, modifiedCount: 0 };
          },
          deleteOne: async ({ _id }) => {
            if (_id.toString() === '507f1f77bcf86cd799439011') {
              return { deletedCount: 1 };
            }
            return { deletedCount: 0 };
          }
        })
      })
    }));
  });

  describe('GET /users', () => {
    it('should return all users with status 200', async () => {
      const response = await request(app).get('/users');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body[0]).toHaveProperty('firstName');
      expect(response.body[0]).toHaveProperty('email');
    });
  });

  describe('GET /users/:id', () => {
    it('should return a single user with status 200', async () => {
      const response = await request(app).get('/users/507f1f77bcf86cd799439011');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('firstName', 'John');
      expect(response.body).toHaveProperty('email', 'john@example.com');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app).get('/users/507f1f77bcf86cd799439099');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'User not found');
    });

    it('should return 400 for invalid ID format', async () => {
      const response = await request(app).get('/users/invalid-id');
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /users', () => {
    it('should create a new user with status 201', async () => {
      const newUser = {
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'alice@example.com',
        phone: '+1122334455',
        address: '789 Pine Rd'
      };

      const response = await request(app)
        .post('/users')
        .send(newUser);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'User created successfully');
      expect(response.body).toHaveProperty('userId');
    });

    it('should return 400 when required fields are missing', async () => {
      const invalidUser = {
        firstName: 'Alice'
        // Missing lastName and email
      };

      const response = await request(app)
        .post('/users')
        .send(invalidUser);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid email format', async () => {
      const invalidUser = {
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'not-an-email'
      };

      const response = await request(app)
        .post('/users')
        .send(invalidUser);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid email format');
    });
  });

  describe('PUT /users/:id', () => {
    it('should update user with status 200', async () => {
      const updates = {
        firstName: 'John Updated',
        phone: '+9999999999'
      };

      const response = await request(app)
        .put('/users/507f1f77bcf86cd799439011')
        .send(updates);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'User updated successfully');
    });

    it('should return 404 for non-existent user', async () => {
      const updates = { firstName: 'Test' };

      const response = await request(app)
        .put('/users/507f1f77bcf86cd799439099')
        .send(updates);
      
      expect(response.status).toBe(404);
    });

    it('should return 400 when no fields to update', async () => {
      const response = await request(app)
        .put('/users/507f1f77bcf86cd799439011')
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'No fields to update');
    });
  });

  describe('DELETE /users/:id', () => {
    it('should delete user with status 204', async () => {
      const response = await request(app)
        .delete('/users/507f1f77bcf86cd799439011');
      
      expect(response.status).toBe(204);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .delete('/users/507f1f77bcf86cd799439099');
      
      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid ID format', async () => {
      const response = await request(app)
        .delete('/users/invalid-id');
      
      expect(response.status).toBe(400);
    });
  });
});