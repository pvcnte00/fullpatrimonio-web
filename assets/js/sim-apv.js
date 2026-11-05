/* Simulador de APV: compara el beneficio anual del régimen A y del régimen B y proyecta el saldo. */
(function () {
  var S = window.FP_SIM, form = document.getElementById("form-apv");
  if (!form || !S) { return; }
  var el = function (id) { return document.getElementById(id); };

  // Valores de ejemplo; se reemplazan por los de la planilla al cargar.
  var P = {
    uf: 40000, utm: 70000, bonifPct: 15, bonifTopeUtm: 6, topeMensualUf: 50, topeAnualUf: 600,
    tasaMin: 0, tasaMax: 15, tasaDefecto: 5, plazoMax: 50,
    limites: [13.5, 30, 50, 70, 90, 120, 310],
    factores: [0, 4, 8, 13.5, 23, 30.4, 35, 40],
    rebajas: [0, 0.54, 1.74, 4.49, 11.14, 17.8, 23.32, 38.82]
  };
  var tasaEditada = false;
  S.montosConFormato(form);
  el("apv-tasa").addEventListener("input", function () { tasaEditada = true; });

  function tramo(baseMensual) {
    var enUtm = baseMensual / P.utm;
    for (var i = 0; i < P.limites.length; i++) { if (enUtm <= P.limites[i]) { return i; } }
    return P.limites.length;
  }
  function impuesto(baseMensual) {
    if (baseMensual <= 0) { return 0; }
    var i = tramo(baseMensual);
    return Math.max(0, (baseMensual / P.utm) * (P.factores[i] / 100) * P.utm - P.rebajas[i] * P.utm);
  }

  function actualizar(silencioso) {
    var renta = S.leerMonto(el("apv-renta")), aporte = S.leerMonto(el("apv-aporte"));
    var anos = S.leerEntero(el("apv-plazo")), tasa = S.leerDecimal(el("apv-tasa"));
    var msg = silencioso ? S.mudo : el("apv-mensaje");
    if (!(renta > 0 && renta <= 1e9)) { S.mensaje(msg, "Ingresa tu renta líquida imponible mensual."); return; }
    if (!(aporte > 0 && aporte <= 1e9)) { S.mensaje(msg, "Ingresa el aporte mensual que quieres hacer."); return; }
    if (!(anos >= 1 && anos <= P.plazoMax)) { S.mensaje(msg, "Los años hasta tu jubilación deben estar entre 1 y " + P.plazoMax + "."); return; }
    if (!(tasa >= P.tasaMin && tasa <= P.tasaMax)) { S.mensaje(msg, "La rentabilidad debe estar entre " + S.dec.format(P.tasaMin) + "% y " + S.dec.format(P.tasaMax) + "% anual."); return; }
    S.mensaje(el("apv-mensaje"), "");

    // Régimen A: bonificación fiscal sobre lo ahorrado en el año, con tope en UTM.
    var bonifA = Math.min((P.bonifPct / 100) * aporte * 12, P.bonifTopeUtm * P.utm);
    // Régimen B: lo ahorrado se descuenta de la base del impuesto, con topes en UF.
    var aporteB = Math.min(aporte, P.topeMensualUf * P.uf, (P.topeAnualUf * P.uf) / 12);
    var ahorroImpMensual = impuesto(renta) - impuesto(renta - aporteB);
    var beneficioB = ahorroImpMensual * 12;

    var sugerido = beneficioB > bonifA ? "B" : "A";
    var filasA = S.proyectar(0, aporte, anos, tasa, function () { return bonifA; });
    var filasB = S.proyectar(0, aporte, anos, tasa);
    var finalA = filasA[filasA.length - 1], finalB = filasB[filasB.length - 1];

    el("apv-sugerido").textContent = "Régimen " + sugerido;
    el("apv-sugerido-texto").textContent = sugerido === "A"
      ? "Con tu renta y tu aporte, la bonificación del régimen A es mayor que la rebaja de impuesto del régimen B."
      : "Con tu renta y tu aporte, la rebaja de impuesto del régimen B es mayor que la bonificación del régimen A.";
    el("apv-tramo").textContent = S.dec.format(P.factores[tramo(renta)]) + "%";
    el("apv-a-anual").textContent = S.pesos.format(bonifA);
    el("apv-b-anual").textContent = S.pesos.format(beneficioB);
    el("apv-a-saldo").textContent = S.pesos.format(finalA.saldo);
    el("apv-b-saldo").textContent = S.pesos.format(finalB.saldo);
    el("apv-b-acumulado").textContent = S.pesos.format(beneficioB * anos);
    el("apv-aportado").textContent = S.pesos.format(aporte * 12 * anos);
    el("apv-anos").textContent = anos + (anos === 1 ? " año" : " años");
    el("apv-tope-b").hidden = aporteB >= aporte;
    S.lineas(el("apv-grafico"), [
      { nombre: "Régimen A", color: "#D8B65C", valores: filasA.map(function (f) { return f.saldo; }) },
      { nombre: "Régimen B", color: "#103E6C", valores: filasB.map(function (f) { return f.saldo; }) }
    ], anos, "Saldo estimado del APV por año, régimen A y régimen B");

    Array.prototype.forEach.call(document.querySelectorAll(".apv-tasa-texto"), function (n) { n.textContent = S.dec.format(tasa) + "%"; });
    el("apv-param-texto").textContent = "UF de referencia: " + S.pesos.format(P.uf) + ". UTM de referencia: " + S.pesos.format(P.utm) + ".";
    el("apv-resultado").hidden = false;
  }

  form.addEventListener("submit", function (e) { e.preventDefault(); actualizar(); });
  S.enVivo(form, actualizar);

  S.conParametros(function (v) {
    P.uf = v("uf_valor", P.uf); P.utm = v("utm_valor", P.utm);
    P.bonifPct = v("apv_bonif_pct", P.bonifPct); P.bonifTopeUtm = v("apv_bonif_tope_utm", P.bonifTopeUtm);
    P.topeMensualUf = v("apv_b_tope_mensual_uf", P.topeMensualUf); P.topeAnualUf = v("apv_b_tope_anual_uf", P.topeAnualUf);
    P.tasaMin = v("apv_tasa_min", P.tasaMin); P.tasaMax = v("apv_tasa_max", P.tasaMax);
    P.tasaDefecto = v("apv_tasa_defecto", P.tasaDefecto); P.plazoMax = v("apv_plazo_max", P.plazoMax);
    for (var i = 0; i < 8; i++) {
      if (i < 7) { P.limites[i] = v("iu_limite_" + (i + 1), P.limites[i]); }
      P.factores[i] = v("iu_factor_" + (i + 1), P.factores[i]);
      P.rebajas[i] = v("iu_rebaja_" + (i + 1), P.rebajas[i]);
    }
    if (!tasaEditada) { S.ponerDecimal(el("apv-tasa"), P.tasaDefecto); }
    el("apv-bonif-texto").textContent = S.dec.format(P.bonifPct) + "% de lo ahorrado en el año, con tope de " + S.dec.format(P.bonifTopeUtm) + " UTM";
    el("apv-topes-texto").textContent = S.dec.format(P.topeMensualUf) + " UF al mes y " + S.numero.format(P.topeAnualUf) + " UF al año";
    actualizar();
  });
})();
