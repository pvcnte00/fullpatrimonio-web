/* Envío del formulario de diagnóstico a la aplicación web de Apps Script. */
(function () {
  var formulario = document.getElementById("form-diagnostico");
  if (!formulario) { return; }

  var mensaje = document.getElementById("form-mensaje");
  var boton = formulario.querySelector("button[type=submit]");
  var config = window.FP_CONFIG || {};
  var cargadoEn = Date.now();
  var enviando = false;

  function mostrar(tipo, texto) {
    mensaje.className = "form__mensaje form__mensaje--" + tipo;
    mensaje.textContent = texto;
  }

  function valor(nombre) {
    var campo = formulario.elements[nombre];
    return campo ? campo.value.trim() : "";
  }

  if (!config.endpoint) {
    boton.disabled = true;
    mostrar("error", "El formulario aún no está disponible. Escríbenos por WhatsApp.");
  }

  formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();
    if (enviando || !config.endpoint) { return; }

    var nombre = valor("nombre");
    var correo = valor("correo");
    var whatsapp = valor("whatsapp").replace(/[\s().\-]/g, "");

    if (nombre.length < 2) { mostrar("error", "Escribe tu nombre."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo)) { mostrar("error", "Revisa tu correo electrónico."); return; }
    if (!/^\+?[0-9]{8,15}$/.test(whatsapp)) { mostrar("error", "Revisa tu número de WhatsApp, con código de país (por ejemplo +56 9 1234 5678)."); return; }
    if (!formulario.elements["consentimiento"].checked) { mostrar("error", "Debes aceptar el uso de tus datos para continuar."); return; }

    var origen = window.FP_ORIGEN || {};
    var datos = {
      nombre: nombre,
      correo: correo,
      whatsapp: whatsapp,
      consentimiento: true,
      info_correo: formulario.elements["info_correo"].checked,
      sitio_web: valor("sitio_web"),
      tiempo_ms: Date.now() - cargadoEn,
      utm_source: origen.utm_source || "",
      utm_medium: origen.utm_medium || "",
      utm_campaign: origen.utm_campaign || "",
      utm_content: origen.utm_content || ""
    };

    enviando = true;
    boton.disabled = true;
    mostrar("info", "Enviando tu solicitud...");

    // Sin encabezado propio, la solicitud viaja como texto simple y no requiere verificación previa.
    fetch(config.endpoint, { method: "POST", body: JSON.stringify(datos) })
      .then(function (respuesta) { return respuesta.json(); })
      .then(function (resultado) {
        if (resultado && resultado.ok) {
          window.location.href = "/gracias/";
        } else {
          mostrar("error", (resultado && resultado.mensaje) || "No pudimos enviar tu solicitud. Inténtalo de nuevo.");
          enviando = false;
          boton.disabled = false;
        }
      })
      .catch(function () {
        mostrar("error", "No pudimos enviar tu solicitud. Inténtalo de nuevo o escríbenos por WhatsApp.");
        enviando = false;
        boton.disabled = false;
      });
  });
})();
