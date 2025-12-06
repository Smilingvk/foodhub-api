// routes/products.js
const express = require('express');
const router = express.Router();
const productsController = require('../controllers/productsController');
const { isAuthenticated } = require('../middleware/auth');

// Rutas públicas (cualquiera puede ver productos)
router.get('/', productsController.getAll);
router.get('/:id', productsController.getSingle);

// Rutas protegidas (solo usuarios autenticados pueden modificar)
// En Week 06 cambiaremos isAuthenticated por isAdmin
router.post('/', isAuthenticated, productsController.createProduct);
router.put('/:id', isAuthenticated, productsController.updateProduct);
router.delete('/:id', isAuthenticated, productsController.deleteProduct);

module.exports = router;