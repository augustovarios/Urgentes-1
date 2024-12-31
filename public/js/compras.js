let token = localStorage.getItem('token') || sessionStorage.getItem('token');
let role = localStorage.getItem('role') || sessionStorage.getItem('role');
let username = localStorage.getItem('username') || sessionStorage.getItem('username');

// Si no hay token o no es rol "compras", se redirige
if (!token || role !== 'compras') {
  window.location.href = 'index.html';
}

// Logout
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

// Filtros
const filterInput = document.getElementById('filterInput');
const estadoFiltro = document.getElementById('estadoFiltro');
let allTickets = [];

function applyFilters() {
  const searchValue = filterInput.value.toLowerCase();
  const selectedEstado = estadoFiltro.value; // 'pendiente', 'resuelto', 'negativo' o ''

  // Filtro por texto
  let filteredTickets = allTickets.filter(ticket => {
    return JSON.stringify(ticket).toLowerCase().includes(searchValue);
  });

  // Filtro por estado
  if (selectedEstado) {
    filteredTickets = filteredTickets.filter(ticket => ticket.estado === selectedEstado);
  }

  renderTickets(filteredTickets);
}

filterInput.addEventListener('keyup', applyFilters);
estadoFiltro.addEventListener('change', applyFilters);

// Contenedor donde se inyecta la tabla
const comprasTicketList = document.getElementById('comprasTicketList');

// Render de tickets
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

    // Fila principal
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

    // Fila detalle (por defecto oculta)
    const detailRow = document.createElement('tr');
    detailRow.classList.add('ticket-detalle');
    detailRow.style.display = 'none';

    const detailCell = document.createElement('td');
    detailCell.colSpan = 9;

    // Contenido del detalle
    detailCell.innerHTML = `
      <div class="ticket-orig-data">
        <h3>Detalles del Urgente</h3>
        <table class="ticket-table">
          <tr><th>Vendedor</th><td>${ticket.usuario?.username || 'Desconocido'}</td></tr>
          <tr><th>CHASIS</th><td>${ticket.chasis}</td></tr>
          <tr><th>COD/POS</th><td>${ticket.cod_pos}</td></tr>
          <tr><th>CANT</th><td>${ticket.cant}</td></tr>
          <tr><th>CLIENTE</th><td>${ticket.cliente}</td></tr>
          <tr><th>COMENTARIO</th><td>${ticket.comentario || 'N/A'}</td></tr>
        </table>
      </div>
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

    detailRow.appendChild(detailCell);
    ticketsTbody.appendChild(row);
    ticketsTbody.appendChild(detailRow);

    // Listener para resolución (solo si está pendiente)
    if (ticket.estado === 'pendiente') {
      const resolverForm = detailCell.querySelector('.resolver-form');
      resolverForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(resolverForm);

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
          const res = await fetch(`/tickets/${ticket._id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          });

          if (res.ok) {
            alert('Ticket actualizado con éxito.');
            fetchAllTickets();
          } else {
            const error = await res.json();
            alert(error.message || 'Error al actualizar el ticket');
          }
        } catch (error) {
          console.error('Error al actualizar el ticket:', error);
        }
      });
    }

    // Listener para comentarios
    const commentForm = detailCell.querySelector('.comment-form');
    const commentsList = detailCell.querySelector(`#comments-${ticket._id}`);

    commentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(commentForm);
      const payload = { texto: formData.get('comment'), fecha: new Date().toISOString() };

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
          document.getElementById(`new-${ticket._id}`).innerHTML = '<span class="dot"></span>';
          commentForm.reset();
        }
      } catch (error) {
        console.error('Error al agregar comentario:', error);
      }
    });

    // Cargar comentarios previos
    fetchComments(ticket._id, commentsList);

    // =========================================
    //  ÚNICO LISTENER para abrir/cerrar detalle
    // =========================================
    row.addEventListener('click', async () => {
      console.log('Fila clickeada:', ticket._id);  // <--- Debug

      // Preguntar si está cerrado
      const isClosed = detailRow.style.display === 'none';
      
      // Toggle de display
      detailRow.style.display = isClosed ? '' : 'none';
      
      // Agregar/quitar clase .open
      if (isClosed) {
        row.classList.add('open');
        console.log('Se abre y se marca como leído:', ticket._id);

        // Marcar como leído (sólo al abrir)
        try {
          await fetch(`/tickets/${ticket._id}/mark-read`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          document.getElementById(`new-${ticket._id}`).innerHTML = '';
        } catch (error) {
          console.error('Error al marcar ticket como leído:', error);
        }

      } else {
        row.classList.remove('open');
        console.log('Se cierra detalle:', ticket._id);
      }
    });
  });
}

// Obtener todos los tickets
async function fetchAllTickets() {
  try {
    const res = await fetch('/tickets', {
      headers: { Authorization: `Bearer ${token}` },
    });
    allTickets = await res.json();
    console.log('Tickets recibidos:', allTickets);
    renderTickets(allTickets);
  } catch (error) {
    console.error('Error al obtener tickets:', error);
  }
}

// Cargar comentarios de un ticket
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

// Agregar comentario a la lista
function addCommentToList(commentsList, comment) {
  const commentItem = document.createElement('li');
  const dateFormatted = new Date(comment.fecha).toLocaleString('es-ES');
  const username = comment.usuario?.username || 'Usuario desconocido';

  // userId actual
  const currentUserId = localStorage.getItem('userId') || sessionStorage.getItem('userId');

  // Si el comentario es del usuario actual, clase 'self'
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

// Llamada inicial
fetchAllTickets();
