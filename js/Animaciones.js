// Obtener todos los enlaces de navegación
const navLinks = document.querySelectorAll('nav a');

// Obtener la URL actual de la página
const currentUrl = window.location.href;

// Verificar qué enlace coincide con la URL actual y agregar la clase "active"
navLinks.forEach(link => {
  if (link.href === currentUrl) {
    link.classList.add('active');
  }
});