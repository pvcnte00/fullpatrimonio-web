/* Carga de parámetros de los simuladores.
   Orden: 1) aplicación web de parámetros (config.parametrosEndpoint),
          2) archivo local /assets/data/parametros.json,
          3) valores por defecto de cada calculadora.
   Expone window.FP_PARAMETROS: una promesa que entrega { actualizado, valores, fuente }. */
(function () {
  var config = window.FP_CONFIG || {};

  function conLimite(promesa, ms) {
    return new Promise(function (resolver, rechazar) {
      var t = setTimeout(function () { rechazar(new Error("tiempo agotado")); }, ms);
      promesa.then(function (v) { clearTimeout(t); resolver(v); }, function (e) { clearTimeout(t); rechazar(e); });
    });
  }

  function leer(url, fuente) {
    return conLimite(fetch(url, { cache: "no-store" }), 5000)
      .then(function (r) { if (!r.ok) { throw new Error("HTTP " + r.status); } return r.json(); })
      .then(function (d) {
        if (!d || typeof d.valores !== "object" || d.valores === null) { throw new Error("formato no válido"); }
        var valores = {};
        Object.keys(d.valores).forEach(function (k) {
          var n = Number(d.valores[k]);
          if (isFinite(n)) { valores[k] = n; }
        });
        return { actualizado: String(d.actualizado || ""), valores: valores, fuente: fuente };
      });
  }

  var remota = config.parametrosEndpoint
    ? leer(config.parametrosEndpoint, "planilla")
    : Promise.reject(new Error("sin endpoint"));

  window.FP_PARAMETROS = remota
    .catch(function () { return leer("/assets/data/parametros.json", "local"); })
    .catch(function () { return { actualizado: "", valores: {}, fuente: "defecto" }; });
})();
