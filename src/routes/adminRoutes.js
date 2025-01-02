// src/routes/adminRoutes.js
const express = require('express');
const router = express.Router();


const { auth } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminMiddleware');


router.get('/tickets', auth, isAdmin);

module.exports = router;
