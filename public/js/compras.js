let token = localStorage.getItem('token') || sessionStorage.getItem('token');
let role = localStorage.getItem('role') || sessionStorage.getItem('role');
let username = localStorage.getItem('username') || sessionStorage.getItem('username');
if (!token || role !== 'compras') {
  window.location.href = 'index.html';
}

let isEditing = false;
let pendingRefresh = false;
let openTicketId = null;

const socket = io();
socket.on('connect', () => {
  console.log('Conectado a Socket.IO como compras');
});

socket.on('nuevoTicket', (ticket) => {
  if (!isEditing) {
    fetchAllTickets();
  } else {
    pendingRefresh = true;
  }
});

socket.on('ticketActualizado', (ticket) => {
  if (!isEditing) {
    fetchAllTickets();
  } else {
    console.log('[Compras] - Modal abierto, posponiendo refresco...');
    pendingRefresh = true;
  }
});

socket.on('nuevoComentario', ({ ticketId, comentario }) => {
  if (openTicketId === ticketId) {
    const commentsList = document.getElementById('commentsList');

    // Verifica si el comentario ya existe en la lista
    const existingComment = Array.from(commentsList.children).some(
      (commentItem) => commentItem.dataset.commentId === comentario._id
    );

    if (!existingComment) {
      addCommentToList(commentsList, comentario);
    }
  } else {
    console.log(`[Socket.IO] - Comentario recibido para otro ticket (ID: ${ticketId})`);
  }
  console.log('Evento nuevoComentario recibido:', ticketId, comentario);

  if (!isEditing) {
    fetchAllTickets();
  } else {
    console.log('[Compras] - Modal abierto, posponiendo refresco...');
    pendingRefresh = true;
  }
});







document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = 'index.html';
    });
  }
});

const filterInput = document.getElementById('filterInput');
const estadoFiltro = document.getElementById('estadoFiltro');
const onlyDotsFiltro = document.getElementById('onlyDotsFiltro');
const dotFilterSection = document.getElementById('dotFilterSection');
let allTickets = [];

filterInput.addEventListener('keyup', applyFilters);
estadoFiltro.addEventListener('change', applyFilters);
onlyDotsFiltro.addEventListener('change', applyFilters);

function showOrHideDotFilter(tickets) {
  const hasAnyDot = tickets.some(ticket => ticket.nuevosComentarios?.compras);
  if (hasAnyDot) {
    dotFilterSection.style.display = 'flex';
  } else {
    dotFilterSection.style.display = 'none';
    onlyDotsFiltro.checked = false;
  }
}

function applyFilters() {
  const searchValue = filterInput.value.toLowerCase();
  const selectedEstado = estadoFiltro.value;
  const showOnlyDots = onlyDotsFiltro.checked;

  let filteredTickets = allTickets.filter(ticket =>
    JSON.stringify(ticket).toLowerCase().includes(searchValue)
  );

  if (selectedEstado) {
    filteredTickets = filteredTickets.filter(ticket => ticket.estado === selectedEstado);
  }

  if (showOnlyDots) {
    filteredTickets = filteredTickets.filter(ticket =>
      ticket.nuevosComentarios?.compras
    );
  }

  renderTickets(filteredTickets);
}

const comprasTicketList = document.getElementById('comprasTicketList');

function renderTickets(tickets) {
  comprasTicketList.innerHTML = `
    <table class="tickets-table">
      <thead>
        <tr>
          <th class="center-col">FECHA</th>
          <th>USUARIO</th>
          <th>CHASIS</th>
          <th>COD/POS</th>
          <th class="center-col">CANT</th>
          <th>CLIENTE</th>
          <th>COMENTARIO</th>
          <th class="center-col">C</th>
          <th class="center-col">ESTADO</th>
        </tr>
      </thead>
      <tbody id="ticketsTbody"></tbody>
    </table>
  `;

  const ticketsTbody = document.getElementById('ticketsTbody');

  tickets.forEach((ticket) => {
    const estadoClass =
      ticket.estado === 'resuelto'
        ? 'estado-verde'
        : ticket.estado === 'negativo'
        ? 'estado-rojo'
        : 'estado-naranja';
    const fechaFormateada = new Date(ticket.fecha).toLocaleDateString('es-ES');

    const row = document.createElement('tr');
    row.classList.add('ticket-header');
    row.innerHTML = `
      <td class="center-col">${fechaFormateada}</td>
      <td>${ticket.usuario?.username || 'N/A'}</td>
      <td>${ticket.chasis || 'N/A'}</td>
      <td>${ticket.cod_pos || 'N/A'}</td>
      <td class="center-col">${ticket.cant || 'N/A'}</td>
      <td>${ticket.cliente || 'N/A'}</td>
      <td>${ticket.comentario || 'N/A'}</td>
      <td class="new-indicator center-col" id="new-${ticket._id}">
        ${
          (role === 'compras' && ticket.nuevosComentarios?.compras) ||
          (role === 'vendedor' && ticket.nuevosComentarios?.vendedor)
            ? '<span class="dot"></span>'
            : ''
        }
      </td>
      <td class="center-col">
        <span class="estado-circulo ${estadoClass}"></span>
        ${ticket.estado}
      </td>
    `;

    row.addEventListener('click', async () => {
      if (openTicketId === ticket._id) {
        closeTicketModal();
        return;
      }

      openTicketId = ticket._id;

      try {
        await fetch(`/tickets/${ticket._id}/mark-read`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        document.getElementById(`new-${ticket._id}`).innerHTML = '';

        const idx = allTickets.findIndex(t => t._id === ticket._id);
        if (idx !== -1) {
          allTickets[idx].nuevosComentarios.compras = false;
        }

        const anyLeft = allTickets.some(t => t.nuevosComentarios?.compras);
        if (!anyLeft && onlyDotsFiltro.checked) {
          onlyDotsFiltro.checked = false;
          applyFilters();
        }
      } catch (error) {
        console.error('Error al marcar ticket como leído:', error);
      }

      updateTicketModal(ticket);
    });

    ticketsTbody.appendChild(row);
  });

  if (openTicketId) {
    const ticket = tickets.find(t => t._id === openTicketId);
    if (ticket) {
      updateTicketModal(ticket);
    } else {
      openTicketId = null;
    }
  }
}

function updateTicketModal(ticket) {
  // Marcamos que tenemos un modal abierto y limpiamos cualquier estado previo
  isEditing = true;
  openTicketId = null;

  const modal = document.getElementById('ticketModal');
  const overlay = document.getElementById('overlay');
  overlay.style.display = 'block';
  modal.style.display = 'block';

  // Limpia el contenido previo del modal
  const commentsList = document.getElementById('commentsList');
  commentsList.innerHTML = ''; // Limpia comentarios previos
  document.getElementById('commentForm').reset(); // Resetea el formulario de comentarios

  // Configurar evento de clic para cerrar el modal al hacer clic fuera de este
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeTicketModal();
    }
  });

  // Asigna el ticket actual
  openTicketId = ticket._id;

  // Actualiza los detalles del modal con la información del ticket
  document.getElementById('modalShortId').textContent = `ID: ${ticket.shortId}`;
  document.getElementById('modalVendedor').textContent = ticket.usuario?.username || 'Desconocido';
  document.getElementById('modalChasis').textContent = ticket.chasis || 'N/A';
  document.getElementById('modalCodPos').textContent = ticket.cod_pos || 'N/A';
  document.getElementById('modalCant').textContent = ticket.cant || 'N/A';
  document.getElementById('modalCliente').textContent = ticket.cliente || 'N/A';
  document.getElementById('modalComentario').textContent = ticket.comentario || 'N/A';

  // Gestionar la sección de resolución según el estado del ticket
  const modalResolucionSection = document.getElementById('modalResolucionSection');
  modalResolucionSection.innerHTML = '';
  if (ticket.estado === 'resuelto' || ticket.estado === 'negativo') {
    modalResolucionSection.innerHTML = `
      <h3>Resolución: 
        <span title="${ticket.estado}" class="circulo-detalle ${ticket.estado}"></span>
      </h3>
      <table class="ticket-table">
        <tr><th>RESOLUCIÓN</th><td>${ticket.resolucion || 'N/A'}</td></tr>
        <tr><th>COD/POS</th><td>${ticket.codigo}</td></tr>
        <tr><th>PROVEEDOR</th><td>${ticket.proveedor || 'N/A'}</td></tr>
        <tr><th>INGRESO</th><td>${ticket.ingreso || 'N/A'}</td></tr>
        <tr><th>COMENTARIO</th><td>${ticket.comentario_resolucion || 'N/A'}</td></tr>
      </table>
    `;
  }

  // Configurar el formulario para resolver tickets si el estado es pendiente
  const modalResolverFormSection = document.getElementById('modalResolverFormSection');
  modalResolverFormSection.innerHTML = '';
  if (ticket.estado === 'pendiente') {
    modalResolverFormSection.innerHTML = `
      <form class="resolver-form" data-ticket-id="${ticket._id}">
        <div class="form-group">
          <label>Resolución</label>
          <input type="text" name="resolucion" required>
        </div>
        <div class="form-group">
          <label>Código</label>
          <input type="text" name="codigo">
        </div>
        <div class="form-group">
          <label>Cantidad Resuelta</label>
          <input type="number" name="cantidad_resuelta">
        </div>
        <div class="form-group">
          <label>Proveedor</label>
          <input type="text" name="proveedor">
        </div>
        <div class="form-group">
          <label>Ingreso</label>
          <input type="text" name="ingreso">
        </div>
        <div class="form-group">
          <label>Comentario de Resolución</label>
          <input type="text" name="comentario_resolucion">
        </div>
        <div class="form-group">
          <label>Estado</label>
          <select name="estado">
            <option value="resuelto">Resuelto</option>
            <option value="negativo">Negativo</option>
          </select>
        </div>
        <button type="submit" class="btn">Guardar Resolución</button>
      </form>
    `;

    const resolverForm = modalResolverFormSection.querySelector('.resolver-form');
    resolverForm.addEventListener('submit', (e) => handleResolverSubmit(e, ticket._id));
  }

  // Configurar el formulario de comentarios
  const commentForm = document.getElementById('commentForm');
  // Elimina cualquier evento previo para evitar duplicados
  const oldForm = commentForm.cloneNode(true);
  commentForm.parentNode.replaceChild(oldForm, commentForm);
  
  // Agrega el evento para manejar el comentario
  oldForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(oldForm);
    const payload = {
      texto: formData.get('comment'),
      fecha: new Date().toISOString(),
    };
    try {
      const res = await fetch(`/tickets/${ticket._id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const newComment = await res.json();
        const commentsList = document.getElementById('commentsList');
        addCommentToList(commentsList, newComment); // Agrega el comentario al listado
        oldForm.reset(); // Limpia el formulario
      } else {
        console.error('Error al agregar comentario:', res.statusText);
      }
    } catch (error) {
      console.error('Error al agregar comentario:', error);
    }
  });
  

  // Carga los comentarios del ticket actual
  fetchComments(ticket._id, commentsList);
}


function closeTicketModal() {
  openTicketId = null; // Limpia el ID del ticket abierto
  const modal = document.getElementById('ticketModal');
  const overlay = document.getElementById('overlay');

  modal.style.display = 'none';
  overlay.style.display = 'none';

  isEditing = false;

  // Limpia el contenido del modal
  const commentsList = document.getElementById('commentsList');
  commentsList.innerHTML = '';

  // Limpia eventos del formulario de comentarios
  const commentForm = document.getElementById('commentForm');
  const newCommentForm = commentForm.cloneNode(true);
  commentForm.parentNode.replaceChild(newCommentForm, commentForm);

  if (pendingRefresh) {
    pendingRefresh = false;
    fetchAllTickets(); // Refresca la lista de tickets si es necesario
  }
}




async function handleResolverSubmit(e, ticketId) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const payload = {
    resolucion: formData.get('resolucion'),
    codigo: formData.get('codigo'),
    cantidad_resuelta: formData.get('cantidad_resuelta')
      ? Number(formData.get('cantidad_resuelta'))
      : undefined,
    proveedor: formData.get('proveedor'),
    ingreso: formData.get('ingreso'),
    comentario_resolucion: formData.get('comentario_resolucion'),
    avisado: formData.get('avisado') === 'true',
    pago: formData.get('pago') === 'true',
    estado: formData.get('estado'),
  };
  try {
    const res = await fetch(`/tickets/${ticketId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      alert('Ticket actualizado con éxito.');
      isEditing = false;
      closeTicketModal();
      fetchAllTickets();
    } else {
      const error = await res.json();
      alert(error.message || 'Error al actualizar el ticket');
    }
  } catch (error) {
    console.error('Error al actualizar el ticket:', error);
  }
}

async function fetchAllTickets() {
  try {
    const res = await fetch('/tickets', {
      headers: { Authorization: `Bearer ${token}` },
    });
    allTickets = await res.json();
    showOrHideDotFilter(allTickets);
    applyFilters();
  } catch (error) {
    console.error('Error al obtener tickets:', error);
  }
}

async function fetchComments(ticketId, commentsList) {
  try {
    const res = await fetch(`/tickets/${ticketId}/comments`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      const comments = await res.json();

      // Limpia comentarios previos y reinicia el registro de IDs renderizados
      commentsList.innerHTML = '';
      renderedCommentIds = new Set(); // Limpia el registro de IDs global

      comments.forEach((comment) => {
        if (!renderedCommentIds.has(comment._id)) {
          addCommentToList(commentsList, comment);
        }
      });
    } else {
      console.error('Error al cargar comentarios');
    }
  } catch (error) {
    console.error('Error al obtener comentarios:', error);
  }
}



let renderedCommentIds = new Set();


function addCommentToList(commentsList, comment) {
  if (renderedCommentIds.has(comment._id)) {
    console.log('Comentario ya renderizado, ignorando:', comment._id);
    return; // Si el comentario ya existe, no lo agregamos
  }

  // Agregar comentario al registro
  renderedCommentIds.add(comment._id);

  const commentItem = document.createElement('li');
  commentItem.dataset.commentId = comment._id;
  const dateFormatted = new Date(comment.fecha).toLocaleString('es-ES');
  const username = comment.usuario?.username || 'Usuario desconocido';

  const currentUserId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
  if (comment.usuario && comment.usuario._id === currentUserId) {
    commentItem.classList.add('self');
  }

  commentItem.innerHTML = `
    <span class="username">${username}</span>
    <span class="date">${dateFormatted}</span>
    <div class="comment-text">${comment.texto}</div>
  `;
  commentsList.appendChild(commentItem);
}



async function handleCommentSubmit(e) {
  e.preventDefault();
  const formData = new FormData(document.getElementById('commentForm'));
  const payload = {
    texto: formData.get('comment'),
    fecha: new Date().toISOString(),
  };

  try {
    const res = await fetch(`/tickets/${openTicketId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      document.getElementById('commentForm').reset(); // Limpia el formulario
      // No llamamos a addCommentToList aquí, dejamos que Socket.IO lo maneje
    } else {
      console.error('Error al agregar comentario:', res.statusText);
    }
  } catch (error) {
    console.error('Error al agregar comentario:', error);
  }
}



fetchAllTickets();
