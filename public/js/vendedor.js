/*****  Variables de sesión y validaciones de rol  *****/
let token = localStorage.getItem('token') || sessionStorage.getItem('token');
let role = localStorage.getItem('role') || sessionStorage.getItem('role');
let username = localStorage.getItem('username') || sessionStorage.getItem('username');
const usuarioActualId = localStorage.getItem('userId') || sessionStorage.getItem('userId');

if (!token || role !== 'vendedor') {
  window.location.href = 'index.html';
}


// Título dinámico para el formulario de creación
const tituloVendedor = document.getElementById('tituloVendedor');
if (tituloVendedor && username) {
  tituloVendedor.textContent = `${username} - Urgentes`;
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

/*****  Formulario para crear tickets  *****/
const ticketForm = document.getElementById('ticketForm');
ticketForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(ticketForm);
  const payload = {
    chasis: formData.get('chasis'),
    cod_pos: formData.get('cod_pos'),
    cant: Number(formData.get('cant')),
    comentario: formData.get('comentario'),
    cliente: formData.get('cliente'),
  };

  try {
    const res = await fetch('/tickets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (res.ok) {
      showInAppAlert('Ticket creado con éxito.');
      document.getElementById('crearTicketSection').style.display = 'none';
      fetchMyTickets();
    } else {
      showInAppAlert('Ticket creado con éxito.');
      (data.error || 'Error al crear el ticket');
    }
  } catch (error) {
    console.error('Error al crear ticket:', error);
    showInAppAlert('Ticket creado con éxito.');
    ('Error al procesar la solicitud');
  }
});



/*****  Filtros *****/
const filterInput = document.getElementById('filterInput');
const estadoFiltro = document.getElementById('estadoFiltro');
const avisadoFiltro = document.getElementById('avisadoFiltro');
const pagoFiltro = document.getElementById('pagoFiltro');

let allTickets = [];

function applyFilters() {
  const searchValue = filterInput.value.toLowerCase();
  const selectedEstado = estadoFiltro.value;   // 'pendiente', 'resuelto', 'negativo' o ''
  const selectedAvisado = avisadoFiltro.value; // 'true', 'false' o ''
  const selectedPago = pagoFiltro.value;       // 'true', 'false' o ''

  // Filtrar por texto
  let filteredTickets = allTickets.filter(ticket =>
    JSON.stringify(ticket).toLowerCase().includes(searchValue)
  );

  // Filtro por estado
  if (selectedEstado) {
    filteredTickets = filteredTickets.filter(ticket => ticket.estado === selectedEstado);
  }

  // Filtro por avisado
  if (selectedAvisado) {
    const boolAvisado = (selectedAvisado === 'true');
    filteredTickets = filteredTickets.filter(ticket => ticket.avisado === boolAvisado);
  }

  // Filtro por pago
  if (selectedPago) {
    const boolPago = (selectedPago === 'true');
    filteredTickets = filteredTickets.filter(ticket => ticket.pago === boolPago);
  }

  renderTickets(filteredTickets);
}

filterInput.addEventListener('keyup', applyFilters);
estadoFiltro.addEventListener('change', applyFilters);
avisadoFiltro.addEventListener('change', applyFilters);
pagoFiltro.addEventListener('change', applyFilters);

/*****  Contenedor donde se mostrará la tabla  *****/
const ticketList = document.getElementById('ticketList');

/*****  Obtener y renderizar los tickets del Vendedor  *****/
async function fetchMyTickets() {
  try {
    const res = await fetch('/tickets/mis', {
      headers: { Authorization: `Bearer ${token}` },
    });
    allTickets = await res.json();
    applyFilters(); // para que apliquemos los filtros a la data recién cargada
  } catch (error) {
    console.error('Error al obtener tickets:', error);
    alert('Error al cargar los tickets');
  }
}

/*****  Render en tabla con clases específicas de alineación *****/
function renderTickets(tickets) {
  ticketList.innerHTML = `
  <div class="table-container">
    <table class="tickets-table">
      <thead>
        <tr>
          <th class="center-col">FECHA</th>
          <th class="left-col">CHASIS</th>
          <th class="left-col">COD/POS</th>
          <th class="center-col">CANT</th>
          <th class="left-col">CLIENTE</th>
          <th class="left-col">COMENTARIO</th>
          <th class="center-col">NOTIF</th>
          <th class="center-col">AVISADO</th>
          <th class="center-col">PAGO</th>
          <th class="center-col">ESTADO</th>
        </tr>
      </thead>
      <tbody id="ticketsTbody"></tbody>
    </table>
  </div>
  `;

  const ticketsTbody = document.getElementById('ticketsTbody');

  tickets.forEach(ticket => {
    // Determina la clase de estado
    const estadoClass =
      ticket.estado === 'resuelto'
        ? 'estado-verde'
        : ticket.estado === 'negativo'
        ? 'estado-rojo'
        : 'estado-naranja';

    const fechaFormateada = new Date(ticket.fecha).toLocaleDateString('es-ES');

    // "Sí"/"No" con color
    const avisadoValue = ticket.avisado ? 'Sí' : 'No';
    const avisadoClass = ticket.avisado ? 'si-verde' : 'no-rojo';

    const pagoValue = ticket.pago ? 'Sí' : 'No';
    const pagoClass = ticket.pago ? 'si-verde' : 'no-rojo';

    // ==============================
    //  Fila principal
    // ==============================
    const row = document.createElement('tr');
    row.classList.add('ticket-header');
    row.innerHTML = `
      <td class="center-col">${fechaFormateada}</td>
      <td class="left-col">${ticket.chasis || 'N/A'}</td>
      <td class="left-col">${ticket.cod_pos || 'N/A'}</td>
      <td class="center-col">${ticket.cant || 'N/A'}</td>
      <td class="left-col">${ticket.cliente || 'N/A'}</td>
      <td class="left-col">${ticket.comentario || 'N/A'}</td>
      <!-- Notificaciones -->
      <td class="center-col new-indicator" id="new-${ticket._id}">
        ${ticket.nuevosComentarios?.vendedor ? '<span class="dot"></span>' : ''}
      </td>
      <!-- "Sí"/"No" con color -->
      <td class="center-col ${avisadoClass}">${avisadoValue}</td>
      <td class="center-col ${pagoClass}">${pagoValue}</td>
      <td class="center-col">
        <span class="estado-circulo ${estadoClass}"></span>
        ${ticket.estado}
      </td>
    `;
    // ==============================
    //  Fila detalle
    // ==============================
    const detailRow = document.createElement('tr');
    detailRow.classList.add('ticket-detalle');
    detailRow.style.display = 'none';

    const detailCell = document.createElement('td');
    detailCell.colSpan = 10;

    // Lógica para el contenido del detalle
    let detalleContent = '';
    if (ticket.estado === 'negativo' || ticket.estado === 'resuelto') {
      detalleContent = `
        <table class="detalle-table">
          <tr><th>RESOLUCIÓN</th><td>${ticket.resolucion || 'N/A'}</td></tr>
          <tr><th>PROVEEDOR</th><td>${ticket.proveedor || 'N/A'}</td></tr>
          <tr><th>INGRESO</th><td>${ticket.ingreso || 'N/A'}</td></tr>
          <tr><th>COMENTARIO</th><td>${ticket.comentario_resolucion || 'N/A'}</td></tr>
          <tr><th>AVISADO</th><td>${ticket.avisado ? 'Sí' : 'No'}</td></tr>
          <tr><th>PAGO</th><td>${ticket.pago ? 'Sí' : 'No'}</td></tr>
        </table>
      `;
    } else {
      detalleContent = `
        <table class="detalle-table">
          <tr><th>CHASIS</th><td>${ticket.chasis}</td></tr>
          <tr><th>COD/POS</th><td>${ticket.cod_pos}</td></tr>
          <tr><th>CANT</th><td>${ticket.cant}</td></tr>
          <tr><th>CLIENTE</th><td>${ticket.cliente}</td></tr>
          <tr><th>COMENTARIO</th><td>${ticket.comentario || 'N/A'}</td></tr>
          <tr><th>AVISADO</th><td>${ticket.avisado ? 'Sí' : 'No'}</td></tr>
          <tr><th>PAGO</th><td>${ticket.pago ? 'Sí' : 'No'}</td></tr>
        </table>
      `;
    }

    // Form de edición + comentarios
    detalleContent += `
      <form class="edit-form" data-ticket-id="${ticket._id}">
        <div class="form-group">
          <label>¿Avisado?</label>
          <select name="avisado">
            <option value="false" ${!ticket.avisado ? 'selected' : ''}>No</option>
            <option value="true" ${ticket.avisado ? 'selected' : ''}>Sí</option>
          </select>
        </div>
        <div class="form-group">
          <label>¿Pago?</label>
          <select name="pago">
            <option value="false" ${!ticket.pago ? 'selected' : ''}>No</option>
            <option value="true" ${ticket.pago ? 'selected' : ''}>Sí</option>
          </select>
        </div>
        <button type="submit" class="btn">Guardar</button>
      </form>

      <div class="comments-section">
        <h4>Comentarios</h4>
        <ul class="comments-list" id="comments-${ticket._id}"></ul>
        <form class="comment-form" data-ticket-id="${ticket._id}">
          <textarea name="comment" placeholder="Agregar un comentario..." required></textarea>
          <button type="submit" class="btn">Agregar Comentario</button>
        </form>
      </div>
    `;

    detailCell.innerHTML = detalleContent;
    detailRow.appendChild(detailCell);
    ticketsTbody.appendChild(row);
    ticketsTbody.appendChild(detailRow);

    // Editar avisado/pago
    const editForm = detailCell.querySelector('.edit-form');
    editForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(editForm);
      const payload = {
        avisado: formData.get('avisado') === 'true',
        pago: formData.get('pago') === 'true',
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
          fetchMyTickets();
        } else {
          const error = await res.json();
          alert(error.message || 'Error al guardar los cambios');
        }
      } catch (error) {
        console.error('Error al guardar cambios:', error);
        alert('Error al procesar la solicitud');
      }
    });

    // Manejo de comentarios
    const commentForm = detailCell.querySelector('.comment-form');
    const commentsList = detailCell.querySelector(`#comments-${ticket._id}`);

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
          // Mostramos dot de notificación
          document.getElementById(`new-${ticket._id}`).innerHTML = '<span class="dot"></span>';
        } else {
          const error = await res.json();
          alert(error.message || 'Error al agregar comentario');
        }
      } catch (error) {
        console.error('Error al agregar comentario:', error);
        alert('Error al procesar la solicitud');
      }
    });

    // Cargar comentarios previos
    fetchComments(ticket._id, commentsList);

    // Click para abrir/cerrar detalle
    row.addEventListener('click', async () => {
      const isClosed = detailRow.style.display === 'none';
      detailRow.style.display = isClosed ? '' : 'none';

      if (isClosed) {
        row.classList.add('open');
        // Marcar como leído
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
      }
    });
  });
}

/*****  Cargar comentarios  *****/
async function fetchComments(ticketId, commentsList) {
  try {
    const res = await fetch(`/tickets/${ticketId}/comments`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      const comments = await res.json();
      commentsList.innerHTML = '';
      comments.forEach(comment => addCommentToList(commentsList, comment));
    } else {
      console.error('Error al cargar comentarios');
    }
  } catch (error) {
    console.error('Error al obtener comentarios:', error);
  }
}

/*****  Agregar comentario a la lista  *****/
function addCommentToList(commentsList, comment) {
  const commentItem = document.createElement('li');
  if (comment.usuario?._id === usuarioActualId) {
    commentItem.classList.add('self');
  }

  const dateFormatted = new Date(comment.fecha).toLocaleString('es-ES');
  const username = comment.usuario?.username || 'Usuario desconocido';

  commentItem.innerHTML = `
    <span class="username">${username}</span>
    <span class="date">${dateFormatted}</span>
    <div class="comment-text">${comment.texto}</div>
  `;
  commentsList.appendChild(commentItem);
}

const toggleCrearTicket = document.getElementById('toggleCrearTicket');
const crearTicketSection = document.getElementById('crearTicketSection');
if (toggleCrearTicket && crearTicketSection) {
  toggleCrearTicket.addEventListener('click', () => {
    const isHidden = crearTicketSection.style.display === 'none' || crearTicketSection.style.display === '';
    crearTicketSection.style.display = isHidden ? 'block' : 'none';
  });
}

const inAppAlert = document.getElementById('inAppAlert');
const alertMessage = document.getElementById('alertMessage');
const alertCloseBtn = document.getElementById('alertCloseBtn');

function showInAppAlert(message) {
  alertMessage.textContent = message;
  inAppAlert.style.display = 'flex';
}

alertCloseBtn.addEventListener('click', () => {
  inAppAlert.style.display = 'none';
});



fetchMyTickets();
