// controllers/ordersController.js
const mongodb = require('../config/database');
const { ObjectId } = require('mongodb');

const collectionName = 'orders';

function isValidId(id) {
  return ObjectId.isValid(id);
}

// GET /orders - Obtener todas las órdenes
const getAll = async (req, res) => {
  try {
    const cursor = mongodb.getDatabase().db().collection(collectionName).find();
    const orders = await cursor.toArray();
    return res.status(200).json(orders);
  } catch (err) {
    console.error('getAll error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /orders/:id - Obtener una orden por ID
const getSingle = async (req, res) => {
  try {
    const id = req.params.id;
    if (!isValidId(id)) {
      return res.status(400).json({ error: 'Invalid order ID format' });
    }

    const order = await mongodb.getDatabase().db().collection(collectionName)
      .findOne({ _id: new ObjectId(id) });
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    return res.status(200).json(order);
  } catch (err) {
    console.error('getSingle error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /orders - Crear una nueva orden
const createOrder = async (req, res) => {
  try {
    const { userId, products, totalAmount, deliveryAddress, status } = req.body;
    
    // Validación de campos requeridos
    if (!userId || !products || !totalAmount || !deliveryAddress) {
      return res.status(400).json({ 
        error: 'userId, products, totalAmount, and deliveryAddress are required' 
      });
    }

    // Validar que products sea un array
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'products must be a non-empty array' });
    }

    // Validar totalAmount
    if (typeof totalAmount !== 'number' || totalAmount <= 0) {
      return res.status(400).json({ error: 'totalAmount must be a positive number' });
    }

    // Validar userId format
    if (!isValidId(userId)) {
      return res.status(400).json({ error: 'Invalid userId format' });
    }

    // Validar cada producto
    for (const product of products) {
      if (!product.productId || !product.quantity || !product.price) {
        return res.status(400).json({ 
          error: 'Each product must have productId, quantity, and price' 
        });
      }
      if (!isValidId(product.productId)) {
        return res.status(400).json({ error: 'Invalid productId format in products array' });
      }
      if (typeof product.quantity !== 'number' || product.quantity <= 0) {
        return res.status(400).json({ error: 'Product quantity must be a positive number' });
      }
      if (typeof product.price !== 'number' || product.price <= 0) {
        return res.status(400).json({ error: 'Product price must be a positive number' });
      }
    }

    const newOrder = {
      userId: new ObjectId(userId),
      products: products.map(p => ({
        productId: new ObjectId(p.productId),
        quantity: p.quantity,
        price: p.price,
        name: p.name || ''
      })),
      totalAmount,
      deliveryAddress,
      status: status || 'pending', // pending, confirmed, delivered, cancelled
      orderDate: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    const response = await mongodb.getDatabase().db().collection(collectionName)
      .insertOne(newOrder);

    if (response.acknowledged) {
      return res.status(201).json({ 
        message: 'Order created successfully',
        orderId: response.insertedId 
      });
    }
    
    return res.status(500).json({ error: 'Failed to create order' });
  } catch (err) {
    console.error('createOrder error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /orders/:id - Actualizar una orden
const updateOrder = async (req, res) => {
  try {
    const id = req.params.id;
    if (!isValidId(id)) {
      return res.status(400).json({ error: 'Invalid order ID format' });
    }

    const allowedFields = ['status', 'deliveryAddress', 'totalAmount'];
    const updateDoc = {};
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateDoc[field] = req.body[field];
      }
    });

    // Validar status si está presente
    if (updateDoc.status) {
      const validStatuses = ['pending', 'confirmed', 'delivered', 'cancelled'];
      if (!validStatuses.includes(updateDoc.status)) {
        return res.status(400).json({ 
          error: 'status must be one of: pending, confirmed, delivered, cancelled' 
        });
      }
    }

    // Validar totalAmount si está presente
    if (updateDoc.totalAmount !== undefined && 
        (typeof updateDoc.totalAmount !== 'number' || updateDoc.totalAmount <= 0)) {
      return res.status(400).json({ error: 'totalAmount must be a positive number' });
    }

    if (Object.keys(updateDoc).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateDoc.updatedAt = new Date().toISOString();

    const response = await mongodb.getDatabase().db().collection(collectionName)
      .updateOne({ _id: new ObjectId(id) }, { $set: updateDoc });

    if (response.matchedCount === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    return res.status(200).json({ 
      message: 'Order updated successfully',
      matchedCount: response.matchedCount,
      modifiedCount: response.modifiedCount 
    });
  } catch (err) {
    console.error('updateOrder error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /orders/:id - Eliminar una orden
const deleteOrder = async (req, res) => {
  try {
    const id = req.params.id;
    if (!isValidId(id)) {
      return res.status(400).json({ error: 'Invalid order ID format' });
    }

    const response = await mongodb.getDatabase().db().collection(collectionName)
      .deleteOne({ _id: new ObjectId(id) });

    if (response.deletedCount === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    return res.status(204).send();
  } catch (err) {
    console.error('deleteOrder error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAll,
  getSingle,
  createOrder,
  updateOrder,
  deleteOrder
};