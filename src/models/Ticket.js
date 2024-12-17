const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
  fecha: { type: Date, default: Date.now },
  chasis: { type: String, required: true },
  cod_pos: { type: String, required: true },
  cant: { type: Number, required: true },
  comentario: { type: String },
  cliente: { type: String, required: true },
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  estado: { type: String, default: 'pendiente', enum: ['pendiente', 'resuelto', 'negativo'] },
  
  // Campos de resolución
  resolucion: { type: String },
  codigo: { type: String },
  cantidad_resuelta: { type: Number },
  proveedor: { type: String },
  ingreso: { type: String },
  comentario_resolucion: { type: String },
  avisado: { type: Boolean, default: false },
  pago: { type: Boolean, default: false }
});

module.exports = mongoose.model('Ticket', TicketSchema);
