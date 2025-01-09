let token = localStorage.getItem('token') || sessionStorage.getItem('token');
let role = localStorage.getItem('role') || sessionStorage.getItem('role');
let username = localStorage.getItem('username') || sessionStorage.getItem('username');
if (!token || role !== 'compras') {
  window.location.href = 'index.html';
}

let overlay = null;
let modalContainer = null;

// Bandera global para saber si hay un modal abierto
let isEditing = false;
// Cacheamos si llegó un evento de socket mientras editábamos
let pendingRefresh = false;

let openTicketId = null;

const socket = io();
socket.on('connect', () => {
  console.log('Conectado a Socket.IO como compras');
});

socket.on('nuevoTicket', (ticket) => {
  console.log('Se creó un ticket nuevo:', ticket);
  if (!isEditing) {
    fetchAllTickets();
  } else {
    console.log('[Compras] - Modal abierto, posponiendo refresco...');
    pendingRefresh = true;
  }
});

socket.on('ticketActualizado', (ticket) => {
  console.log('Ticket actualizado:', ticket);
  if (!isEditing) {
    fetchAllTickets();
  } else {
    console.log('[Compras] - Modal abierto, posponiendo refresco...');
    pendingRefresh = true;
  }
});

socket.on('nuevoComentario', ({ ticketId, comentario }) => {
  console.log('Nuevo comentario en ticket:', ticketId, comentario);
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
      if (overlay || modalContainer) {
        // Si ya hay un modal abierto, lo cerramos primero
        closeTicketModal();
      }
      // Si clickeamos el mismo ticket, cierra, si fuera el caso:
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

      createTicketModal(ticket);
    });

    ticketsTbody.appendChild(row);
  });

  if (openTicketId) {
    const ticket = tickets.find(t => t._id === openTicketId);
    if (ticket) {
      createTicketModal(ticket);
    } else {
      openTicketId = null;
    }
  }
}

function createTicketModal(ticket) {
  // Marcamos que tenemos un modal abierto
  isEditing = true;

  overlay = document.createElement('div');
  overlay.classList.add('overlay');
  document.body.appendChild(overlay);

  modalContainer = document.createElement('div');
  modalContainer.classList.add('ticket-modal');
  document.body.appendChild(modalContainer);

  modalContainer.innerHTML = `
    <h3>Detalles del Urgente</h3>
    <span class="short-id">ID: ${ticket.shortId}</span>
    <table class="ticket-table">
      <tr><th>Vendedor</th><td>${ticket.usuario?.username || 'Desconocido'}</td></tr>
      <tr><th>CHASIS</th><td>${ticket.chasis}</td></tr>
      <tr><th>COD/POS</th><td>${ticket.cod_pos}</td></tr>
      <tr><th>CANT</th><td>${ticket.cant}</td></tr>
      <tr><th>CLIENTE</th><td>${ticket.cliente}</td></tr>
      <tr><th>COMENTARIO</th><td>${ticket.comentario || 'N/A'}</td></tr>
    </table>
    ${
      ticket.estado === 'resuelto' || ticket.estado === 'negativo'
        ? `
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
        `
        : ''
    }
    <div class="comments-section">
      <h4>Comentarios</h4>
      <ul class="comments-list" id="comments-${ticket._id}"></ul>
      <form class="comment-form" data-ticket-id="${ticket._id}">
        <textarea name="comment" placeholder="Agregar un comentario..." required></textarea>
        <button type="submit" class="btn">Agregar Comentario</button>
      </form>
    </div>
    ${
      ticket.estado === 'pendiente'
        ? `
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
        `
        : ''
    }
  `;

  const resolverForm = modalContainer.querySelector('.resolver-form');
  if (resolverForm) {
    // Al hacer clic en el form, ya consideramos que está editando
    resolverForm.addEventListener('click', () => {
      isEditing = true;
    });
    resolverForm.addEventListener('submit', (e) => handleResolverSubmit(e, ticket._id));
  }

  const commentForm = modalContainer.querySelector('.comment-form');
  const commentsList = modalContainer.querySelector(`#comments-${ticket._id}`);
  commentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(commentForm);
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
        addCommentToList(commentsList, newComment);
        commentForm.reset();
      } else {
        console.error('Error al agregar comentario:', res.statusText);
      }
    } catch (error) {
      console.error('Error al agregar comentario:', error);
    }
  });

  fetchComments(ticket._id, commentsList);

  overlay.addEventListener('click', (e) => {
    if (!modalContainer.contains(e.target)) {
      closeTicketModal();
    }
  });
}

function closeTicketModal() {
  openTicketId = null;
  overlay?.remove();
  modalContainer?.remove();

  overlay = null;
  modalContainer = null;

  // Se cierra el modal: ya no estamos editando
  isEditing = false;

  // Si teníamos pendiente un refresco, lo hacemos ahora
  if (pendingRefresh) {
    pendingRefresh = false;
    fetchAllTickets();
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
      // Dejamos de editar al guardar con éxito
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
      commentsList.innerHTML = '';
      comments.forEach((comment) => addCommentToList(commentsList, comment));
    } else {
      console.error('Error al cargar comentarios');
    }
  } catch (error) {
    console.error('Error al obtener comentarios:', error);
  }
}

function addCommentToList(commentsList, comment) {
  const commentItem = document.createElement('li');
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

fetchAllTickets();
