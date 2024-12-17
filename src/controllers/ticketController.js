const Ticket = require('../models/Ticket');

exports.createTicket = async (req, res) => {
  const { chasis, cod_pos, cant, comentario, cliente } = req.body;

  if (req.user.role !== 'vendedor') {
    return res.status(403).json({ error: 'Solo un vendedor puede crear tickets' });
  }

  try {
    const ticket = new Ticket({
      chasis,
      cod_pos,
      cant,
      comentario,
      cliente,
      usuario: req.user.id
    });
    await ticket.save();
    res.status(201).json(ticket);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear el ticket' });
  }
};

exports.getMyTickets = async (req, res) => {
  if (req.user.role !== 'vendedor') {
    return res.status(403).json({ error: 'Acceso no autorizado' });
  }

  try {
    const tickets = await Ticket.find({ usuario: req.user.id }).sort({ fecha: -1 });
    res.json(tickets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener tickets' });
  }
};

exports.getAllTickets = async (req, res) => {
  if (req.user.role !== 'compras') {
    return res.status(403).json({ error: 'Acceso no autorizado' });
  }

  try {
    const tickets = await Ticket.find({}).sort({ fecha: -1 }).populate('usuario', 'username');
    res.json(tickets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener todos los tickets' });
  }
};

exports.resolveTicket = async (req, res) => {
  if (req.user.role !== 'compras') {
    return res.status(403).json({ error: 'Acceso no autorizado' });
  }

  const { id } = req.params;
  const { resolucion, codigo, cantidad_resuelta, proveedor, ingreso, comentario_resolucion, avisado, pago, estado } = req.body;

  try {
    const ticket = await Ticket.findById(id);
    if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });

    if (resolucion !== undefined) ticket.resolucion = resolucion;
    if (codigo !== undefined) ticket.codigo = codigo;
    if (cantidad_resuelta !== undefined) ticket.cantidad_resuelta = cantidad_resuelta;
    if (proveedor !== undefined) ticket.proveedor = proveedor;
    if (ingreso !== undefined) ticket.ingreso = ingreso;
    if (comentario_resolucion !== undefined) ticket.comentario_resolucion = comentario_resolucion;
    if (avisado !== undefined) ticket.avisado = avisado;
    if (pago !== undefined) ticket.pago = pago;
    if (estado && ['pendiente', 'resuelto', 'negativo'].includes(estado)) {
      ticket.estado = estado;
    }

    await ticket.save();
    res.json(ticket);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el ticket' });
  }
};
