/* Captura de los parámetros de origen del enlace (convención del chat 7).
   Los guarda mientras dura la visita, para que no se pierdan al cambiar de página. */
(function () {
  var CLAVES = ["utm_source", "utm_medium", "utm_campaign", "utm_content"];
  var ALMACEN = "fp_origen";

  function limpiar(valor) {
    return String(valor || "").toLowerCase().trim().replace(/[^a-z0-9_.\-]/g, "").slice(0, 60);
  }

  function leerUrl() {
    var parametros = new URLSearchParams(window.location.search);
    var origen = {};
    var hay = false;
    CLAVES.forEach(function (clave) {
      var valor = limpiar(parametros.get(clave));
      if (valor) { origen[clave] = valor; hay = true; }
    });
    return hay ? origen : null;
  }

  function leerAlmacen() {
    try {
      var texto = sessionStorage.getItem(ALMACEN);
      return texto ? JSON.parse(texto) : null;
    } catch (e) { return null; }
  }

  function guardar(origen) {
    try { sessionStorage.setItem(ALMACEN, JSON.stringify(origen)); } catch (e) { /* sin almacenamiento */ }
  }

  var origen = leerUrl();
  if (origen) { guardar(origen); } else { origen = leerAlmacen(); }
  window.FP_ORIGEN = origen || { utm_source: "directo" };
})();
