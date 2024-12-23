let token = localStorage.getItem('token') || sessionStorage.getItem('token');
let role = localStorage.getItem('role') || sessionStorage.getItem('role');
let username = localStorage.getItem('username') || sessionStorage.getItem('username');

// Si no hay token o el rol no es "compras", redirige al login
if (!token || role !== 'compras') {
  window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('username');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('role');
      sessionStorage.removeItem('username');
      window.location.href = 'index.html';
    });
  }
});

const comprasTicketList = document.getElementById('comprasTicketList');
const filterInput = document.getElementById('filterInput');

// Variable global para almacenar todos los tickets
let allTickets = [];

// 1) Esta función crea la tabla en el DOM a partir de una lista de tickets
function renderTickets(tickets) {
  // Construimos la tabla
  comprasTicketList.innerHTML = `
    <table class="tickets-table">
      <thead>
        <tr>
          <th>FECHA</th>
          <th>USUARIO</th>
          <th>CHASIS</th>
          <th>COD/POS</th>
          <th>CANT</th>
          <th>CLIENTE</th>
          <th>COMENTARIO</th>
          <th>ESTADO</th>
        </tr>
      </thead>
      <tbody id="ticketsTbody"></tbody>
    </table>
  `;

  const ticketsTbody = document.getElementById('ticketsTbody');

  tickets.forEach(ticket => {
    // Determinamos la clase de estado
    let estadoClass;
    if (ticket.estado === 'resuelto') {
      estadoClass = 'estado-verde';
    } else if (ticket.estado === 'negativo') {
      estadoClass = 'estado-rojo';
    } else {
      estadoClass = 'estado-naranja';
    }

    // Formateamos la fecha
    const fechaObj = new Date(ticket.fecha);
    const fechaFormateada = fechaObj.toLocaleDateString('es-ES');

    // Creamos la fila principal (cabezal)
    const row = document.createElement('tr');
    row.classList.add('ticket-header');
    row.innerHTML = `
      <td>${fechaFormateada}</td>
      <td>${ticket.usuario?.username || 'N/A'}</td>
      <td>${ticket.chasis || 'N/A'}</td>
      <td>${ticket.cod_pos || 'N/A'}</td>
      <td>${ticket.cant || 'N/A'}</td>
      <td>${ticket.cliente || 'N/A'}</td>
      <td>${ticket.comentario || 'N/A'}</td>
      <td>
        <span class="estado-circulo ${estadoClass}"></span>
        ${ticket.estado}
      </td>
    `;

    // Fila de detalle (acordeón)
    const detailRow = document.createElement('tr');
    detailRow.classList.add('ticket-detalle');
    detailRow.style.display = 'none'; // Oculta por defecto

    const detailCell = document.createElement('td');
    detailCell.colSpan = 8;

    // Construimos el contenido según el estado
    if (ticket.estado === 'pendiente') {
      detailCell.innerHTML = `
        <div class="ticket-orig-data">
          <h3>Detalles del Urgente</h3>
          <table class="ticket-table">
            <tr><th>Vendedor</th><td>${ticket.usuario?.username || 'Desconocido'}</td></tr>
            <tr><th>CHASIS</th><td>${ticket.chasis}</td></tr>
            <tr><th>COD/POS</th><td>${ticket.cod_pos}</td></tr>
            <tr><th>CANT</th><td>${ticket.cant}</td></tr>
            <tr><th>CLIENTE</th><td>${ticket.cliente}</td></tr>
            <tr><th>COMENTARIO</th><td >${ticket.comentario || 'N/A'}</td></tr>
          </table>
        </div>
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
            <label>¿Avisado?</label>
            <select name="avisado">
              <option value="false">No</option>
              <option value="true">Sí</option>
            </select>
          </div>
          <div class="form-group">
            <label>¿Pago?</label>
            <select name="pago">
              <option value="false">No</option>
              <option value="true">Sí</option>
            </select>
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

      // Manejamos el submit de la resolución
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
          estado: formData.get('estado')
        };

        const ticketId = resolverForm.dataset.ticketId;
        const patchRes = await fetch(`/tickets/${ticketId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        const patchData = await patchRes.json();
        if (patchRes.ok) {
          alert('Ticket actualizado con éxito.');
          fetchAllTickets();
        } else {
          alert(patchData.error || 'Error al actualizar el ticket');
        }
      });

    } else if (ticket.estado === 'negativo') {
      detailCell.innerHTML = `
      <table class="detalle-table">
        <tr><th>RESOLUCIÓN</th><td>${ticket.resolucion || 'N/A'}</td></tr>
        <tr><th>CÓDIGO</th><td>${ticket.codigo || 'N/A'}</td></tr>
        <tr><th>CANTIDAD RESUELTA</th><td>${ticket.cantidad_resuelta || 'N/A'}</td></tr>
        <tr><th>PROVEEDOR</th><td>${ticket.proveedor || 'N/A'}</td></tr>
        <tr><th>INGRESO</th><td>${ticket.ingreso || 'N/A'}</td></tr>
        <tr><th>COMENTARIO</th><td>${ticket.comentario_resolucion || 'N/A'}</td></tr>
        <tr><th>AVISADO</th><td>${ticket.avisado ? 'Sí' : 'No'}</td></tr>
        <tr><th>PAGO</th><td>${ticket.pago ? 'Sí' : 'No'}</td></tr>
      </table>
    `;
    } else if (ticket.estado === 'resuelto') {
      detailCell.innerHTML = `
        <table class="detalle-table">
          <tr><th>RESOLUCIÓN</th><td>${ticket.resolucion || 'N/A'}</td></tr>
          <tr><th>CÓDIGO</th><td>${ticket.codigo || 'N/A'}</td></tr>
          <tr><th>CANTIDAD RESUELTA</th><td>${ticket.cantidad_resuelta || 'N/A'}</td></tr>
          <tr><th>PROVEEDOR</th><td>${ticket.proveedor || 'N/A'}</td></tr>
          <tr><th>INGRESO</th><td>${ticket.ingreso || 'N/A'}</td></tr>
          <tr><th>COMENTARIO</th><td>${ticket.comentario_resolucion || 'N/A'}</td></tr>
          <tr><th>AVISADO</th><td>${ticket.avisado ? 'Sí' : 'No'}</td></tr>
          <tr><th>PAGO</th><td>${ticket.pago ? 'Sí' : 'No'}</td></tr>
        </table>
      `;
    }

    detailRow.appendChild(detailCell);

    // Acordeón
    row.addEventListener('click', () => {
      const isClosed = detailRow.style.display === 'none';
      detailRow.style.display = isClosed ? '' : 'none';
    
      // Togglea la clase "acordeon-open"
      row.classList.toggle('acordeon-open', isClosed);
    });
    

    // Insertamos filas en el tbody
    ticketsTbody.appendChild(row);
    ticketsTbody.appendChild(detailRow);
  });
}

// 2) Descargamos (fetch) los tickets y guardamos en allTickets
async function fetchAllTickets() {
  try {
    const res = await fetch('/tickets', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    allTickets = await res.json(); 
    // Llamamos a renderTickets con TODOS los tickets al inicio
    renderTickets(allTickets);
  } catch (error) {
    console.error('Error al obtener tickets:', error);
  }
}

fetchAllTickets();

// 3) Filtro: escuchamos al evento keyup y filtramos en base a allTickets
filterInput.addEventListener('keyup', () => {
  const searchValue = filterInput.value.toLowerCase();

  // Si el filtro está vacío, mostrar todo
  if (!searchValue) {
    renderTickets(allTickets);
    return;
  }

  // Filtramos comparando el valor ingresado con todos los campos del ticket
  const filtered = allTickets.filter(ticket => {
    // Combina todo el ticket en un string y busca el término
    return JSON.stringify(ticket).toLowerCase().includes(searchValue);
  });

  // Volvemos a renderizar, pero solo con los tickets filtrados
  renderTickets(filtered);
});
