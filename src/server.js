const app = require('./app');
const connectDB = require('./config/db');
const cron = require('node-cron');
const { cleanupOldComments } = require('./controllers/ticketController');

// Programar limpieza de comentarios cada día a la medianoche
cron.schedule('*/30 * * * * *', () => {
  console.log('Ejecutando limpieza de comentarios...');
  cleanupOldComments();
});


const PORT = process.env.PORT || 3000;

connectDB(process.env.MONGODB_URI).then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
  });
});

