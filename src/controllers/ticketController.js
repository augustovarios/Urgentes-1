// src/controllers/ticketController.js
const Ticket = require('../models/Ticket');

exports.createTicket = async (req, res) => {
  const { chasis, cod_pos, cant, comentario, cliente } = req.body;

  // Solo Vendedor
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
    console.error('createTicket -> Error al crear ticket:', error);
    res.status(500).json({ error: 'Error al crear el ticket' });
  }
};

exports.getMyTickets = async (req, res) => {
  // Solo Vendedor
  if (req.user.role !== 'vendedor') {
    return res.status(403).json({ error: 'Acceso no autorizado' });
  }

  try {
    const tickets = await Ticket.find({ usuario: req.user.id }).sort({ fecha: -1 });
    res.json(tickets);
  } catch (error) {
    console.error('getMyTickets -> Error al obtener tickets:', error);
    res.status(500).json({ error: 'Error al obtener tickets' });
  }
};

exports.getAllTickets = async (req, res) => {
  // Solo Compras
  if (req.user.role !== 'compras') {
    return res.status(403).json({ error: 'Acceso no autorizado' });
  }

  try {
    const tickets = await Ticket.find({})
      .sort({ fecha: -1 })
      .populate('usuario', 'username');
    res.json(tickets);
  } catch (error) {
    console.error('getAllTickets -> Error al obtener todos los tickets:', error);
    res.status(500).json({ error: 'Error al obtener todos los tickets' });
  }
};

exports.resolveTicket = async (req, res) => {
  console.log('resolveTicket -> Datos recibidos:', req.body);
  console.log('resolveTicket -> ID del ticket:', req.params.id);
  console.log('resolveTicket -> Rol del usuario:', req.user.role);

  if (!['compras', 'vendedor'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Acceso no autorizado' });
  }

  const { id } = req.params;
  const { resolucion, codigo, cantidad_resuelta, proveedor, ingreso, comentario_resolucion, avisado, pago, estado } = req.body;

  try {
    const ticket = await Ticket.findById(id);
    if (!ticket) {
      console.log('resolveTicket -> Ticket no encontrado');
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    // Actualizaciones según el rol
    if (req.user.role === 'vendedor') {
      if (avisado !== undefined) ticket.avisado = avisado;
      if (pago !== undefined) ticket.pago = pago;
    }

    if (req.user.role === 'compras') {
      if (resolucion !== undefined) ticket.resolucion = resolucion;
      if (codigo !== undefined) ticket.codigo = codigo;
      if (cantidad_resuelta !== undefined) ticket.cantidad_resuelta = cantidad_resuelta;
      if (proveedor !== undefined) ticket.proveedor = proveedor;
      if (ingreso !== undefined) ticket.ingreso = ingreso;
      if (comentario_resolucion !== undefined) ticket.comentario_resolucion = comentario_resolucion;
      if (estado && ['pendiente', 'resuelto', 'negativo'].includes(estado)) {
        ticket.estado = estado;
      }
    }

    await ticket.save();
    console.log('resolveTicket -> Ticket actualizado:', ticket);
    res.json(ticket);
  } catch (error) {
    console.error('resolveTicket -> Error al actualizar el ticket:', error.message);
    res.status(500).json({ error: 'Error al actualizar el ticket' });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { texto } = req.body;

    if (!texto) {
      return res.status(400).json({ message: 'El texto del comentario es requerido' });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket no encontrado' });
    }

    const nuevoComentario = {
      texto,
      fecha: new Date(),
      usuario: req.user.id,
    };

    ticket.comentarios.push(nuevoComentario);

    // Marcar nuevos comentarios para la otra parte
    if (req.user.role === 'vendedor') {
      ticket.nuevosComentarios.compras = true;
    } else if (req.user.role === 'compras') {
      ticket.nuevosComentarios.vendedor = true;
    }

    await ticket.save();

    const comentarioCompleto = await Ticket.findById(ticket._id)
      .select('comentarios')
      .populate('comentarios.usuario', 'username');

    res.status(201).json(comentarioCompleto.comentarios.pop());
  } catch (error) {
    console.error('Error al agregar comentario:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};





exports.getComments = async (req, res) => {
  try {
    const { id } = req.params;

    // Encuentra el ticket y popula los usuarios en los comentarios
    const ticket = await Ticket.findById(id).populate('comentarios.usuario', 'username');
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    res.json(ticket.comentarios); // Devuelve los comentarios con información del usuario
  } catch (error) {
    console.error('Error al obtener comentarios:', error);
    res.status(500).json({ error: 'Error al obtener comentarios' });
  }
};



// exports.cleanupOldComments = async () => {
//   try {
//     const thirtySecondsAgo = new Date();
//     thirtySecondsAgo.setSeconds(thirtySecondsAgo.getSeconds() - 30);

//     // Buscar todos los tickets y eliminar comentarios más antiguos que 30 segundos
//     const tickets = await Ticket.find({});
//     for (const ticket of tickets) {
//       ticket.comentarios = ticket.comentarios.filter(
//         (comentario) => new Date(comentario.fecha) > thirtySecondsAgo
//       );
//       await ticket.save();
//     }

//     console.log('Comentarios antiguos eliminados correctamente.');
//   } catch (error) {
//     console.error('Error al eliminar comentarios antiguos:', error);
//   }
// };

exports.markCommentsAsRead = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    if (req.user.role === 'vendedor') {
      ticket.nuevosComentarios.vendedor = false;
    } else if (req.user.role === 'compras') {
      ticket.nuevosComentarios.compras = false;
    }

    await ticket.save();
    console.log('Ticket actualizado:', ticket); // Asegúrate de que nuevosComentarios cambia aquí
    res.status(200).json({ message: 'Comentarios marcados como leídos' });
  } catch (error) {
    console.error('Error al marcar comentarios como leídos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

