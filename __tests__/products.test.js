// __tests__/products.test.js
const request = require('supertest');
const express = require('express');
const productsRouter = require('../routes/products');
const mongodb = require('../config/database');

jest.mock('../config/database');
jest.mock('../middleware/auth', () => ({
  isAuthenticated: (req, res, next) => next()
}));

const app = express();
app.use(express.json());
app.use('/products', productsRouter);

describe('Products API Endpoints', () => {
  beforeAll(() => {
    mongodb.getDatabase = jest.fn(() => ({
      db: () => ({
        collection: () => ({
          find: () => ({
            toArray: async () => [
              {
                _id: '607f1f77bcf86cd799439011',
                name: 'Burger',
                description: 'Delicious burger',
                price: 8.99,
                category: 'meals',
                stock: 50,
                isAvailable: true
              },
              {
                _id: '607f1f77bcf86cd799439012',
                name: 'Fries',
                description: 'Crispy fries',
                price: 3.99,
                category: 'snacks',
                stock: 100,
                isAvailable: true
              }
            ]
          }),
          findOne: async ({ _id }) => {
            if (_id.toString() === '607f1f77bcf86cd799439011') {
              return {
                _id: '607f1f77bcf86cd799439011',
                name: 'Burger',
                description: 'Delicious burger',
                price: 8.99,
                category: 'meals',
                stock: 50,
                isAvailable: true
              };
            }
            return null;
          },
          insertOne: async (doc) => ({
            acknowledged: true,
            insertedId: '607f1f77bcf86cd799439013'
          }),
          updateOne: async ({ _id }, update) => {
            if (_id.toString() === '607f1f77bcf86cd799439011') {
              return { matchedCount: 1, modifiedCount: 1 };
            }
            return { matchedCount: 0, modifiedCount: 0 };
          },
          deleteOne: async ({ _id }) => {
            if (_id.toString() === '607f1f77bcf86cd799439011') {
              return { deletedCount: 1 };
            }
            return { deletedCount: 0 };
          }
        })
      })
    }));
  });

  describe('GET /products', () => {
    it('should return all products with status 200', async () => {
      const response = await request(app).get('/products');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('price');
    });
  });

  describe('GET /products/:id', () => {
    it('should return a single product with status 200', async () => {
      const response = await request(app).get('/products/607f1f77bcf86cd799439011');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name', 'Burger');
      expect(response.body).toHaveProperty('price', 8.99);
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app).get('/products/607f1f77bcf86cd799439099');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Product not found');
    });
  });

  describe('POST /products', () => {
    it('should create a new product with status 201', async () => {
      const newProduct = {
        name: 'Pizza',
        description: 'Cheesy pizza',
        price: 12.99,
        category: 'meals',
        stock: 30,
        isAvailable: true
      };

      const response = await request(app)
        .post('/products')
        .send(newProduct);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Product created successfully');
    });

    it('should return 400 when required fields are missing', async () => {
      const invalidProduct = {
        name: 'Pizza'
        // Missing description, price, category
      };

      const response = await request(app)
        .post('/products')
        .send(invalidProduct);
      
      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid category', async () => {
      const invalidProduct = {
        name: 'Pizza',
        description: 'Cheesy pizza',
        price: 12.99,
        category: 'invalid-category'
      };

      const response = await request(app)
        .post('/products')
        .send(invalidProduct);
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('category must be one of');
    });
  });

  describe('PUT /products/:id', () => {
    it('should update product with status 200', async () => {
      const updates = {
        price: 9.99,
        stock: 45
      };

      const response = await request(app)
        .put('/products/607f1f77bcf86cd799439011')
        .send(updates);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Product updated successfully');
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .put('/products/607f1f77bcf86cd799439099')
        .send({ price: 10.99 });
      
      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /products/:id', () => {
    it('should delete product with status 204', async () => {
      const response = await request(app)
        .delete('/products/607f1f77bcf86cd799439011');
      
      expect(response.status).toBe(204);
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .delete('/products/607f1f77bcf86cd799439099');
      
      expect(response.status).toBe(404);
    });
  });
});