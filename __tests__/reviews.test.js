// __tests__/reviews.test.js
const request = require('supertest');
const express = require('express');
const reviewsRouter = require('../routes/reviews');
const mongodb = require('../config/database');

jest.mock('../config/database');
jest.mock('../middleware/auth', () => ({
  isAuthenticated: (req, res, next) => next()
}));

const app = express();
app.use(express.json());
app.use('/reviews', reviewsRouter);

describe('Reviews API Endpoints', () => {
  beforeAll(() => {
    mongodb.getDatabase = jest.fn(() => ({
      db: () => ({
        collection: () => ({
          find: () => ({
            toArray: async () => [
              {
                _id: '693474374b390acc3b3425a0',
                userId: '693472e64b390acc3b34258a',
                productId: '693473374b390acc3b342594',
                rating: 5,
                comment: 'Amazing burger!',
                createdAt: '2024-12-10T12:00:00.000Z'
              },
              {
                _id: '693474374b390acc3b3425a1',
                userId: '693472e64b390acc3b34258b',
                productId: '693473374b390acc3b342595',
                rating: 4,
                comment: 'Great salad.',
                createdAt: '2024-12-10T12:05:00.000Z'
              }
            ]
          }),
          findOne: async ({ _id }) => {
            if (_id.toString() === '693474374b390acc3b3425a0') {
              return {
                _id: '693474374b390acc3b3425a0',
                userId: '693472e64b390acc3b34258a',
                productId: '693473374b390acc3b342594',
                rating: 5,
                comment: 'Amazing burger!',
                createdAt: '2024-12-10T12:00:00.000Z'
              };
            }
            return null;
          },
          insertOne: async (doc) => ({
            acknowledged: true,
            insertedId: '693474374b390acc3b3425a2'
          }),
          updateOne: async ({ _id }, update) => {
            if (_id.toString() === '693474374b390acc3b3425a0') {
              return { matchedCount: 1, modifiedCount: 1 };
            }
            return { matchedCount: 0, modifiedCount: 0 };
          },
          deleteOne: async ({ _id }) => {
            if (_id.toString() === '693474374b390acc3b3425a0') {
              return { deletedCount: 1 };
            }
            return { deletedCount: 0 };
          }
        })
      })
    }));
  });

  describe('GET /reviews', () => {
    it('should return all reviews with status 200', async () => {
      const res = await request(app).get('/reviews');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
      expect(res.body[0]).toHaveProperty('rating');
      expect(res.body[0]).toHaveProperty('comment');
    });
  });

  describe('GET /reviews/:id', () => {
    it('should return a single review with status 200', async () => {
      const res = await request(app).get('/reviews/693474374b390acc3b3425a0');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('rating', 5);
      expect(res.body).toHaveProperty('comment', 'Amazing burger!');
    });

    it('should return 404 for non-existent review', async () => {
      const res = await request(app).get('/reviews/693474374b390acc3b3425ff');
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'Review not found');
    });

    it('should return 400 for invalid id format', async () => {
      const res = await request(app).get('/reviews/invalid-id-format');
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Invalid review ID format');
    });
  });

  describe('POST /reviews', () => {
    it('should create a new review with status 201', async () => {
      const payload = {
        userId: '693472e64b390acc3b34258a',
        productId: '693473374b390acc3b342594',
        rating: 5,
        comment: 'Loved it!'
      };
      const res = await request(app).post('/reviews').send(payload);
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('message', 'Review created successfully');
      expect(res.body).toHaveProperty('reviewId');
    });

    it('should return 400 when required fields missing', async () => {
      const res = await request(app).post('/reviews').send({
        userId: '693472e64b390acc3b34258a',
        // missing productId and rating
      });
      expect(res.status).toBe(400);
    });

    it('should return 400 when rating invalid', async () => {
      const res = await request(app).post('/reviews').send({
        userId: '693472e64b390acc3b34258a',
        productId: '693473374b390acc3b342594',
        rating: 6, // invalid
        comment: 'Too good?'
      });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'rating must be a number between 1 and 5');
    });
  });

  describe('PUT /reviews/:id', () => {
    it('should update review with status 200', async () => {
      const res = await request(app)
        .put('/reviews/693474374b390acc3b3425a0')
        .send({ rating: 4, comment: 'Updated comment' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Review updated successfully');
      expect(res.body).toHaveProperty('matchedCount', 1);
    });

    it('should return 404 for non-existent review', async () => {
      const res = await request(app)
        .put('/reviews/693474374b390acc3b3425ff')
        .send({ rating: 4 });
      expect(res.status).toBe(404);
    });

    it('should return 400 for invalid rating on update', async () => {
      const res = await request(app)
        .put('/reviews/693474374b390acc3b3425a0')
        .send({ rating: 0 });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'rating must be a number between 1 and 5');
    });
  });

  describe('DELETE /reviews/:id', () => {
    it('should delete review with status 204', async () => {
      const res = await request(app).delete('/reviews/693474374b390acc3b3425a0');
      expect(res.status).toBe(204);
    });

    it('should return 404 for non-existent review', async () => {
      const res = await request(app).delete('/reviews/693474374b390acc3b3425ff');
      expect(res.status).toBe(404);
    });

    it('should return 400 for invalid id format', async () => {
      const res = await request(app).delete('/reviews/invalid-id');
      expect(res.status).toBe(400);
    });
  });
});
