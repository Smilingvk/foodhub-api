// routes/orders.js
const express = require('express');
const router = express.Router();
const ordersController = require('../controllers/ordersController');
const { isAuthenticated } = require('../middleware/auth');

// Rutas públicas (cualquiera puede ver órdenes - en producción esto debería ser restringido)
router.get('/', ordersController.getAll);
router.get('/:id', ordersController.getSingle);

// Rutas protegidas (solo usuarios autenticados)
router.post('/', isAuthenticated, ordersController.createOrder);
router.put('/:id', isAuthenticated, ordersController.updateOrder);
router.delete('/:id', isAuthenticated, ordersController.deleteOrder);

module.exports = router;