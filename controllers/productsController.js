// controllers/productsController.js
const mongodb = require('../config/database');
const { ObjectId } = require('mongodb');

const collectionName = 'products';

function isValidId(id) {
  return ObjectId.isValid(id);
}

// GET /products - Obtener todos los productos
const getAll = async (req, res) => {
  try {
    const cursor = mongodb.getDatabase().db().collection(collectionName).find();
    const products = await cursor.toArray();
    return res.status(200).json(products);
  } catch (err) {
    console.error('getAll error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /products/:id - Obtener un producto por ID
const getSingle = async (req, res) => {
  try {
    const id = req.params.id;
    if (!isValidId(id)) {
      return res.status(400).json({ error: 'Invalid product ID format' });
    }

    const product = await mongodb.getDatabase().db().collection(collectionName)
      .findOne({ _id: new ObjectId(id) });
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    return res.status(200).json(product);
  } catch (err) {
    console.error('getSingle error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /products - Crear un nuevo producto (admin only)
const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock, image, isAvailable } = req.body;
    
    // Validación de campos requeridos
    if (!name || !description || !price || !category) {
      return res.status(400).json({ 
        error: 'name, description, price, and category are required' 
      });
    }

    // Validar precio
    if (typeof price !== 'number' || price < 0) {
      return res.status(400).json({ error: 'price must be a positive number' });
    }

    // Validar categoría
    const validCategories = ['meals', 'snacks', 'drinks'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ 
        error: 'category must be one of: meals, snacks, drinks' 
      });
    }

    // Validar stock si está presente
    if (stock !== undefined && (typeof stock !== 'number' || stock < 0)) {
      return res.status(400).json({ error: 'stock must be a non-negative number' });
    }

    const newProduct = {
      name,
      description,
      price,
      category,
      stock: stock || 0,
      image: image || '',
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      createdAt: new Date().toISOString()
    };

    const response = await mongodb.getDatabase().db().collection(collectionName)
      .insertOne(newProduct);

    if (response.acknowledged) {
      return res.status(201).json({ 
        message: 'Product created successfully',
        productId: response.insertedId 
      });
    }
    
    return res.status(500).json({ error: 'Failed to create product' });
  } catch (err) {
    console.error('createProduct error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /products/:id - Actualizar un producto (admin only)
const updateProduct = async (req, res) => {
  try {
    const id = req.params.id;
    if (!isValidId(id)) {
      return res.status(400).json({ error: 'Invalid product ID format' });
    }

    const allowedFields = ['name', 'description', 'price', 'category', 'stock', 'image', 'isAvailable'];
    const updateDoc = {};
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateDoc[field] = req.body[field];
      }
    });

    // Validar precio si está presente
    if (updateDoc.price !== undefined && (typeof updateDoc.price !== 'number' || updateDoc.price < 0)) {
      return res.status(400).json({ error: 'price must be a positive number' });
    }

    // Validar stock si está presente
    if (updateDoc.stock !== undefined && (typeof updateDoc.stock !== 'number' || updateDoc.stock < 0)) {
      return res.status(400).json({ error: 'stock must be a non-negative number' });
    }

    // Validar categoría si está presente
    if (updateDoc.category) {
      const validCategories = ['meals', 'snacks', 'drinks'];
      if (!validCategories.includes(updateDoc.category)) {
        return res.status(400).json({ 
          error: 'category must be one of: meals, snacks, drinks' 
        });
      }
    }

    if (Object.keys(updateDoc).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateDoc.updatedAt = new Date().toISOString();

    const response = await mongodb.getDatabase().db().collection(collectionName)
      .updateOne({ _id: new ObjectId(id) }, { $set: updateDoc });

    if (response.matchedCount === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.status(200).json({ 
      message: 'Product updated successfully',
      matchedCount: response.matchedCount,
      modifiedCount: response.modifiedCount 
    });
  } catch (err) {
    console.error('updateProduct error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /products/:id - Eliminar un producto (admin only)
const deleteProduct = async (req, res) => {
  try {
    const id = req.params.id;
    if (!isValidId(id)) {
      return res.status(400).json({ error: 'Invalid product ID format' });
    }

    const response = await mongodb.getDatabase().db().collection(collectionName)
      .deleteOne({ _id: new ObjectId(id) });

    if (response.deletedCount === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.status(204).send();
  } catch (err) {
    console.error('deleteProduct error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAll,
  getSingle,
  createProduct,
  updateProduct,
  deleteProduct
};