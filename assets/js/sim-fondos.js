/* Simulador de fondos mutuos por perfil de riesgo: tres escenarios de rentabilidad constante. */
(function () {
  var S = window.FP_SIM, form = document.getElementById("form-fm");
  if (!form || !S) { return; }
  var el = function (id) { return document.getElementById(id); };
  var perfiles = {
    conservador: { nombre: "Conservador", riesgo: "Riesgo bajo", clave: "fm_cons", desf: 2, base: 4, fav: 5.5 },
    moderado: { nombre: "Moderado", riesgo: "Riesgo medio", clave: "fm_mod", desf: 1, base: 6, fav: 9 },
    agresivo: { nombre: "Agresivo", riesgo: "Riesgo alto", clave: "fm_agr", desf: -1, base: 8, fav: 13 }
  };
  var plazoMax = 40;
  S.montosConFormato(form);

  function actualizar(silencioso) {
    var inicial = S.leerMonto(el("fm-inicial")), aporte = S.leerMonto(el("fm-aporte"));
    var anos = S.leerEntero(el("fm-plazo"));
    var p = perfiles[form.elements["fm-perfil"].value] || perfiles.moderado;
    var msg = silencioso ? S.mudo : el("fm-mensaje");
    if (inicial > 1e11 || aporte > 1e10) { S.mensaje(msg, "Revisa los montos ingresados."); return; }
    if (!(anos >= 1 && anos <= plazoMax)) { S.mensaje(msg, "El plazo debe estar entre 1 y " + plazoMax + " años."); return; }
    if (inicial === 0 && aporte === 0) { S.mensaje(msg, "Ingresa un monto inicial o un aporte mensual."); return; }
    S.mensaje(el("fm-mensaje"), "");

    var esc = [
      { id: "desf", nombre: "Desfavorable", tasa: p.desf, color: "#8AA3BD", punteada: true },
      { id: "base", nombre: "Base", tasa: p.base, color: "#103E6C", grosor: 3.5 },
      { id: "fav", nombre: "Favorable", tasa: p.fav, color: "#D8B65C", punteada: true }
    ];
    var aportado = inicial + aporte * anos * 12;
    esc.forEach(function (e) {
      e.filas = S.proyectar(inicial, aporte, anos, e.tasa);
      e.final = e.filas[e.filas.length - 1].saldo;
      el("fm-" + e.id).textContent = S.pesos.format(e.final);
      el("fm-" + e.id + "-tasa").textContent = S.dec.format(e.tasa) + "% anual";
    });
    el("fm-base-repite").textContent = S.pesos.format(esc[1].final);
    el("fm-perfil-texto").textContent = p.nombre + " · " + p.riesgo;
    el("fm-anos").textContent = anos + (anos === 1 ? " año" : " años");
    el("fm-aportado").textContent = S.pesos.format(aportado);
    el("fm-ganancia").textContent = S.pesos.format(esc[1].final - aportado);
    S.lineas(el("fm-grafico"), esc.map(function (e) {
      return { nombre: e.nombre, color: e.color, punteada: e.punteada, grosor: e.grosor, valores: e.filas.map(function (f) { return f.saldo; }) };
    }), anos, "Saldo estimado por año en tres escenarios");
    el("fm-tabla").innerHTML = esc[1].filas.slice(1).map(function (f, i) {
      return "<tr><td>" + f.ano + "</td><td>" + S.pesos.format(esc[0].filas[i + 1].saldo) + "</td><td>" +
        S.pesos.format(f.saldo) + "</td><td>" + S.pesos.format(esc[2].filas[i + 1].saldo) + "</td></tr>";
    }).join("");
    Array.prototype.forEach.call(document.querySelectorAll(".fm-tasas-texto"), function (n) {
      n.textContent = S.dec.format(p.desf) + "%, " + S.dec.format(p.base) + "% y " + S.dec.format(p.fav) + "%";
    });
    el("fm-resultado").hidden = false;
  }

  form.addEventListener("submit", function (e) { e.preventDefault(); actualizar(); });
  S.enVivo(form, actualizar);
  Array.prototype.forEach.call(form.elements["fm-perfil"], function (r) { r.addEventListener("change", actualizar); });

  S.conParametros(function (v) {
    Object.keys(perfiles).forEach(function (k) {
      var p = perfiles[k];
      p.desf = v(p.clave + "_desf", p.desf);
      p.base = v(p.clave + "_base", p.base);
      p.fav = v(p.clave + "_fav", p.fav);
      var nodo = el("fm-tasas-" + k);
      if (nodo) { nodo.textContent = "Escenario base: " + S.dec.format(p.base) + "% anual"; }
    });
    plazoMax = v("fm_plazo_max", plazoMax);
    actualizar();
  });
})();
