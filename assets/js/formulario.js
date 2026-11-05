/* Envío del formulario de diagnóstico a la aplicación web de Apps Script. */
(function () {
  var formulario = document.getElementById("form-diagnostico");
  if (!formulario) { return; }

  var mensaje = document.getElementById("form-mensaje");
  var boton = formulario.querySelector("button[type=submit]");
  var config = window.FP_CONFIG || {};
  var cargadoEn = Date.now();
  var enviando = false;
  var tokenVerificacion = "";
  var idWidget = null;

  function mostrar(tipo, texto) {
    mensaje.className = "form__mensaje form__mensaje--" + tipo;
    mensaje.textContent = texto;
  }

  function mostrarConsentimiento() {
    mensaje.className = "form__mensaje form__mensaje--error";
    mensaje.textContent = "Necesitamos tu autorización para usar tus datos: los usamos solo para contactarte y coordinar tu diagnóstico. ";
    var enlace = document.createElement("a");
    enlace.href = "/privacidad/#por-que-pedimos-tus-datos";
    enlace.target = "_blank";
    enlace.rel = "noopener";
    enlace.textContent = "Ver por qué los pedimos";
    mensaje.appendChild(enlace);
    formulario.elements["consentimiento"].focus();
  }

  // Verificación antirrobots Cloudflare Turnstile. Solo se activa si hay clave pública en config.js.
  function iniciarVerificacion() {
    if (!config.turnstileSitekey) { return; }
    window.fpVerificacionLista = function () {
      idWidget = window.turnstile.render("#verificacion", {
        sitekey: config.turnstileSitekey,
        appearance: "interaction-only",
        language: "es",
        callback: function (token) { tokenVerificacion = token; },
        "expired-callback": function () { tokenVerificacion = ""; },
        "error-callback": function () { tokenVerificacion = ""; }
      });
    };
    var script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=fpVerificacionLista";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }

  function reiniciarVerificacion() {
    tokenVerificacion = "";
    if (idWidget !== null && window.turnstile) { window.turnstile.reset(idWidget); }
  }

  function valor(nombre) {
    var campo = formulario.elements[nombre];
    return campo ? campo.value.trim() : "";
  }

  iniciarVerificacion();

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
    if (!formulario.elements["consentimiento"].checked) { mostrarConsentimiento(); return; }

    if (config.turnstileSitekey && !tokenVerificacion) {
      mostrar("info", "Estamos verificando que eres una persona. Inténtalo de nuevo en unos segundos.");
      return;
    }

    var origen = window.FP_ORIGEN || {};
    var datos = {
      nombre: nombre,
      correo: correo,
      whatsapp: whatsapp,
      consentimiento: true,
      info_correo: formulario.elements["info_correo"].checked,
      sitio_web: valor("sitio_web"),
      tiempo_ms: Date.now() - cargadoEn,
      turnstile: tokenVerificacion,
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
          reiniciarVerificacion();
          enviando = false;
          boton.disabled = false;
        }
      })
      .catch(function () {
        mostrar("error", "No pudimos enviar tu solicitud. Inténtalo de nuevo o escríbenos por WhatsApp.");
        reiniciarVerificacion();
        enviando = false;
        boton.disabled = false;
      });
  });
})();
