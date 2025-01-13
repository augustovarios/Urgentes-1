// src/server.js
const express = require('express'); // Importa express
const app = require('./app');
const connectDB = require('./config/db');
const cron = require('node-cron');
const { cleanupOldComments } = require('./controllers/ticketController');
const packageJson = require('../package.json');
const path = require('path'); // Importa path para manejar rutas

const http = require('http');
const { Server } = require('socket.io');

//Función para obtener la versión del servidor
app.get('/version', (req, res) => {
  res.json({ version: packageJson.version });
});

// -- AÑADE: importamos setIO del helper
const { setIO } = require('./helpers/socket');

const PORT = process.env.PORT || 3000;

// Middleware para servir archivos estáticos
app.use(express.static(path.join(__dirname, '../public')));

// Creamos servidor HTTP
const server = http.createServer(app);

// Iniciamos Socket.IO
const io = new Server(server, {
  // Opciones si las necesitas
});

// -- AÑADE: asignamos la instancia real de io
setIO(io);

// Conectamos a la DB y levantamos el server
connectDB(process.env.MONGODB_URI).then(() => {
  server.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
  });
});
