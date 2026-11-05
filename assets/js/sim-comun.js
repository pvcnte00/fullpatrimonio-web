/* Funciones comunes de los simuladores. El cálculo se hace en el navegador; no se envía ningún dato. */
(function () {
  var formatoPesos = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
  // Montos negativos como -$1.000 en lugar de $-1.000.
  var pesos = { format: function (v) { var r = Math.round(v); return (r < 0 ? "-" : "") + formatoPesos.format(Math.abs(r)); } };
  var numero = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 });
  var dec = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 2 });

  function leerMonto(input) {
    var d = String(input.value).replace(/[^0-9]/g, "");
    return d === "" ? 0 : Number(d);
  }
  function leerDecimal(input) {
    var t = String(input.value).trim().replace(/\s/g, "");
    if (t.indexOf(",") >= 0) { t = t.replace(/\./g, "").replace(",", "."); }
    else if (/^-?\d{1,3}(\.\d{3})+$/.test(t)) { t = t.replace(/\./g, ""); }   // 3.000 = tres mil
    return t === "" ? NaN : Number(t);
  }
  function leerEntero(input) {
    var d = String(input.value).replace(/[^0-9]/g, "");
    return d === "" ? NaN : Number(d);
  }
  function formatearMonto(input) {
    var v = leerMonto(input);
    input.value = v ? numero.format(v) : "";
  }
  function montosConFormato(form) {
    Array.prototype.forEach.call(form.querySelectorAll("input[data-monto]"), function (i) {
      i.addEventListener("blur", function () { formatearMonto(i); });
    });
  }
  function ponerDecimal(input, v) { input.value = String(v).replace(".", ","); }

  // Proyección mensual con aportes al final de cada mes. extraAnual(ano) suma un monto al cierre de cada año.
  function proyectar(inicial, aporte, anos, tasaAnual, extraAnual) {
    var r = Math.pow(1 + tasaAnual / 100, 1 / 12) - 1;
    var saldo = inicial, aportado = inicial, extra = 0;
    var filas = [{ ano: 0, aportado: inicial, extra: 0, saldo: inicial }];
    for (var mes = 1; mes <= anos * 12; mes++) {
      saldo = saldo * (1 + r) + aporte;
      aportado += aporte;
      if (mes % 12 === 0) {
        if (extraAnual) { var e = extraAnual(mes / 12); saldo += e; extra += e; }
        filas.push({ ano: mes / 12, aportado: aportado, extra: extra, saldo: saldo });
      }
    }
    return filas;
  }

  function compacto(v) {
    var signo = v < 0 ? "-" : "";
    v = Math.abs(v);
    if (v >= 1e9) { return signo + "$" + dec.format(Math.round(v / 1e8) / 10) + " mil M"; }
    if (v >= 1e6) { return signo + "$" + dec.format(Math.round(v / 1e5) / 10) + " M"; }
    if (v >= 1e3) { return signo + "$" + numero.format(Math.round(v / 1e3)) + " mil"; }
    return signo + "$" + numero.format(v);
  }

  function escala(maximo) {
    if (maximo <= 0) { return 1; }
    var paso = Math.pow(10, Math.floor(Math.log10(maximo)));
    return Math.ceil(maximo / paso) * paso;
  }

  function ejes(svg, izq, der, arriba, areaH, ancho, tope, y) {
    for (var i = 0; i <= 4; i++) {
      var v = (tope / 4) * i, yy = y(v);
      svg.push('<line x1="' + izq + '" x2="' + (ancho - der) + '" y1="' + yy + '" y2="' + yy + '" stroke="#C9D8E6" stroke-width="1"/>');
      svg.push('<text x="' + (izq - 6) + '" y="' + (yy + 4) + '" text-anchor="end" font-size="11" fill="#122B49">' + compacto(v) + '</text>');
    }
  }

  // Barras apiladas: capas = [{campo, color, nombre}] sobre las filas de proyectar().
  function barras(contenedor, filas, capas, etiqueta) {
    var ancho = 600, alto = 260, izq = 64, der = 8, arriba = 12, abajo = 28;
    var datos = filas.slice(1);
    var tope = escala(Math.max.apply(null, datos.map(function (f) { return f.total; })));
    var areaW = ancho - izq - der, areaH = alto - arriba - abajo;
    var barra = areaW / datos.length, gap = Math.min(4, barra * 0.2);
    var y = function (v) { return arriba + areaH - (v / tope) * areaH; };
    var svg = ['<svg viewBox="0 0 ' + ancho + ' ' + alto + '" role="img" aria-label="' + etiqueta + '">'];
    ejes(svg, izq, der, arriba, areaH, ancho, tope, y);
    var cada = Math.ceil(datos.length / 10);
    datos.forEach(function (f, i) {
      var x = izq + i * barra + gap / 2, w = Math.max(1, barra - gap), base = 0;
      capas.forEach(function (c) {
        var v = Math.max(0, f[c.campo]);
        if (v > 0) {
          svg.push('<rect x="' + x + '" y="' + y(base + v) + '" width="' + w + '" height="' + (y(base) - y(base + v)) + '" fill="' + c.color + '"><title>Año ' + f.ano + ': ' + c.nombre + ' ' + pesos.format(v) + '</title></rect>');
        }
        base += v;
      });
      if ((i + 1) % cada === 0 || i === 0) {
        svg.push('<text x="' + (x + w / 2) + '" y="' + (alto - 8) + '" text-anchor="middle" font-size="11" fill="#122B49">' + f.ano + '</text>');
      }
    });
    svg.push("</svg>");
    contenedor.innerHTML = svg.join("");
  }

  // Líneas: series = [{nombre, color, valores: [saldo año 0..n]}]
  function lineas(contenedor, series, anos, etiqueta) {
    var ancho = 600, alto = 260, izq = 64, der = 8, arriba = 12, abajo = 28;
    var max = 0;
    series.forEach(function (s) { s.valores.forEach(function (v) { if (v > max) { max = v; } }); });
    var tope = escala(max);
    var areaW = ancho - izq - der, areaH = alto - arriba - abajo;
    var x = function (a) { return izq + (a / anos) * areaW; };
    var y = function (v) { return arriba + areaH - (Math.max(0, v) / tope) * areaH; };
    var svg = ['<svg viewBox="0 0 ' + ancho + ' ' + alto + '" role="img" aria-label="' + etiqueta + '">'];
    ejes(svg, izq, der, arriba, areaH, ancho, tope, y);
    var cada = Math.max(1, Math.ceil(anos / 10));
    for (var a = 0; a <= anos; a += cada) {
      svg.push('<text x="' + x(a) + '" y="' + (alto - 8) + '" text-anchor="middle" font-size="11" fill="#122B49">' + a + '</text>');
    }
    series.forEach(function (s) {
      var pts = s.valores.map(function (v, i) { return x(i).toFixed(1) + "," + y(v).toFixed(1); }).join(" ");
      svg.push('<polyline points="' + pts + '" fill="none" stroke="' + s.color + '" stroke-width="' + (s.grosor || 2.5) + '"' + (s.punteada ? ' stroke-dasharray="6 4"' : "") + '/>');
    });
    svg.push("</svg>");
    contenedor.innerHTML = svg.join("");
  }

  function mensaje(el, texto) {
    el.className = texto ? "form__mensaje form__mensaje--error" : "form__mensaje";
    el.textContent = texto || "";
  }

  function fechaLegible(iso) { return iso ? iso.split("-").reverse().join("-") : ""; }

  // Entrega los parámetros (planilla, archivo local o vacío) a la función indicada.
  function conParametros(fn) {
    (window.FP_PARAMETROS || Promise.resolve({ valores: {} })).then(function (p) {
      var v = p.valores || {};
      fn(function (clave, defecto) { return isFinite(v[clave]) ? v[clave] : defecto; }, p);
    });
  }

  window.FP_SIM = {
    pesos: pesos, numero: numero, dec: dec,
    leerMonto: leerMonto, leerDecimal: leerDecimal, leerEntero: leerEntero,
    formatearMonto: formatearMonto, montosConFormato: montosConFormato, ponerDecimal: ponerDecimal,
    proyectar: proyectar, barras: barras, lineas: lineas, compacto: compacto,
    mensaje: mensaje, fechaLegible: fechaLegible, conParametros: conParametros
  };

  // Fecha de actualización de parámetros, si la página tiene dónde mostrarla.
  conParametros(function (_, p) {
    var nodo = document.getElementById("parametros-fecha");
    if (nodo && p.actualizado) {
      nodo.textContent = "Parámetros de referencia actualizados al " + fechaLegible(p.actualizado) + ".";
    }
  });
})();
