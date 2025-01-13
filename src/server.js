// src/server.js
const app = require('./app');
const connectDB = require('./config/db');
const cron = require('node-cron');
const { cleanupOldComments } = require('./controllers/ticketController');
const packageJson = require('../package.json');

const http = require('http');
const { Server } = require('socket.io');

//Función para obtener la versión del servidor
app.get('/version', (req, res) => {
  res.json({ version: packageJson.version });
});

// -- AÑADE: importamos setIO del helper
const { setIO } = require('./helpers/socket');



const PORT = process.env.PORT || 3000;

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
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
  });
}).catch((error) => {
  console.error("Error al iniciar el servidor:", error);
});
