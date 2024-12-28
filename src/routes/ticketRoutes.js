const express = require('express');
const router = express.Router();
const {
  createTicket,
  getMyTickets,
  getAllTickets,
  resolveTicket,
  addComment,
  getComments,
  markCommentsAsRead,
} = require('../controllers/ticketController');
const { auth } = require('../middleware/authMiddleware');

router.post('/', auth, createTicket);
router.get('/mis', auth, getMyTickets);
router.get('/', auth, getAllTickets);
router.patch('/:id', auth, resolveTicket);
router.post('/:id/comments', auth, addComment);
router.get('/:id/comments', auth, getComments);
router.post('/:id/mark-read', auth, markCommentsAsRead);

module.exports = router;
