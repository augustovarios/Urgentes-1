const loginForm = document.getElementById('loginForm');
const rememberMeCheckbox = document.getElementById('rememberMe');

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(loginForm);
  const username = formData.get('username');
  const password = formData.get('password');

  const res = await fetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();
  if (res.ok) {
    const storage = rememberMeCheckbox.checked ? localStorage : sessionStorage;
    storage.setItem('token', data.token);
    storage.setItem('role', data.role);
    storage.setItem('username', data.username);

    if (data.role === 'vendedor') {
      window.location.href = 'vendedor.html';
    } else if (data.role === 'compras') {
      window.location.href = 'compras.html';
    } else {
      alert('Rol desconocido');
    }
  } else {
    alert(data.error || 'Error al iniciar sesión');
  }
});
