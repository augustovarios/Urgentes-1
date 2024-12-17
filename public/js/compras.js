let token = localStorage.getItem('token') || sessionStorage.getItem('token');
let role = localStorage.getItem('role') || sessionStorage.getItem('role');
let username = localStorage.getItem('username') || sessionStorage.getItem('username');

if (!token || role !== 'compras') {
  window.location.href = 'index.html';
}

const comprasTicketList = document.getElementById('comprasTicketList');

// Al cargar la página, obtenemos todos los tickets
fetchAllTickets();

async function fetchAllTickets() {
  const res = await fetch('/tickets', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const tickets = await res.json();

  comprasTicketList.innerHTML = '';

  tickets.forEach(ticket => {
    const ticketItem = document.createElement('div');
    ticketItem.classList.add('ticket-item');

    let estadoClass;
    if (ticket.estado === 'resuelto') {
      estadoClass = 'estado-verde';
    } else if (ticket.estado === 'negativo') {
      estadoClass = 'estado-rojo';
    } else {
      estadoClass = 'estado-naranja';
    }

    const fechaObj = new Date(ticket.fecha);
    const fechaFormateada = fechaObj.toLocaleDateString('es-ES');

    const ticketHeader = document.createElement('div');
    ticketHeader.classList.add('ticket-header');
    ticketHeader.innerHTML = `
      <span class="estado-circulo ${estadoClass}"></span>
      <span class="ticket-info">
        FECHA: ${fechaFormateada}, 
        <strong>${ticket.usuario?.username || 'N/A'}</strong>, 
        CHASIS: ${ticket.chasis}, 
        COD/POS: ${ticket.cod_pos}, 
        CANT: ${ticket.cant}, 
        CLIENTE: ${ticket.cliente}, 
        COMENTARIO: ${ticket.comentario || 'N/A'}, 
        ESTADO: ${ticket.estado}
      </span>
    `;

    const ticketDetalle = document.createElement('div');
    ticketDetalle.classList.add('ticket-detalle');
    ticketDetalle.style.display = 'none';

    let detalleContent = '';

    if (ticket.estado === 'pendiente') {
      // Pendiente: Mostrar tabla con datos del urgente + formulario de resolución
      detalleContent = `
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

      ticketDetalle.innerHTML = detalleContent;

      const resolverForm = ticketDetalle.querySelector('.resolver-form');
      resolverForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(resolverForm);
        const payload = {
          resolucion: formData.get('resolucion'),
          codigo: formData.get('codigo'),
          cantidad_resuelta: formData.get('cantidad_resuelta') ? Number(formData.get('cantidad_resuelta')) : undefined,
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
      // Negativo: texto simple
      detalleContent = 'Este ticket no pudo resolverse anteriormente.';
      ticketDetalle.textContent = detalleContent;

    } else if (ticket.estado === 'resuelto') {
      // Resuelto: mostrar la tabla de resolución
      detalleContent = `
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
      ticketDetalle.innerHTML = detalleContent;
    }

    // Acordeón
    ticketHeader.addEventListener('click', () => {
      if (ticketDetalle.style.display === 'none') {
        ticketDetalle.style.display = 'block';
      } else {
        ticketDetalle.style.display = 'none';
      }
    });

    ticketItem.appendChild(ticketHeader);
    ticketItem.appendChild(ticketDetalle);
    comprasTicketList.appendChild(ticketItem);
  });
}
