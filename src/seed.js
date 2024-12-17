require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');

async function createUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const hashedPassVendedor = await bcrypt.hash('password_vendedor', 10);
    const hashedPassCompras = await bcrypt.hash('password_compras', 10);

    await User.create([
      { username: 'vendedor1', password: hashedPassVendedor, role: 'vendedor' },
      { username: 'compras1', password: hashedPassCompras, role: 'compras' }
    ]);

    console.log('Usuarios creados');
    process.exit(0);

  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

createUsers();
