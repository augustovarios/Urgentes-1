let token = localStorage.getItem('token') || sessionStorage.getItem('token');
let role = localStorage.getItem('role') || sessionStorage.getItem('role');
let username = localStorage.getItem('username') || sessionStorage.getItem('username');

if (!token || role !== 'vendedor') {
  window.location.href = 'index.html';
}


const tituloVendedor = document.getElementById('tituloVendedor');
if (username) {
  tituloVendedor.textContent = `${username} - Crear Urgente`;
} else {
  console.error('No se encontró el nombre de usuario en localStorage');
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

const ticketForm = document.getElementById('ticketForm');
const ticketList = document.getElementById('ticketList');

ticketForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(ticketForm);
  const payload = {
    chasis: formData.get('chasis'),
    cod_pos: formData.get('cod_pos'),
    cant: Number(formData.get('cant')),
    comentario: formData.get('comentario'),
    cliente: formData.get('cliente')
  };

  const res = await fetch('/tickets', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (res.ok) {
    alert('Ticket creado');
    ticketForm.reset();
    fetchMyTickets();
  } else {
    alert(data.error || 'Error al crear ticket');
  }
});

async function fetchMyTickets() {
  const res = await fetch('/tickets/mis', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const tickets = await res.json();

  ticketList.innerHTML = '';

  tickets.forEach(ticket => {
    const ticketItem = document.createElement('div');
    ticketItem.classList.add('ticket-item');

    // Estado -> color
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

    // Encabezado
    const ticketHeader = document.createElement('div');
    ticketHeader.classList.add('ticket-header');
    ticketHeader.innerHTML = `
      <span class="estado-circulo ${estadoClass}"></span>
      <span class="ticket-info">
        FECHA: ${fechaFormateada}, 
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
      detalleContent = 'Este ticket aún no ha sido resuelto.';
    } else if (ticket.estado === 'negativo') {
      detalleContent = 'Este ticket no pudo resolverse.';
    } else if (ticket.estado === 'resuelto') {
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
    }

     ticketDetalle.innerHTML = detalleContent;

    // Toggle acordeón
    ticketHeader.addEventListener('click', () => {
      if (ticketDetalle.style.display === 'none') {
        ticketDetalle.style.display = 'block';
      } else {
        ticketDetalle.style.display = 'none';
      }
    });

    ticketItem.appendChild(ticketHeader);
    ticketItem.appendChild(ticketDetalle);
    ticketList.appendChild(ticketItem);
  });
}

// Obtenemos los tickets al cargar la página
fetchMyTickets();
