require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const Ticket = require('./models/Ticket');
const User = require('./models/User');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGO_URI no está definido en .env');
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Conectado a la base de datos');
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error);
    process.exit(1);
  }
};

const generateRandomTickets = async () => {
  const estados = ['pendiente', 'resuelto', 'negativo'];
  const proveedores = ['Proveedor A', 'Proveedor B', 'Proveedor C'];
  const clientes = ['Cliente 1', 'Cliente 2', 'Cliente 3'];
  const comentariosBase = ['Revisar stock', 'Pendiente de aprobación', 'Cliente requiere pronto'];

  const usuarios = await User.find();
  if (usuarios.length === 0) {
    console.error('No hay usuarios en la base de datos. Por favor, crea usuarios primero.');
    return;
  }

  const randomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  const randomItem = (array) => array[Math.floor(Math.random() * array.length)];

  const tickets = [];

  for (let i = 0; i < 50; i++) {
    const usuario = randomItem(usuarios);
    const fecha = randomDate(new Date(2023, 0, 1), new Date());
    const estado = randomItem(estados);

    const ticket = {
      fecha,
      chasis: `CHASIS-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      cod_pos: `POS-${Math.floor(Math.random() * 10000)}`,
      cant: Math.floor(Math.random() * 50) + 1,
      cliente: randomItem(clientes),
      usuario: usuario._id,
      estado,
      resolucion: estado === 'resuelto' ? 'Ticket resuelto satisfactoriamente' : null,
      codigo: `COD-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      cantidad_resuelta: estado === 'resuelto' ? Math.floor(Math.random() * 50) + 1 : null,
      proveedor: randomItem(proveedores),
      ingreso: estado === 'resuelto' ? 'Ingreso validado' : null,
      comentario_resolucion: estado === 'resuelto' ? 'Resolución documentada correctamente' : null,
      avisado: Math.random() > 0.5,
      pago: Math.random() > 0.5,
      comentarios: [
        {
          texto: randomItem(comentariosBase),
          usuario: usuario._id,
        },
      ],
      nuevosComentarios: {
        vendedor: Math.random() > 0.5,
        compras: Math.random() > 0.5,
      },
    };
    tickets.push(ticket);
  }

  try {
    await Ticket.insertMany(tickets);
    console.log('Tickets generados con éxito.');
  } catch (error) {
    console.error('Error al generar tickets:', error);
  }
};

const run = async () => {
  await connectDB();
  await generateRandomTickets();
  mongoose.connection.close();
};

run();
