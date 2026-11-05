/* Simulador de inversión inmobiliaria: dividendo, flujo mensual y rentabilidad sobre el precio. */
(function () {
  var S = window.FP_SIM, form = document.getElementById("form-inm");
  if (!form || !S) { return; }
  var el = function (id) { return document.getElementById(id); };
  var P = { uf: 40000 };
  var editados = {};
  S.montosConFormato(form);
  ["inm-pie", "inm-tasa", "inm-plazo", "inm-vacancia", "inm-mantencion", "inm-compra"].forEach(function (id) {
    el(id).addEventListener("input", function () { editados[id] = true; });
  });

  function pct(v) { return S.dec.format(v * 100) + "%"; }

  function actualizar() {
    var precioUf = S.leerDecimal(el("inm-precio"));
    var pie = S.leerDecimal(el("inm-pie")) / 100;
    var tasa = S.leerDecimal(el("inm-tasa"));
    var plazo = S.leerEntero(el("inm-plazo"));
    var arriendo = S.leerMonto(el("inm-arriendo"));
    var gastos = S.leerMonto(el("inm-gastos"));
    var seguros = S.leerMonto(el("inm-seguros"));
    var vacancia = S.leerDecimal(el("inm-vacancia")) / 100;
    var mantencion = S.leerDecimal(el("inm-mantencion")) / 100;
    var compra = S.leerDecimal(el("inm-compra")) / 100;
    var msg = el("inm-mensaje");

    if (!(precioUf >= 100 && precioUf <= 100000)) { S.mensaje(msg, "El precio debe estar entre 100 y 100.000 UF."); return; }
    if (!(pie >= 0 && pie <= 1)) { S.mensaje(msg, "El pie debe estar entre 0% y 100%."); return; }
    if (!(tasa >= 0 && tasa <= 20)) { S.mensaje(msg, "La tasa debe estar entre 0% y 20% anual."); return; }
    if (!(plazo >= 1 && plazo <= 40)) { S.mensaje(msg, "El plazo del crédito debe estar entre 1 y 40 años."); return; }
    if (!(arriendo > 0)) { S.mensaje(msg, "Ingresa el arriendo mensual esperado."); return; }
    if (!(vacancia >= 0 && vacancia < 1) || !(mantencion >= 0 && mantencion <= 0.1) || !(compra >= 0 && compra <= 0.2)) {
      S.mensaje(msg, "Revisa vacancia, mantención y gastos de compra."); return;
    }
    S.mensaje(msg, "");

    var precio = precioUf * P.uf;
    var creditoUf = precioUf * (1 - pie);
    var i = tasa / 100 / 12, n = plazo * 12;
    var dividendoUf = creditoUf === 0 ? 0 : (i === 0 ? creditoUf / n : creditoUf * i / (1 - Math.pow(1 + i, -n)));
    var dividendo = dividendoUf * P.uf;
    var arriendoEf = arriendo * (1 - vacancia);
    var mant = precio * mantencion / 12;
    var operacion = gastos + mant;
    var flujo = arriendoEf - operacion - dividendo - seguros;
    var capital = precio * pie + precio * compra;
    var capBruto = arriendo * 12 / precio;
    var capNeto = (arriendoEf - operacion) * 12 / precio;
    var retornoCapital = capital > 0 ? flujo * 12 / capital : NaN;
    var equilibrio = (dividendo + seguros + operacion) / (1 - vacancia);

    el("inm-flujo").textContent = S.pesos.format(flujo);
    el("inm-flujo").classList.toggle("resultado__cifra--negativa", flujo < 0);
    el("inm-flujo-texto").textContent = flujo >= 0
      ? "El arriendo estimado cubriría los costos y dejaría este saldo cada mes."
      : "El arriendo estimado no alcanzaría a cubrir los costos: tendrías que poner esta diferencia cada mes.";
    el("inm-d-arriendo").textContent = S.pesos.format(arriendoEf);
    el("inm-d-dividendo").textContent = "-" + S.pesos.format(dividendo);
    el("inm-d-seguros").textContent = "-" + S.pesos.format(seguros);
    el("inm-d-gastos").textContent = "-" + S.pesos.format(gastos);
    el("inm-d-mant").textContent = "-" + S.pesos.format(mant);
    el("inm-credito").textContent = S.dec.format(creditoUf) + " UF (" + S.pesos.format(creditoUf * P.uf) + ")";
    el("inm-dividendo-uf").textContent = S.dec.format(dividendoUf) + " UF";
    el("inm-capital").textContent = S.pesos.format(capital);
    el("inm-cap-bruto").textContent = pct(capBruto);
    el("inm-cap-neto").textContent = pct(capNeto);
    el("inm-retorno").textContent = isFinite(retornoCapital) ? pct(retornoCapital) : "No aplica";
    el("inm-equilibrio").textContent = S.pesos.format(equilibrio);
    el("inm-param-texto").textContent = "UF de referencia: " + S.pesos.format(P.uf) + ".";
    el("inm-resultado").hidden = false;
  }

  form.addEventListener("submit", function (e) { e.preventDefault(); actualizar(); });

  S.conParametros(function (v) {
    P.uf = v("uf_valor", P.uf);
    var defectos = {
      "inm-pie": v("inm_pie_defecto", 20), "inm-tasa": v("inm_tasa_defecto", 4.5), "inm-plazo": v("inm_plazo_defecto", 25),
      "inm-vacancia": v("inm_vacancia_defecto", 5), "inm-mantencion": v("inm_mantencion_defecto", 0.5),
      "inm-compra": v("inm_gastos_compra_defecto", 2)
    };
    Object.keys(defectos).forEach(function (id) { if (!editados[id]) { S.ponerDecimal(el(id), defectos[id]); } });
    actualizar();
  });
})();
