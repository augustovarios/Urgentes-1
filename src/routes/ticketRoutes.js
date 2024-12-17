const express = require('express');
const router = express.Router();
const { createTicket, getMyTickets, getAllTickets, resolveTicket } = require('../controllers/ticketController');
const { auth } = require('../middleware/authMiddleware');

// Rutas para vendedor
router.post('/', auth, createTicket);
router.get('/mis', auth, getMyTickets);

// Rutas para compras
router.get('/', auth, getAllTickets);
router.patch('/:id', auth, resolveTicket);

module.exports = router;
