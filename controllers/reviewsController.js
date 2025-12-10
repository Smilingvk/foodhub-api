// controllers/reviewsController.js
const mongodb = require('../config/database');
const { ObjectId } = require('mongodb');

const collectionName = 'reviews';

function isValidId(id) {
  return ObjectId.isValid(id);
}

// GET /reviews - Obtener todas las reseñas
const getAll = async (req, res) => {
  try {
    const cursor = mongodb.getDatabase().db().collection(collectionName).find();
    const reviews = await cursor.toArray();
    return res.status(200).json(reviews);
  } catch (err) {
    console.error('getAll error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /reviews/:id - Obtener una reseña por ID
const getSingle = async (req, res) => {
  try {
    const id = req.params.id;
    if (!isValidId(id)) {
      return res.status(400).json({ error: 'Invalid review ID format' });
    }

    const review = await mongodb.getDatabase().db().collection(collectionName)
      .findOne({ _id: new ObjectId(id) });
    
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    return res.status(200).json(review);
  } catch (err) {
    console.error('getSingle error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /reviews - Crear una nueva reseña
const createReview = async (req, res) => {
  try {
    const { userId, productId, rating, comment } = req.body;
    
    // Validación de campos requeridos
    if (!userId || !productId || !rating) {
      return res.status(400).json({ 
        error: 'userId, productId, and rating are required' 
      });
    }

    // Validar IDs
    if (!isValidId(userId)) {
      return res.status(400).json({ error: 'Invalid userId format' });
    }
    if (!isValidId(productId)) {
      return res.status(400).json({ error: 'Invalid productId format' });
    }

    // Validar rating (debe ser 1-5)
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'rating must be a number between 1 and 5' });
    }

    // Validar comment si existe
    if (comment && typeof comment !== 'string') {
      return res.status(400).json({ error: 'comment must be a string' });
    }

    if (comment && comment.length > 500) {
      return res.status(400).json({ error: 'comment must be 500 characters or less' });
    }

    const newReview = {
      userId: new ObjectId(userId),
      productId: new ObjectId(productId),
      rating,
      comment: comment || '',
      createdAt: new Date().toISOString()
    };

    const response = await mongodb.getDatabase().db().collection(collectionName)
      .insertOne(newReview);

    if (response.acknowledged) {
      return res.status(201).json({ 
        message: 'Review created successfully',
        reviewId: response.insertedId 
      });
    }
    
    return res.status(500).json({ error: 'Failed to create review' });
  } catch (err) {
    console.error('createReview error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /reviews/:id - Actualizar una reseña
const updateReview = async (req, res) => {
  try {
    const id = req.params.id;
    if (!isValidId(id)) {
      return res.status(400).json({ error: 'Invalid review ID format' });
    }

    const allowedFields = ['rating', 'comment'];
    const updateDoc = {};
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateDoc[field] = req.body[field];
      }
    });

    // Validar rating si está presente
    if (updateDoc.rating !== undefined) {
      if (typeof updateDoc.rating !== 'number' || updateDoc.rating < 1 || updateDoc.rating > 5) {
        return res.status(400).json({ error: 'rating must be a number between 1 and 5' });
      }
    }

    // Validar comment si está presente
    if (updateDoc.comment !== undefined) {
      if (typeof updateDoc.comment !== 'string') {
        return res.status(400).json({ error: 'comment must be a string' });
      }
      if (updateDoc.comment.length > 500) {
        return res.status(400).json({ error: 'comment must be 500 characters or less' });
      }
    }

    if (Object.keys(updateDoc).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateDoc.updatedAt = new Date().toISOString();

    const response = await mongodb.getDatabase().db().collection(collectionName)
      .updateOne({ _id: new ObjectId(id) }, { $set: updateDoc });

    if (response.matchedCount === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    return res.status(200).json({ 
      message: 'Review updated successfully',
      matchedCount: response.matchedCount,
      modifiedCount: response.modifiedCount 
    });
  } catch (err) {
    console.error('updateReview error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /reviews/:id - Eliminar una reseña
const deleteReview = async (req, res) => {
  try {
    const id = req.params.id;
    if (!isValidId(id)) {
      return res.status(400).json({ error: 'Invalid review ID format' });
    }

    const response = await mongodb.getDatabase().db().collection(collectionName)
      .deleteOne({ _id: new ObjectId(id) });

    if (response.deletedCount === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    return res.status(204).send();
  } catch (err) {
    console.error('deleteReview error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAll,
  getSingle,
  createReview,
  updateReview,
  deleteReview
};