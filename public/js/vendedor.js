let token = localStorage.getItem('token') || sessionStorage.getItem('token');
let role = localStorage.getItem('role') || sessionStorage.getItem('role');
let username = localStorage.getItem('username') || sessionStorage.getItem('username');
const usuarioActualId = localStorage.getItem('userId') || sessionStorage.getItem('userId');

if (!token || role !== 'vendedor') {
  window.location.href = 'index.html';
}

const tituloVendedor = document.getElementById('tituloVendedor');
if (username) {
  tituloVendedor.textContent = `${username} - Crear Urgente`;
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
const ticketList = document.getElementById('ticketList');

// Crear un nuevo ticket
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
      alert('Ticket creado con éxito.');
      ticketForm.reset();
      fetchMyTickets();
    } else {
      alert(data.error || 'Error al crear el ticket');
    }
  } catch (error) {
    console.error('Error al crear ticket:', error);
    alert('Error al procesar la solicitud');
  }
});

// Obtener y renderizar los tickets
async function fetchMyTickets() {
  try {
    const res = await fetch('/tickets/mis', {
      headers: { Authorization: `Bearer ${token}` },
    });

    const tickets = await res.json();
    renderTickets(tickets);
  } catch (error) {
    console.error('Error al obtener tickets:', error);
    alert('Error al cargar los tickets');
  }
}

function renderTickets(tickets) {
  ticketList.innerHTML = '';

  tickets.forEach((ticket) => {
    const ticketItem = document.createElement('div');
    ticketItem.classList.add('ticket-item');

    // Asignar clase según estado
    const estadoClass =
      ticket.estado === 'resuelto'
        ? 'estado-verde'
        : ticket.estado === 'negativo'
        ? 'estado-rojo'
        : 'estado-naranja';

    const fechaFormateada = new Date(ticket.fecha).toLocaleDateString('es-ES');

    // Encabezado
    const ticketHeader = document.createElement('div');
    ticketHeader.classList.add('ticket-header');
    ticketHeader.innerHTML = `
      <span class="estado-circulo ${estadoClass}"></span>
      <span class="ticket-info">
        FECHA: ${fechaFormateada}, CHASIS: ${ticket.chasis}, COD/POS: ${ticket.cod_pos}, CANT: ${ticket.cant}, CLIENTE: ${ticket.cliente}, ESTADO: ${ticket.estado}
      </span>
    `;

    // Detalles, edición y comentarios
    const ticketDetalle = document.createElement('div');
    ticketDetalle.classList.add('ticket-detalle');
    ticketDetalle.style.display = 'none';

    let detalleContent = '';
    if (ticket.estado === 'negativo' || ticket.estado === 'resuelto') {
    detalleContent = `
      <table class="detalle-table">
         <tr><th>RESOLUCIÓN</th><td>${ticket.resolucion || 'N/A'}</td></tr>
            <tr><th>PROVEEDOR</th><td>${ticket.proveedor || 'N/A'}</td></tr>
            <tr><th>INGRESO</th><td>${ticket.ingreso || 'N/A'}</td></tr>
            <tr><th>COMENTARIO</th><td>${ticket.comentario || 'N/A'}</td></tr>
            <tr><th>AVISADO</th><td>${ticket.avisado ? 'Sí' : 'No'}</td></tr>
            <tr><th>PAGO</th><td>${ticket.pago ? 'Sí' : 'No'}</td></tr>
      </table>

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
    }

    ticketDetalle.innerHTML = detalleContent;

    // Manejar edición de avisado y pago
    const editForm = ticketDetalle.querySelector('.edit-form');
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

    // Manejar comentarios
    const commentForm = ticketDetalle.querySelector('.comment-form');
    const commentsList = ticketDetalle.querySelector(`#comments-${ticket._id}`);

    
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
            Authorization: `Bearer ${token}`, // Envía el token
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

    ticketHeader.addEventListener('click', () => {
      ticketDetalle.style.display =
        ticketDetalle.style.display === 'none' ? 'block' : 'none';
    });

    ticketItem.appendChild(ticketHeader);
    ticketItem.appendChild(ticketDetalle);
    ticketList.appendChild(ticketItem);
  });
}

// Obtener comentarios
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
  commentItem.classList.add('comment-item');

  // Resaltar comentarios del usuario actual
  if (comment.usuario?._id === usuarioActualId) { // Reemplaza con el ID del usuario autenticado
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






// Cargar tickets al inicio
fetchMyTickets();
