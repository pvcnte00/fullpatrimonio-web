/* Simulador de interés compuesto. El cálculo se hace en el navegador; no se envía ningún dato. */
(function () {
  var form = document.getElementById("form-ic");
  if (!form) { return; }

  var limites = { tasaMin: 0, tasaMax: 15, plazoMax: 50, tasaDefecto: 5 };
  var tasaEditada = false;

  var pesos = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
  var numero = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 });
  var pct = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 2 });

  var el = function (id) { return document.getElementById(id); };
  var campos = { inicial: el("ic-inicial"), aporte: el("ic-aporte"), plazo: el("ic-plazo"), tasa: el("ic-tasa") };
  var mensaje = el("ic-mensaje");

  function leerMonto(input) {
    var digitos = String(input.value).replace(/[^0-9]/g, "");
    return digitos === "" ? 0 : Number(digitos);
  }
  function leerDecimal(input) {
    var texto = String(input.value).trim().replace(/\s/g, "").replace(",", ".");
    return texto === "" ? NaN : Number(texto);
  }
  function formatearMonto(input) {
    var v = leerMonto(input);
    input.value = v ? numero.format(v) : "";
  }

  function calcular(inicial, aporte, anos, tasaAnual) {
    var tasaMensual = Math.pow(1 + tasaAnual / 100, 1 / 12) - 1;
    var saldo = inicial;
    var filas = [{ ano: 0, aportado: inicial, saldo: inicial }];
    for (var mes = 1; mes <= anos * 12; mes++) {
      saldo = saldo * (1 + tasaMensual) + aporte;
      if (mes % 12 === 0) {
        filas.push({ ano: mes / 12, aportado: inicial + aporte * mes, saldo: saldo });
      }
    }
    return filas;
  }

  function compacto(v) {
    if (v >= 1e9) { return "$" + pct.format(v / 1e9) + " mil M"; }
    if (v >= 1e6) { return "$" + pct.format(Math.round(v / 1e5) / 10) + " M"; }
    if (v >= 1e3) { return "$" + numero.format(Math.round(v / 1e3)) + " mil"; }
    return "$" + numero.format(v);
  }

  function dibujarGrafico(filas) {
    var ancho = 600, alto = 260, izq = 64, der = 8, arriba = 12, abajo = 28;
    var datos = filas.slice(1);
    var maximo = Math.max.apply(null, datos.map(function (f) { return f.saldo; })) || 1;
    var bruto = maximo / 4, pot = Math.pow(10, Math.floor(Math.log10(bruto)));
    var tope = [1, 2, 2.5, 5, 10].map(function (k) { return k * pot * 4; }).filter(function (t) { return t >= maximo; })[0];
    var areaW = ancho - izq - der, areaH = alto - arriba - abajo;
    var barra = areaW / datos.length;
    var gap = Math.min(4, barra * 0.2);
    var y = function (v) { return arriba + areaH - (v / tope) * areaH; };
    var svg = ['<svg viewBox="0 0 ' + ancho + ' ' + alto + '" role="img" aria-label="Evolución estimada del saldo por año">'];
    for (var i = 0; i <= 4; i++) {
      var v = (tope / 4) * i, yy = y(v);
      svg.push('<line x1="' + izq + '" x2="' + (ancho - der) + '" y1="' + yy + '" y2="' + yy + '" stroke="#C9D8E6" stroke-width="1"/>');
      svg.push('<text x="' + (izq - 6) + '" y="' + (yy + 4) + '" text-anchor="end" font-size="11" fill="#122B49">' + compacto(v) + '</text>');
    }
    var cadaEtiqueta = Math.ceil(datos.length / 10);
    datos.forEach(function (f, i) {
      var x = izq + i * barra + gap / 2, w = Math.max(1, barra - gap);
      var interes = Math.max(0, f.saldo - f.aportado);
      svg.push('<rect x="' + x + '" y="' + y(f.aportado) + '" width="' + w + '" height="' + (areaH - (y(f.aportado) - arriba)) + '" fill="#103E6C"><title>Año ' + f.ano + ': aportado ' + pesos.format(f.aportado) + '</title></rect>');
      if (interes > 0) {
        svg.push('<rect x="' + x + '" y="' + y(f.saldo) + '" width="' + w + '" height="' + (y(f.aportado) - y(f.saldo)) + '" fill="#D8B65C"><title>Año ' + f.ano + ': intereses ' + pesos.format(interes) + '</title></rect>');
      }
      if ((i + 1) % cadaEtiqueta === 0 || i === 0) {
        svg.push('<text x="' + (x + w / 2) + '" y="' + (alto - 8) + '" text-anchor="middle" font-size="11" fill="#122B49">' + f.ano + '</text>');
      }
    });
    svg.push('</svg>');
    el("ic-grafico").innerHTML = svg.join("");
  }

  function dibujarTabla(filas) {
    var html = filas.slice(1).map(function (f) {
      return "<tr><td>" + f.ano + "</td><td>" + pesos.format(f.aportado) + "</td><td>" +
        pesos.format(Math.max(0, f.saldo - f.aportado)) + "</td><td>" + pesos.format(f.saldo) + "</td></tr>";
    }).join("");
    el("ic-tabla").innerHTML = html;
  }

  var silencio = false;
  function error(texto) {
    if (silencio) { return; }
    mensaje.className = "form__mensaje form__mensaje--error";
    mensaje.textContent = texto;
  }

  function actualizar(silencioso) {
    silencio = !!silencioso;
    var inicial = leerMonto(campos.inicial);
    var aporte = leerMonto(campos.aporte);
    var anos = Number(String(campos.plazo.value).replace(/[^0-9]/g, ""));
    var tasa = leerDecimal(campos.tasa);

    if (inicial > 1e11 || aporte > 1e10) { error("Revisa los montos ingresados."); return; }
    if (!(anos >= 1 && anos <= limites.plazoMax)) { error("El plazo debe estar entre 1 y " + limites.plazoMax + " años."); return; }
    if (!(tasa >= limites.tasaMin && tasa <= limites.tasaMax)) {
      error("La tasa debe estar entre " + pct.format(limites.tasaMin) + "% y " + pct.format(limites.tasaMax) + "% anual."); return;
    }
    if (inicial === 0 && aporte === 0) { error("Ingresa un monto inicial o un aporte mensual."); return; }
    mensaje.className = "form__mensaje";
    mensaje.textContent = "";

    var filas = calcular(inicial, aporte, anos, tasa);
    var final = filas[filas.length - 1];
    var intereses = Math.max(0, final.saldo - final.aportado);

    el("ic-anos").textContent = anos + (anos === 1 ? " año" : " años");
    el("ic-final").textContent = pesos.format(final.saldo);
    el("ic-aportado").textContent = pesos.format(final.aportado);
    el("ic-intereses").textContent = pesos.format(intereses);
    Array.prototype.forEach.call(document.querySelectorAll(".ic-tasa-texto"), function (n) { n.textContent = pct.format(tasa) + "%"; });
    dibujarGrafico(filas);
    dibujarTabla(filas);
    el("ic-resultado").hidden = false;
  }

  campos.inicial.addEventListener("blur", function () { formatearMonto(campos.inicial); });
  campos.aporte.addEventListener("blur", function () { formatearMonto(campos.aporte); });
  campos.tasa.addEventListener("input", function () { tasaEditada = true; });
  form.addEventListener("submit", function (e) { e.preventDefault(); formatearMonto(campos.inicial); formatearMonto(campos.aporte); actualizar(); });
  if (window.FP_SIM) { window.FP_SIM.enVivo(form, actualizar); }

  // Parámetros desde la planilla (o el archivo local). Si no llegan, quedan los valores por defecto.
  (window.FP_PARAMETROS || Promise.resolve({ valores: {} })).then(function (p) {
    var v = p.valores || {};
    if (isFinite(v.ic_tasa_min)) { limites.tasaMin = v.ic_tasa_min; }
    if (isFinite(v.ic_tasa_max)) { limites.tasaMax = v.ic_tasa_max; }
    if (isFinite(v.ic_plazo_max)) { limites.plazoMax = v.ic_plazo_max; }
    if (isFinite(v.ic_tasa_defecto)) { limites.tasaDefecto = v.ic_tasa_defecto; }
    if (!tasaEditada) { campos.tasa.value = String(limites.tasaDefecto).replace(".", ","); }
    el("ic-rango-tasa").textContent = "Entre " + pct.format(limites.tasaMin) + "% y " + pct.format(limites.tasaMax) + "%.";
    if (p.actualizado) { el("ic-actualizado").textContent = "Parámetros actualizados al " + p.actualizado.split("-").reverse().join("-") + "."; }
    actualizar();
  });
})();
