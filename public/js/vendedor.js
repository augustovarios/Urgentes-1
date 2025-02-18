let token = localStorage.getItem('token') || sessionStorage.getItem('token');
let role = localStorage.getItem('role') || sessionStorage.getItem('role');
let username = localStorage.getItem('username') || sessionStorage.getItem('username');
const usuarioActualId = localStorage.getItem('userId') || sessionStorage.getItem('userId');

// Nueva variable global para recordar el ticket abierto
let openTicketId = null;

const socket = io();
socket.on('connect', () => {
  console.log('Conectado al servidor Socket.IO');
});
socket.on('nuevoTicket', (ticket) => {
  fetchMyTickets();
});
socket.on('ticketActualizado', (ticket) => {
  fetchMyTickets();
});
socket.on('nuevoComentario', ({ ticketId, comentario }) => {
  fetchMyTickets();
});
socket.on('comentariosLeidos', ({ ticketId, role }) => {
  showOrHideDotFilter(allTickets);
});

if (!token || role !== 'vendedor') {
  window.location.href = 'index.html';
}

const tituloVendedor = document.getElementById('tituloVendedor');
if (tituloVendedor && username) {
  tituloVendedor.textContent = `${username} - Urgentes`;
}

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
      showInAppAlert(data.error || 'Error al crear el ticket');
    }
  } catch (error) {
    console.error('Error al crear ticket:', error);
    showInAppAlert('Error al crear el ticket');
  }
});

const filterInput = document.getElementById('filterInput');
const estadoFiltro = document.getElementById('estadoFiltro');
const avisadoFiltro = document.getElementById('avisadoFiltro');
const pagoFiltro = document.getElementById('pagoFiltro');
const onlyDotsFiltro = document.getElementById('onlyDotsFiltro');
const dotFilterSection = document.getElementById('dotFilterSection');

let allTickets = [];

function showOrHideDotFilter(tickets) {
  const hasAnyDot = tickets.some(ticket => ticket.nuevosComentarios?.vendedor);
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
  const selectedAvisado = avisadoFiltro.value;
  const selectedPago = pagoFiltro.value;
  const showOnlyDots = onlyDotsFiltro.checked;

  let filteredTickets = allTickets.filter(ticket =>
    JSON.stringify(ticket).toLowerCase().includes(searchValue)
  );

  if (selectedEstado) {
    filteredTickets = filteredTickets.filter(ticket => ticket.estado === selectedEstado);
  }
  if (selectedAvisado) {
    const boolAvisado = selectedAvisado === 'true';
    filteredTickets = filteredTickets.filter(ticket => ticket.avisado === boolAvisado);
  }
  if (selectedPago) {
    const boolPago = selectedPago === 'true';
    filteredTickets = filteredTickets.filter(ticket => ticket.pago === boolPago);
  }
  if (showOnlyDots) {
    filteredTickets = filteredTickets.filter(ticket =>
      ticket.nuevosComentarios?.vendedor
    );
  }
  renderTickets(filteredTickets);
}

filterInput.addEventListener('keyup', applyFilters);
estadoFiltro.addEventListener('change', applyFilters);
avisadoFiltro.addEventListener('change', applyFilters);
pagoFiltro.addEventListener('change', applyFilters);
onlyDotsFiltro.addEventListener('change', applyFilters);

const ticketList = document.getElementById('ticketList');

async function fetchMyTickets() {
  try {
    const res = await fetch('/tickets/mis', {
      headers: { Authorization: `Bearer ${token}` },
    });
    allTickets = await res.json();
    showOrHideDotFilter(allTickets);
    applyFilters();
  } catch (error) {
    console.error('Error al obtener tickets:', error);
    alert('Error al cargar los tickets');
  }
}

function renderTickets(tickets) {
  ticketList.innerHTML = `
  <div class="table-container">
    <table class="tickets-table">
      <thead>
        <tr>
          <th class="center-col">FECHA</th>
          <th class="center-col">CHASIS</th>
          <th class="center-col">COD/POS</th>
          <th class="center-col">CANT</th>
          <th class="center-col">CLIENTE</th>
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
    const estadoClass =
      ticket.estado === 'resuelto'
        ? 'estado-verde'
        : ticket.estado === 'negativo'
        ? 'estado-rojo'
        : 'estado-naranja';

    const fechaFormateada = new Date(ticket.fecha).toLocaleDateString('es-ES');
    const avisadoValue = ticket.avisado ? 'Sí' : 'No';
    const avisadoClass = ticket.avisado ? 'si-verde' : 'no-rojo';
    const pagoValue = ticket.pago ? 'Sí' : 'No';
    const pagoClass = ticket.pago ? 'si-verde' : 'no-rojo';

    const row = document.createElement('tr');
    row.classList.add('ticket-header');
    row.innerHTML = `
      <td class="center-col">${fechaFormateada}</td>
      <td class="center-col">${ticket.chasis || '--'}</td>
      <td class="center-col mayusc">${ticket.cod_pos || '--'}</td>
      <td class="center-col">${ticket.cant || '--'}</td>
      <td class="center-col">${ticket.cliente || '--'}</td>
      <td class="left-col">${ticket.comentario || 'N/A'}</td>
      <td class="center-col new-indicator" id="new-${ticket._id}">
        ${
          ticket.nuevosComentarios?.vendedor &&
          ticket.usuario?._id !== usuarioActualId
            ? '<span class="dot"></span>'
            : ''
        }
      </td>
      <td class="center-col ${avisadoClass}">${avisadoValue}</td>
      <td class="center-col ${pagoClass}">${pagoValue}</td>
      <td class="center-col">
        <span class="estado-circulo ${estadoClass}"></span>
        ${ticket.estado}
      </td>
    `;

    const detailRow = document.createElement('tr');
    detailRow.classList.add('ticket-detalle');

    // Mantén abierto si openTicketId coincide
    if (ticket._id === openTicketId) {
      detailRow.style.display = '';
      row.classList.add('open');
    } else {
      detailRow.style.display = 'none';
    }

    const detailCell = document.createElement('td');
    detailCell.colSpan = 10;

    let detalleContent = '';
    if (ticket.estado === 'negativo' || ticket.estado === 'resuelto') {
      detalleContent = `
        <span class="short-id">ID: ${ticket.shortId}</span>
        <table class="detalle-table">
          <tr><th>RESOLUCIÓN</th><td>${ticket.resolucion || '--'}</td></tr>
          <tr><th>COD/POS</th><td class="mayusc">${ticket.codigo}</td></tr>
          <tr><th>PROVEEDOR</th><td>${ticket.proveedor || '--'}</td></tr>
          <tr><th>INGRESO</th><td>${ticket.ingreso || '--'}</td></tr>
          <tr><th>COMENTARIO</th><td>${ticket.comentario_resolucion || '--'}</td></tr>
          <tr><th>AVISADO</th><td>${ticket.avisado ? 'Sí' : 'No'}</td></tr>
          <tr><th>PAGO</th><td>${ticket.pago ? 'Sí' : 'No'}</td></tr>
        </table>
      `;
    } else {
      detalleContent = `
        <span class="short-id">ID: ${ticket.shortId}</span>
        <table class="detalle-table">
          <tr><th>CHASIS</th><td>${ticket.chasis || '--'}</td></tr>
          <tr><th>COD/POS</th><td class="mayusc">${ticket.cod_pos}</td></tr>
          <tr><th>CANT</th><td>${ticket.cant}</td></tr>
          <tr><th>CLIENTE</th><td>${ticket.cliente}</td></tr>
          <tr><th>COMENTARIO</th><td>${ticket.comentario || '--'}</td></tr>
          <tr><th>AVISADO</th><td>${ticket.avisado ? 'Sí' : 'No'}</td></tr>
          <tr><th>PAGO</th><td>${ticket.pago ? 'Sí' : 'No'}</td></tr>
        </table>
      `;
    }

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
        } else {
          const error = await res.json();
          alert(error.message || 'Error al agregar comentario');
        }
      } catch (error) {
        console.error('Error al agregar comentario:', error);
        alert('Error al procesar la solicitud');
      }
    });

    fetchComments(ticket._id, commentsList);

    row.addEventListener('click', async () => {
      const isClosed = detailRow.style.display === 'none';
      if (isClosed) {
        openTicketId = ticket._id;
        detailRow.style.display = '';
        row.classList.add('open');
        try {
          await fetch(`/tickets/${ticket._id}/mark-read`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          });
          document.getElementById(`new-${ticket._id}`).innerHTML = '';
          const idx = allTickets.findIndex(t => t._id === ticket._id);
          if (idx !== -1) {
            allTickets[idx].nuevosComentarios.vendedor = false;
          }
          const anyLeft = allTickets.some(t => t.nuevosComentarios?.vendedor);
          if (!anyLeft && onlyDotsFiltro.checked) {
            onlyDotsFiltro.checked = false;
            applyFilters();
          }
        } catch (error) {
          console.error('Error al marcar ticket como leído:', error);
        }
      } else {
        openTicketId = null;
        detailRow.style.display = 'none';
        row.classList.remove('open');
      }
    });
  });
}

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
    const isHidden =
      crearTicketSection.style.display === 'none' ||
      crearTicketSection.style.display === '';
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
