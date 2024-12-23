(function() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const role = localStorage.getItem('role') || sessionStorage.getItem('role');
  
    // Si hay token y rol "vendedor", redirige a vendedor.html
    if (token && role === 'vendedor') {
      window.location.href = 'vendedor.html';
      return;
    }
  
    // Si hay token y rol "compras", redirige a compras.html
    if (token && role === 'compras') {
      window.location.href = 'compras.html';
      return;
    }
  
    // Si no hay token o el rol no coincide, no hacemos nada
    // y dejamos que el usuario vea el formulario de login
  })();
  