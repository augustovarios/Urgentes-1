require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const ticketRoutes = require('./routes/ticketRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Rutas
app.use('/auth', authRoutes);
app.use('/tickets', ticketRoutes);
app.use(express.static('public'));

module.exports = app;
