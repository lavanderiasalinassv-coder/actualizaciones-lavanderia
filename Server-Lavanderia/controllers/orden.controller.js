const {
  obtenerOrdenes,
  obtenerOrdenPorId,
  crearOrden,
  actualizarEstado,
  actualizarPago,
  registrarAnticipo,
  eliminarAnticipo,
  agregarCargoExtra,
  eliminarCargoExtra,
  agregarItemAOrden,
  eliminarItemDeOrden,
  eliminarFoto,
  cancelarOrden,
  restaurarOrden,
  eliminarOrden,
  registrarMovimiento,
  actualizarCamposOrden,
} = require("../querys/orden.query");
const { AppError } = require("../utils/errors");
const { obtenerTurno } = require("../querys/turno.query");

const manejarError = (res, error) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ error: error.message });
  }

  console.error("Error inesperado en ordenes.controller:", error);
  return res.status(500).json({ error: "Error interno del servidor." });
};

const obtenerUsuarioAuditoria = (req) => {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const usuarioLegacy =
    typeof body.usuario === "string"
      ? body.usuario
      : typeof req.headers["x-usuario"] === "string"
        ? req.headers["x-usuario"]
        : "";
  const nombreEstructurado =
    typeof body.usuarioNombre === "string" ? body.usuarioNombre.trim() : "";
  const nombre = nombreEstructurado || usuarioLegacy.trim();
  const id =
    typeof body.usuarioId === "string" && body.usuarioId.trim()
      ? body.usuarioId.trim()
      : null;
  const rol =
    typeof body.usuarioRol === "string" && body.usuarioRol.trim()
      ? body.usuarioRol.trim().toLowerCase()
      : null;

  return {
    id,
    nombre: nombre || "Sistema",
    rol,
  };
};

const esOperador = (usuario) =>
  (usuario?.rol || "").toLowerCase() === "operador";

const esAdministrador = (usuario) =>
  ["administrador", "admin"].includes((usuario?.rol || "").toLowerCase());

const listarOrdenes = async (_req, res) => {
  try {
    const ordenes = await obtenerOrdenes();
    res.status(200).json(ordenes);
  } catch (error) {
    manejarError(res, error);
  }
};

const obtenerOrden = async (req, res) => {
  try {
    const orden = await obtenerOrdenPorId(req.params.id);
    res.status(200).json(orden);
  } catch (error) {
    manejarError(res, error);
  }
};

const crear = async (req, res) => {
  try {
    const { nombreCliente, telefono, items } = req.body;

    if (!nombreCliente || !String(nombreCliente).trim()) {
      return res
        .status(400)
        .json({ error: "El nombre del cliente es obligatorio." });
    }
    if (!telefono || !String(telefono).trim()) {
      return res.status(400).json({ error: "El teléfono es obligatorio." });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ error: "La orden debe tener al menos un item." });
    }

    const usuario = obtenerUsuarioAuditoria(req);
    const orden = await crearOrden(req.body, usuario);
    res.status(201).json(orden);
  } catch (error) {
    manejarError(res, error);
  }
};

const cambiarEstado = async (req, res) => {
  try {
    const { estado, notaInterna, cantidadPrendas, fechaEntregado, turnoId } =
      req.body;
    const estadosValidos = [
      "pendiente",
      "en_proceso",
      "listo",
      "entregado",
      "cerrada",
      "cancelada",
    ];

    if (!estado || !estadosValidos.includes(estado)) {
      return res.status(400).json({ error: "Estado inválido." });
    }

    const usuario = obtenerUsuarioAuditoria(req);
    const turnoActual = await obtenerTurno();
    const ordenActual = await obtenerOrdenPorId(req.params.id);

    if (estado === "entregado" && !turnoActual.abierto) {
      return res.status(409).json({
        error:
          "No se puede marcar una orden como entregada porque no hay un turno abierto. Usa la entrega antigua para registrar un cierre histórico.",
      });
    }

    if (esOperador(usuario) && estado !== "en_proceso" && estado !== "listo") {
      return res.status(403).json({
        error: "El operador solo puede marcar órdenes como en proceso o listo.",
      });
    }

    if (
      esOperador(usuario) &&
      ordenActual.estado !== "pendiente" &&
      ordenActual.estado !== "en_proceso"
    ) {
      return res.status(409).json({
        error:
          "Solo se pueden recibir órdenes que estén pendientes o en proceso.",
      });
    }

    let cantidadRecepcion = undefined;
    let notaRecepcion = undefined;
    let textoMovimiento = undefined;

    if (esOperador(usuario) && estado === "en_proceso") {
      cantidadRecepcion = Number(cantidadPrendas);
      const cantidadOriginal = Number(ordenActual.cantidadPrendas || 0);
      if (!Number.isFinite(cantidadRecepcion) || cantidadRecepcion <= 0) {
        return res.status(400).json({
          error: "Debes indicar cuántas prendas se reciben.",
        });
      }

      const notaOperador =
        typeof notaInterna === "string" ? notaInterna.trim() : "";
      if (cantidadRecepcion !== cantidadOriginal && !notaOperador) {
        return res.status(400).json({
          error:
            "Si la cantidad recibida es diferente a la registrada, debes agregar una nota interna.",
        });
      }

      const partesNota = [
        `Recepción por operador: ${cantidadRecepcion} de ${cantidadOriginal} prendas${cantidadRecepcion !== cantidadOriginal ? " (cantidad diferente)" : ""}`,
      ];
      if (notaOperador) partesNota.push(`Nota del operador: ${notaOperador}`);
      notaRecepcion = partesNota.join(" | ");
      textoMovimiento = `Recepción confirmada: ${cantidadRecepcion} de ${cantidadOriginal} prendas${cantidadRecepcion !== cantidadOriginal ? " (cantidad diferente)" : ""}`;
    }

    if (esOperador(usuario) && estado === "listo") {
      textoMovimiento = "Orden marcada como lista por operador";
    }

    const orden = await actualizarEstado(req.params.id, estado, usuario, {
      cantidadPrendas: cantidadRecepcion,
      notaInterna: notaRecepcion,
      textoMovimiento,
      fechaEntregado,
      turnoId: esAdministrador(usuario) ? turnoId : undefined,
    });
    res.status(200).json(orden);
  } catch (error) {
    manejarError(res, error);
  }
};

const marcarPago = async (req, res) => {
  try {
    const { estadoPago, turnoId } = req.body;
    const estadosValidos = ["porCobrar", "anticipo", "pagado"];

    if (!estadoPago || !estadosValidos.includes(estadoPago)) {
      return res.status(400).json({ error: "Estado de pago inválido." });
    }

    const usuario = obtenerUsuarioAuditoria(req);
    const orden = await actualizarPago(
      req.params.id,
      estadoPago,
      usuario,
      esAdministrador(usuario) ? turnoId : undefined,
    );
    res.status(200).json(orden);
  } catch (error) {
    manejarError(res, error);
  }
};

const crearAnticipo = async (req, res) => {
  try {
    const { monto, fecha, turnoId } = req.body;
    if (!Number.isFinite(Number(monto)) || Number(monto) <= 0) {
      return res
        .status(400)
        .json({ error: "El monto del anticipo debe ser mayor a 0." });
    }

    const usuario = obtenerUsuarioAuditoria(req);
    const turno = await obtenerTurno();
    const quiereAnticipoAntiguo = Boolean(
      fecha || (turnoId && turnoId !== turno.id),
    );
    if (quiereAnticipoAntiguo && !esAdministrador(usuario)) {
      return res.status(403).json({
        error: "Solo un administrador puede registrar un anticipo antiguo.",
      });
    }
    if (quiereAnticipoAntiguo && (!fecha || !turnoId)) {
      return res.status(400).json({
        error:
          "Selecciona la fecha y el turno para registrar el anticipo antiguo.",
      });
    }
    if (!turno.abierto && !quiereAnticipoAntiguo) {
      return res.status(409).json({
        error:
          "No hay un turno de caja abierto. Abre un turno para registrar cobros.",
      });
    }

    const orden = await registrarAnticipo(
      req.params.id,
      Number(monto),
      usuario,
      quiereAnticipoAntiguo ? turnoId : turno.id,
      quiereAnticipoAntiguo ? fecha : undefined,
    );
    res.status(200).json(orden);
  } catch (error) {
    manejarError(res, error);
  }
};

const borrarAnticipo = async (req, res) => {
  try {
    const orden = await eliminarAnticipo(
      req.params.id,
      req.params.idAnticipo,
      obtenerUsuarioAuditoria(req),
    );
    res.status(200).json(orden);
  } catch (error) {
    manejarError(res, error);
  }
};

const crearCargoExtra = async (req, res) => {
  try {
    const { descripcion, monto } = req.body;
    if (!Number.isFinite(Number(monto)) || Number(monto) <= 0) {
      return res
        .status(400)
        .json({ error: "El monto del cargo extra debe ser mayor a 0." });
    }

    const orden = await agregarCargoExtra(
      req.params.id,
      descripcion,
      Number(monto),
      obtenerUsuarioAuditoria(req),
    );
    res.status(200).json(orden);
  } catch (error) {
    manejarError(res, error);
  }
};

const borrarCargoExtra = async (req, res) => {
  try {
    const orden = await eliminarCargoExtra(
      req.params.id,
      req.params.idCargo,
      obtenerUsuarioAuditoria(req),
    );
    res.status(200).json(orden);
  } catch (error) {
    manejarError(res, error);
  }
};

const agregarItem = async (req, res) => {
  try {
    const { id, nombre, precio, unidad, cantidad } = req.body;
    if (!id || !nombre || precio === undefined || !unidad) {
      return res.status(400).json({
        error: "id, nombre, precio y unidad del producto son obligatorios.",
      });
    }

    const orden = await agregarItemAOrden(
      req.params.id,
      {
        id,
        nombre,
        precio,
        unidad,
        cantidad: cantidad === undefined ? 1 : Number(cantidad),
      },
      obtenerUsuarioAuditoria(req),
    );
    res.status(200).json(orden);
  } catch (error) {
    manejarError(res, error);
  }
};

const borrarItem = async (req, res) => {
  try {
    const razon = req.query.razon || req.body?.razon;
    const orden = await eliminarItemDeOrden(
      req.params.id,
      req.params.itemId,
      razon,
      obtenerUsuarioAuditoria(req),
    );
    res.status(200).json(orden);
  } catch (error) {
    manejarError(res, error);
  }
};

const borrarFoto = async (req, res) => {
  try {
    const index = Number(req.params.index);
    if (!Number.isInteger(index) || index < 0) {
      return res.status(400).json({ error: "Índice de foto inválido." });
    }

    const orden = await eliminarFoto(
      req.params.id,
      index,
      obtenerUsuarioAuditoria(req),
    );
    res.status(200).json(orden);
  } catch (error) {
    manejarError(res, error);
  }
};

const cancelar = async (req, res) => {
  try {
    const { motivo } = req.body;
    if (!motivo || !String(motivo).trim()) {
      return res
        .status(400)
        .json({ error: "El motivo de cancelación es obligatorio." });
    }

    const orden = await cancelarOrden(
      req.params.id,
      motivo,
      obtenerUsuarioAuditoria(req),
    );
    res.status(200).json(orden);
  } catch (error) {
    manejarError(res, error);
  }
};

const restaurar = async (req, res) => {
  try {
    const orden = await restaurarOrden(
      req.params.id,
      obtenerUsuarioAuditoria(req),
    );
    res.status(200).json(orden);
  } catch (error) {
    manejarError(res, error);
  }
};

const eliminar = async (req, res) => {
  try {
    await eliminarOrden(req.params.id);
    res.status(204).send();
  } catch (error) {
    manejarError(res, error);
  }
};

const actualizarCampos = async (req, res) => {
  try {
    const {
      notaInterna,
      fotos,
      fechaCreacion,
      fechaEntrega,
      horaEntrega,
      nombreCliente,
      correo,
      telefono,
      cantidadPrendas,
    } = req.body;

    if (
      notaInterna === undefined &&
      fotos === undefined &&
      fechaCreacion === undefined &&
      fechaEntrega === undefined &&
      horaEntrega === undefined &&
      nombreCliente === undefined &&
      correo === undefined &&
      telefono === undefined &&
      cantidadPrendas === undefined
    ) {
      return res
        .status(400)
        .json({ error: "No se enviaron campos para actualizar." });
    }
    if (fotos !== undefined && !Array.isArray(fotos)) {
      return res.status(400).json({ error: "fotos debe ser un arreglo." });
    }
    const usuario = obtenerUsuarioAuditoria(req);
    const camposCliente = [nombreCliente, correo, telefono];
    if (
      camposCliente.some((campo) => campo !== undefined) &&
      !esAdministrador(usuario)
    ) {
      return res.status(403).json({
        error: "Solo un administrador puede editar los datos del cliente.",
      });
    }
    if (nombreCliente !== undefined && !String(nombreCliente).trim()) {
      return res
        .status(400)
        .json({ error: "El nombre del cliente es obligatorio." });
    }
    if (
      correo !== undefined &&
      correo !== null &&
      correo !== "" &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(correo).trim())
    ) {
      return res
        .status(400)
        .json({ error: "El correo electrónico no es válido." });
    }
    if (
      telefono !== undefined &&
      !/^\d{7,15}$/.test(String(telefono).replace(/\D/g, ""))
    ) {
      return res.status(400).json({
        error: "El número de celular debe tener entre 7 y 15 dígitos.",
      });
    }
    if (
      (fechaCreacion !== undefined || fechaEntrega !== undefined) &&
      !esAdministrador(usuario)
    ) {
      return res.status(403).json({
        error: "Solo un administrador puede cambiar las fechas de una orden.",
      });
    }
    if (
      fechaCreacion !== undefined &&
      !/^\d{4}-\d{2}-\d{2}$/.test(fechaCreacion)
    ) {
      return res
        .status(400)
        .json({ error: "La fecha de creación no es válida." });
    }
    if (
      fechaEntrega !== undefined &&
      !/^\d{4}-\d{2}-\d{2}$/.test(fechaEntrega)
    ) {
      return res
        .status(400)
        .json({ error: "La fecha de entrega no es válida." });
    }

    if (horaEntrega !== undefined && !/^\d{2}:\d{2}$/.test(horaEntrega)) {
      return res.status(400).json({
        error: "La hora de entrega no es válida. Debe ser formato HH:MM.",
      });
    }

    if (cantidadPrendas !== undefined && !esAdministrador(usuario)) {
      return res.status(403).json({
        error: "Solo un administrador puede editar la cantidad de prendas.",
      });
    }
    if (
      cantidadPrendas !== undefined &&
      (!Number.isFinite(Number(cantidadPrendas)) || Number(cantidadPrendas) < 0)
    ) {
      return res
        .status(400)
        .json({ error: "La cantidad de prendas no es válida." });
    }

    const orden = await actualizarCamposOrden(
      req.params.id,
      {
        notaInterna,
        fotos,
        fechaCreacion,
        fechaEntrega,
        horaEntrega,
        nombreCliente,
        correo,
        telefono,
        cantidadPrendas,
      },
      usuario,
    );
    res.status(200).json(orden);
  } catch (error) {
    manejarError(res, error);
  }
};

const crearMovimiento = async (req, res) => {
  try {
    const { texto } = req.body;
    if (!texto || !String(texto).trim()) {
      return res
        .status(400)
        .json({ error: "El texto del movimiento es obligatorio." });
    }

    const orden = await registrarMovimiento(
      req.params.id,
      texto,
      obtenerUsuarioAuditoria(req),
    );
    res.status(200).json(orden);
  } catch (error) {
    manejarError(res, error);
  }
};

module.exports = {
  listarOrdenes,
  obtenerOrden,
  crear,
  cambiarEstado,
  marcarPago,
  crearAnticipo,
  borrarAnticipo,
  crearCargoExtra,
  borrarCargoExtra,
  agregarItem,
  borrarItem,
  borrarFoto,
  cancelar,
  restaurar,
  eliminar,
  crearMovimiento,
  actualizarCampos,
};
