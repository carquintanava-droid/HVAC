// SISTEMA DE CITAS - HVAC CONTROLS AIRE ACONDICIONADO Y AUTOMATIZACIÓN S.A.C.
// Area de aplicación: Servicio al cliente y gestión de programación de servicios tecnicos

// DATOS DE LA EMPRESA
var nombreEmpresa = "HVAC CONTROLS AIRE ACONDICIONADO Y AUTOMATIZACION S.A.C.";
var ruc = "20612825603";

// ESTADO DEL SISTEMA
// Aca estaria uno de nuestros arreglos principales, el de tecnicos, este nos permite saber si un tecnico esta ocupado o no
var tecnicos = [
  { nombre: "Carlos Quintana" },
  { nombre: "Anderson Naveros" },
  { nombre: "Juan Diego Trejo" },
  { nombre: "Tamara Giselle" }
];

var citas = [];

// REGLAS DE NEGOCIO (Nuestras funciones puras)
// Aca Determinamos nuestro orden de atencion osea a menor numero, mayor urgencia esa seria la logica a seguir
function calcularPrioridad(servicio) {
  if (servicio === "Emergencia") return 1;
  if (servicio === "Reparacion") return 2;
  if (servicio === "Instalacion") return 3;
  if (servicio === "Mantenimiento") return 4;
  return 5;
}

// En esta funcion determinaremos la tarifa por hora segun el tipo de servicio que elija el usuario
function calcularTarifaPorHora(servicio) {
  if (servicio === "Emergencia") return 90.0;
  if (servicio === "Reparacion") return 65.0;
  if (servicio === "Instalacion") return 80.0;
  if (servicio === "Mantenimiento") return 45.0;
  return 50.0;
}

// Ahora seguimos con la parte de calculos en este caso seria el descuento individual de una cita según sus propias horas
// Osea que cada cita tiene su propio requisito de descuento
function calcularDescuentoIndividual(horas) {
  var porcentaje;
  var mensaje;

  if (horas >= 8) {
    porcentaje = 20;
    mensaje = "Descuento del 20% por servicio extendido (8+ horas).";
  } else if (horas >= 4) {
    porcentaje = 10;
    mensaje = "Descuento del 10% por servicio de media jornada (4+ horas).";
  } else {
    porcentaje = 0;
    mensaje = "Sin descuento aplicable.";
  }

  return { porcentaje: porcentaje, mensaje: mensaje };
}

// Esta funcion principalmente seria para validar que una fecha en formato "YYYY-MM-DD" no sea anterior al dia actual 
// Un error que tuve antes fue que el usuario podria ingresar una fecha anterior a la de hoy ya con esto se resuelve
function fechaEsValida(fechaStr) {
  if (!fechaStr) return false;

  var hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  var fechaIngresada = new Date(fechaStr + "T00:00:00");
  if (isNaN(fechaIngresada.getTime())) return false;

  return fechaIngresada.getTime() >= hoy.getTime();
}

// Devolveremos la fecha actual del sistema en formato YYYY-MM-DD
function obtenerFechaHoyISO() {
  var hoy = new Date();
  var yyyy = hoy.getFullYear();
  var mm = String(hoy.getMonth() + 1).padStart(2, "0");
  var dd = String(hoy.getDate()).padStart(2, "0");
  return yyyy + "-" + mm + "-" + dd;
}

// GESTION DE CITAS Y TECNICOS

// Para esta funcion registramos una nueva cita con su costo y descuento calculados de forma individual
function agendarCita(cliente, servicio, fecha, horas) {
  var prioridad = calcularPrioridad(servicio);
  var tarifa = calcularTarifaPorHora(servicio);
  var costoSinDescuento = tarifa * horas;
  var descuento = calcularDescuentoIndividual(horas);
  var montoDescuento = costoSinDescuento * (descuento.porcentaje / 100);
  var costoFinal = costoSinDescuento - montoDescuento;

  var nuevaCita = {
    cliente: cliente,
    servicio: servicio,
    fecha: fecha,
    horas: horas,
    prioridad: prioridad,
    tecnico: "Sin asignar",
    estado: "Pendiente",
    costoSinDescuento: costoSinDescuento,
    porcentajeDescuento: descuento.porcentaje,
    montoDescuento: montoDescuento,
    costoFinal: costoFinal,
    mensajeDescuento: descuento.mensaje
  };

  citas.push(nuevaCita);
}

// Un tecnico está ocupado si y solo si existe una cita "Asignada" a su nombre
// No depende de ningun estado guardado manualmente: deberia siempre reflejar la realidad actual
function tecnicoEstaOcupado(nombreTecnico) {
  for (var i = 0; i < citas.length; i++) {
    if (citas[i].tecnico === nombreTecnico && citas[i].estado === "Asignada") {
      return true;
    }
  }
  return false;
}

// Recorre el arreglo de tecnicos y devuelve el primero que esté libre
function buscarTecnicoLibre() {
  for (var i = 0; i < tecnicos.length; i++) {
    if (!tecnicoEstaOcupado(tecnicos[i].nombre)) {
      return tecnicos[i];
    }
  }
  return null;
}

// Ordena las citas pendientes por prioridad (menor número = más urgente)
function ordenarCitasPorPrioridad() {
  citas.sort(function (a, b) {
    return a.prioridad - b.prioridad;
  });
}

// Recorre las citas pendientes/en espera y asigna algun tecnico mientras que este disponible
function procesarCitas() {
  ordenarCitasPorPrioridad();

  var i = 0;
  while (i < citas.length) {
    if (citas[i].estado === "Pendiente" || citas[i].estado === "En espera") {
      var tecnicoLibre = buscarTecnicoLibre();

      if (tecnicoLibre !== null) {
        citas[i].tecnico = tecnicoLibre.nombre;
        citas[i].estado = "Asignada";
      } else {
        citas[i].estado = "En espera";
      }
    }
    i = i + 1;
  }

  mostrarTecnicos();
  mostrarCitas();
}

// Ahora bien con esta funcion se marca una cita como finalizada, liberando automáticamente a nuestro técnico
// (porque tecnicoEstaOcupado ya no la contará al no seguir "Asignada").
function finalizarCita(indice) {
  if (indice < 0 || indice >= citas.length) return;

  citas[indice].estado = "Finalizada";

  mostrarTecnicos();
  mostrarCitas();
}

// PRESENTACION

function mostrarTecnicos() {
  var texto = "";
  for (var i = 0; i < tecnicos.length; i++) {
    var ocupado = tecnicoEstaOcupado(tecnicos[i].nombre);
    texto = texto + tecnicos[i].nombre + " : " + (ocupado ? "Ocupado" : "Disponible") + "\n";
  }
  document.getElementById("tecnicos").innerText = texto;
}

// Esta funcion principalmente es para que construya una tarjeta HTML individual para cada cita.
function construirTarjetaCita(cita, indice) {
  var estadoClase = "estado-" + cita.estado.replace(" ", ".");
  var puedeFinalizar = cita.estado === "Asignada";

  return (
    '<div class="cita-card">' +
      '<div class="cita-card__header">' +
        '<span class="cita-card__numero">Cita #' + (indice + 1) + '</span>' +
        '<span class="badge badge-prioridad-' + cita.prioridad + '">Prioridad ' + cita.prioridad + '</span>' +
      '</div>' +
      '<div class="cita-card__campo"><strong>Cliente:</strong> ' + cita.cliente + '</div>' +
      '<div class="cita-card__campo"><strong>Servicio:</strong> ' + cita.servicio + '</div>' +
      '<div class="cita-card__campo"><strong>Horas:</strong> ' + cita.horas + '</div>' +
      '<div class="cita-card__campo"><strong>Fecha:</strong> ' + cita.fecha + '</div>' +
      '<div class="cita-card__campo"><strong>Técnico:</strong> ' + cita.tecnico + '</div>' +
      '<span class="estado-pill ' + estadoClase + '">' + cita.estado + '</span>' +
      '<div class="cita-card__costos">' +
        '<div class="linea"><span>Costo base</span><span>S/ ' + cita.costoSinDescuento.toFixed(2) + '</span></div>' +
        '<div class="linea"><span>Descuento (' + cita.porcentajeDescuento + '%)</span><span>- S/ ' + cita.montoDescuento.toFixed(2) + '</span></div>' +
        '<div class="linea final"><span>Costo final</span><span>S/ ' + cita.costoFinal.toFixed(2) + '</span></div>' +
      '</div>' +
      '<div class="cita-card__acciones">' +
        '<button onclick="finalizarCita(' + indice + ')" ' + (puedeFinalizar ? "" : "disabled") + '>' +
          (cita.estado === "Finalizada" ? "Servicio finalizado" : "Finalizar servicio") +
        '</button>' +
      '</div>' +
    '</div>'
  );
}

function mostrarCitas() {
  var contenedor = document.getElementById("citasGrid");

  if (citas.length === 0) {
    contenedor.innerHTML = '<p class="vacio">Todavía no hay citas registradas.</p>';
    return;
  }

  var html = "";
  for (var i = 0; i < citas.length; i++) {
    html += construirTarjetaCita(citas[i], i);
  }
  contenedor.innerHTML = html;
}

// Sumaremos los subtotales ya calculados de forma individual para cada cita
function generarReporte() {
  var totalHoras = 0;
  var granCostoSinDescuento = 0;
  var granMontoDescontado = 0;
  var granCostoFinal = 0;
  var citasAsignadas = 0;

  for (var i = 0; i < citas.length; i++) {
    totalHoras += citas[i].horas;
    granCostoSinDescuento += citas[i].costoSinDescuento;
    granMontoDescontado += citas[i].montoDescuento;
    granCostoFinal += citas[i].costoFinal;

    if (citas[i].estado === "Asignada" || citas[i].estado === "Finalizada") {
      citasAsignadas++;
    }
  }

  var texto = "";
  texto += "Total de citas registradas: " + citas.length + "\n";
  texto += "Citas atendidas (asignadas o finalizadas): " + citasAsignadas + "\n";
  texto += "Total de horas programadas: " + totalHoras + "\n";
  texto += "Costo sin descuento (suma de todas las citas): S/ " + granCostoSinDescuento.toFixed(2) + "\n";
  texto += "Monto descontado (suma de descuentos individuales): S/ " + granMontoDescontado.toFixed(2) + "\n";
  texto += "Costo final del dia: S/ " + granCostoFinal.toFixed(2);

  document.getElementById("reporteDia").innerText = texto;
}

// CAPTURA Y VALIDACION DE ENTRADA

function registrarCita() {
  var inputCliente = document.getElementById("cliente");
  var inputHoras = document.getElementById("horas");
  var inputFecha = document.getElementById("fecha");
  var errorFecha = document.getElementById("errorFecha");

  var cliente = inputCliente.value.trim();
  var servicio = document.getElementById("servicio").value;
  var horas = parseFloat(inputHoras.value);
  var fecha = inputFecha.value;

  // Esta condicional nos sirve para mostrar y corregir los errores que llegue a cometer nuestro usuario
  inputFecha.classList.remove("campo-error");
  errorFecha.textContent = "";

  if (cliente === "" || isNaN(horas) || horas <= 0) {
    alert("Por favor completa el cliente y una cantidad de horas valida (mayor a 0).");
    return;
  }

  if (!fechaEsValida(fecha)) {
    inputFecha.classList.add("campo-error");
    errorFecha.textContent = "La fecha no puede ser anterior al dia de hoy.";
    return;
  }

  agendarCita(cliente, servicio, fecha, horas);
  mostrarCitas();

  inputCliente.value = "";
  inputHoras.value = "";
  inputFecha.value = "";
}

// INICIALIZACION

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("fecha").setAttribute("min", obtenerFechaHoyISO());

  mostrarTecnicos();
  mostrarCitas();
});