/* Simulador de necesidad de seguro de vida: suma de necesidades menos recursos disponibles. */
(function () {
  var S = window.FP_SIM, form = document.getElementById("form-sv");
  if (!form || !S) { return; }
  var el = function (id) { return document.getElementById(id); };
  var P = { uf: 40000, anosMax: 40 };
  S.montosConFormato(form);

  function actualizar(silencioso) {
    var gastos = S.leerMonto(el("sv-gastos"));
    var anos = S.leerEntero(el("sv-anos"));
    var deudas = S.leerMonto(el("sv-deudas"));
    var educacion = S.leerMonto(el("sv-educacion"));
    var otros = S.leerMonto(el("sv-otros"));
    var ahorros = S.leerMonto(el("sv-ahorros"));
    var seguros = S.leerMonto(el("sv-seguros"));
    var msg = silencioso ? S.mudo : el("sv-mensaje");
    if (!(gastos > 0)) { S.mensaje(msg, "Ingresa los gastos mensuales de tu familia."); return; }
    if (!(anos >= 1 && anos <= P.anosMax)) { S.mensaje(msg, "Los años de apoyo deben estar entre 1 y " + P.anosMax + "."); return; }
    S.mensaje(el("sv-mensaje"), "");

    var sostener = gastos * 12 * anos;
    var necesidades = sostener + deudas + educacion + otros;
    var recursos = ahorros + seguros;
    var brecha = Math.max(0, necesidades - recursos);

    el("sv-brecha").textContent = S.pesos.format(brecha);
    el("sv-brecha-uf").textContent = "Equivale a unas " + S.numero.format(brecha / P.uf) + " UF.";
    el("sv-brecha-texto").textContent = brecha > 0
      ? "Es la diferencia entre lo que tu familia necesitaría y los recursos que ya tiene."
      : "Con lo que indicaste, tus ahorros y seguros actuales cubrirían las necesidades calculadas.";
    el("sv-d-sostener").textContent = S.pesos.format(sostener);
    el("sv-d-sostener-texto").textContent = S.pesos.format(gastos) + " × 12 meses × " + anos + (anos === 1 ? " año" : " años");
    el("sv-d-deudas").textContent = S.pesos.format(deudas);
    el("sv-d-educacion").textContent = S.pesos.format(educacion);
    el("sv-d-otros").textContent = S.pesos.format(otros);
    el("sv-d-necesidades").textContent = S.pesos.format(necesidades);
    el("sv-d-ahorros").textContent = "-" + S.pesos.format(ahorros);
    el("sv-d-seguros").textContent = "-" + S.pesos.format(seguros);
    el("sv-param-texto").textContent = "UF de referencia: " + S.pesos.format(P.uf) + ".";
    el("sv-resultado").hidden = false;
  }

  form.addEventListener("submit", function (e) { e.preventDefault(); actualizar(); });
  S.enVivo(form, actualizar);

  S.conParametros(function (v) {
    P.uf = v("uf_valor", P.uf);
    P.anosMax = v("sv_anos_max", P.anosMax);
    actualizar();
  });
})();
