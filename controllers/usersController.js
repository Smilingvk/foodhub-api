// controllers/usersController.js
const mongodb = require('../config/database');
const { ObjectId } = require('mongodb');

const collectionName = 'users';

// Validar si es un ObjectId válido
function isValidId(id) {
  return ObjectId.isValid(id);
}

// GET /users - Obtener todos los usuarios
const getAll = async (req, res) => {
  try {
    const cursor = mongodb.getDatabase().db().collection(collectionName).find();
    const users = await cursor.toArray();
    return res.status(200).json(users);
  } catch (err) {
    console.error('getAll error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /users/:id - Obtener un usuario por ID
const getSingle = async (req, res) => {
  try {
    const id = req.params.id;
    if (!isValidId(id)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    const user = await mongodb.getDatabase().db().collection(collectionName)
      .findOne({ _id: new ObjectId(id) });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    return res.status(200).json(user);
  } catch (err) {
    console.error('getSingle error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /users - Crear un nuevo usuario
const createUser = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, address } = req.body;
    
    // Validación de campos requeridos
    if (!firstName || !lastName || !email) {
      return res.status(400).json({ 
        error: 'firstName, lastName, and email are required' 
      });
    }

    // Validación básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const newUser = {
      firstName,
      lastName,
      email,
      phone: phone || '',
      address: address || '',
      createdAt: new Date().toISOString()
    };

    const response = await mongodb.getDatabase().db().collection(collectionName)
      .insertOne(newUser);

    if (response.acknowledged) {
      return res.status(201).json({ 
        message: 'User created successfully',
        userId: response.insertedId 
      });
    }
    
    return res.status(500).json({ error: 'Failed to create user' });
  } catch (err) {
    console.error('createUser error:', err);
    
    // Error de email duplicado (si hay índice único)
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Email already exists' });
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /users/:id - Actualizar un usuario
const updateUser = async (req, res) => {
  try {
    const id = req.params.id;
    if (!isValidId(id)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    const allowedFields = ['firstName', 'lastName', 'email', 'phone', 'address'];
    const updateDoc = {};
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateDoc[field] = req.body[field];
      }
    });

    // Validar email si está presente
    if (updateDoc.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updateDoc.email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
    }

    if (Object.keys(updateDoc).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateDoc.updatedAt = new Date().toISOString();

    const response = await mongodb.getDatabase().db().collection(collectionName)
      .updateOne({ _id: new ObjectId(id) }, { $set: updateDoc });

    if (response.matchedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({ 
      message: 'User updated successfully',
      matchedCount: response.matchedCount,
      modifiedCount: response.modifiedCount 
    });
  } catch (err) {
    console.error('updateUser error:', err);
    
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Email already exists' });
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /users/:id - Eliminar un usuario
const deleteUser = async (req, res) => {
  try {
    const id = req.params.id;
    if (!isValidId(id)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    const response = await mongodb.getDatabase().db().collection(collectionName)
      .deleteOne({ _id: new ObjectId(id) });

    if (response.deletedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(204).send();
  } catch (err) {
    console.error('deleteUser error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAll,
  getSingle,
  createUser,
  updateUser,
  deleteUser
};