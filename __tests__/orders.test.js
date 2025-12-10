// __tests__/orders.test.js
const request = require('supertest');
const express = require('express');
const ordersRouter = require('../routes/orders');
const mongodb = require('../config/database');

jest.mock('../config/database');
jest.mock('../middleware/auth', () => ({
  isAuthenticated: (req, res, next) => next()
}));

const app = express();
app.use(express.json());
app.use('/orders', ordersRouter);

describe('Orders API Endpoints', () => {
  beforeAll(() => {
    mongodb.getDatabase = jest.fn(() => ({
      db: () => ({
        collection: () => ({
          find: () => ({
            toArray: async () => [
              {
                _id: '693475374b390acc3b3426b0',
                userId: '693472e64b390acc3b34258a',
                products: [
                  { productId: '693473374b390acc3b342594', quantity: 1, price: 9.99, name: 'Classic Cheeseburger' }
                ],
                totalAmount: 9.99,
                deliveryAddress: '123 Main Street, Los Angeles, CA 90001',
                status: 'delivered',
                orderDate: '2024-12-10T11:00:00.000Z',
                createdAt: '2024-12-10T11:00:00.000Z'
              }
            ]
          }),
          findOne: async ({ _id }) => {
            if (_id.toString() === '693475374b390acc3b3426b0') {
              return {
                _id: '693475374b390acc3b3426b0',
                userId: '693472e64b390acc3b34258a',
                products: [
                  { productId: '693473374b390acc3b342594', quantity: 1, price: 9.99, name: 'Classic Cheeseburger' }
                ],
                totalAmount: 9.99,
                deliveryAddress: '123 Main Street, Los Angeles, CA 90001',
                status: 'delivered',
                orderDate: '2024-12-10T11:00:00.000Z',
                createdAt: '2024-12-10T11:00:00.000Z'
              };
            }
            return null;
          },
          insertOne: async (doc) => ({
            acknowledged: true,
            insertedId: '693475374b390acc3b3426b1'
          }),
          updateOne: async ({ _id }, update) => {
            if (_id.toString() === '693475374b390acc3b3426b0') {
              return { matchedCount: 1, modifiedCount: 1 };
            }
            return { matchedCount: 0, modifiedCount: 0 };
          },
          deleteOne: async ({ _id }) => {
            if (_id.toString() === '693475374b390acc3b3426b0') {
              return { deletedCount: 1 };
            }
            return { deletedCount: 0 };
          }
        })
      })
    }));
  });

  describe('GET /orders', () => {
    it('should return all orders with status 200', async () => {
      const res = await request(app).get('/orders');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0]).toHaveProperty('totalAmount');
    });
  });

  describe('GET /orders/:id', () => {
    it('should return a single order with status 200', async () => {
      const res = await request(app).get('/orders/693475374b390acc3b3426b0');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalAmount', 9.99);
      expect(res.body).toHaveProperty('status', 'delivered');
    });

    it('should return 404 for non-existent order', async () => {
      const res = await request(app).get('/orders/693475374b390acc3b3426ff');
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'Order not found');
    });

    it('should return 400 for invalid id format', async () => {
      const res = await request(app).get('/orders/invalid-id');
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Invalid order ID format');
    });
  });

  describe('POST /orders', () => {
    it('should create a new order with status 201', async () => {
      const payload = {
        userId: '693472e64b390acc3b34258a',
        products: [
          { productId: '693473374b390acc3b342594', quantity: 2, price: 9.99, name: 'Classic Cheeseburger' }
        ],
        totalAmount: 19.98,
        deliveryAddress: '123 Main Street, Los Angeles, CA 90001'
      };
      const res = await request(app).post('/orders').send(payload);
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('message', 'Order created successfully');
      expect(res.body).toHaveProperty('orderId');
    });

    it('should return 400 when required fields missing', async () => {
      const res = await request(app).post('/orders').send({
        userId: '693472e64b390acc3b34258a',
        // missing products, totalAmount, deliveryAddress
      });
      expect(res.status).toBe(400);
    });

    it('should return 400 when products array invalid', async () => {
      const res = await request(app).post('/orders').send({
        userId: '693472e64b390acc3b34258a',
        products: [],
        totalAmount: 0,
        deliveryAddress: 'some address'
      });
      expect(res.status).toBe(400);
    });
  });

  describe('PUT /orders/:id', () => {
    it('should update order with status 200', async () => {
      const res = await request(app)
        .put('/orders/693475374b390acc3b3426b0')
        .send({ status: 'confirmed' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Order updated successfully');
      expect(res.body).toHaveProperty('matchedCount', 1);
    });

    it('should return 400 for invalid status value', async () => {
      const res = await request(app)
        .put('/orders/693475374b390acc3b3426b0')
        .send({ status: 'unknown-status' });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('status must be one of');
    });

    it('should return 404 for non-existent order', async () => {
      const res = await request(app)
        .put('/orders/693475374b390acc3b3426ff')
        .send({ status: 'confirmed' });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /orders/:id', () => {
    it('should delete order with status 204', async () => {
      const res = await request(app).delete('/orders/693475374b390acc3b3426b0');
      expect(res.status).toBe(204);
    });

    it('should return 404 for non-existent order', async () => {
      const res = await request(app).delete('/orders/693475374b390acc3b3426ff');
      expect(res.status).toBe(404);
    });

    it('should return 400 for invalid id format', async () => {
      const res = await request(app).delete('/orders/invalid-id');
      expect(res.status).toBe(400);
    });
  });
});
