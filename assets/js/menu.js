/* Menú principal: botón desplegable en pantallas pequeñas. */
(function () {
  document.documentElement.classList.add("con-js");
  var menu = document.querySelector(".menu");
  if (!menu) { return; }
  var boton = menu.querySelector(".menu__boton");
  boton.addEventListener("click", function () {
    var abierto = menu.classList.toggle("menu--abierto");
    boton.setAttribute("aria-expanded", abierto ? "true" : "false");
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && menu.classList.contains("menu--abierto")) {
      menu.classList.remove("menu--abierto");
      boton.setAttribute("aria-expanded", "false");
      boton.focus();
    }
  });
})();
