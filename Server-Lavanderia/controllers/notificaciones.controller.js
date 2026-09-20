const {
  obtenerParaUsuario,
  obtenerProblemas,
  obtenerProblemasDeUsuario,
  obtenerAvisosDeAutor,
  obtenerTodosLosAvisosEnviados,
  crearProblema,
  crearAviso,
  editarAviso,
  actualizarEstadoProblema,
  marcarLeida,
  eliminarProblemaDeUsuario,
  limpiarNotificaciones,
  eliminarNotificacion,
} = require("../querys/notificaciones.query");

const esDesarrollador = (req) => {
  const rol = String(req.header("x-user-role") || "").toLowerCase();
  const nombre = String(req.header("x-user-name") || "").toLowerCase();
  return (
    rol === "developer" || rol === "desarrollador" || nombre === "desarrollador"
  );
};

const esAdministrador = (req) => {
  const rol = String(req.header("x-user-role") || "").toLowerCase();
  return rol === "admin" || rol === "administrador";
};

const identidad = (req) => ({
  id: req.header("x-user-id") || null,
  nombre: req.header("x-user-name") || "Usuario desconocido",
  rol: String(req.header("x-user-role") || "").toLowerCase(),
});

const normalizarRolDestinatario = (rol) =>
  ({
    administradores: "administrador",
    recepcionistas: "recepcionista",
    cajeros: "cajero",
    operadores: "operador",
  }[rol] || rol);

const listarNotificaciones = async (req, res) => {
  const usuario = identidad(req);
  if (!usuario.id)
    return res.status(401).json({ error: "La sesión no es válida." });
  res.json(await obtenerParaUsuario(usuario.id, usuario.rol));
};

const listarAvisosEnviados = async (req, res) => {
  if (!esDesarrollador(req) && !esAdministrador(req))
    return res.status(403).json({ error: "Solo el desarrollador o administrador puede ver avisos enviados." });

  const usuario = identidad(req);
  if (!usuario.id)
    return res.status(401).json({ error: "La sesión no es válida." });
  return res.json(
    esDesarrollador(req)
      ? await obtenerTodosLosAvisosEnviados()
      : await obtenerAvisosDeAutor(usuario.id),
  );
};

const listarProblemas = async (req, res) => {
  if (!esDesarrollador(req))
    return res
      .status(403)
      .json({ error: "Solo el desarrollador puede ver los problemas." });
  res.json(await obtenerProblemas());
};

const listarMisProblemas = async (req, res) => {
  if (esDesarrollador(req))
    return res
      .status(403)
      .json({ error: "El desarrollador no tiene reportes propios." });
  const usuario = identidad(req);
  if (!usuario.id)
    return res.status(401).json({ error: "La sesión no es válida." });
  res.json(await obtenerProblemasDeUsuario(usuario.id));
};

const reportarProblema = async (req, res) => {
  if (esDesarrollador(req))
    return res
      .status(403)
      .json({ error: "El desarrollador no puede reportar problemas." });
  const usuario = identidad(req);
  const tema = String(req.body.tema || "").trim();
  const detalles = String(req.body.detalles || "").trim();
  if (!usuario.id || !tema || !detalles)
    return res.status(400).json({ error: "Tema y detalles son obligatorios." });
  res.status(201).json(
    await crearProblema({
      usuarioId: usuario.id,
      usuarioNombre: usuario.nombre,
      tema,
      detalles,
    }),
  );
};

const enviarAviso = async (req, res) => {
  if (!esDesarrollador(req) && !esAdministrador(req))
    return res
      .status(403)
      .json({ error: "Solo el desarrollador o administrador puede enviar avisos." });
  const usuario = identidad(req);
  const titulo = String(req.body.titulo || "").trim();
  const mensaje = String(req.body.mensaje || "").trim();
  const destinatarioRol = normalizarRolDestinatario(String(req.body.destinatarioRol || "todos")
    .trim()
    .toLowerCase());
  const destinatarioId = req.body.destinatarioId || null;
  const imagenUrl = req.body.imagenUrl || null;
  
  // Validar URL de imagen si se proporciona
  if (imagenUrl) {
    try {
      new URL(imagenUrl);
    } catch {
      return res.status(400).json({ error: "La URL de la imagen no es válida." });
    }
  }
  
  if (!titulo || !mensaje)
    return res
      .status(400)
      .json({ error: "Título y mensaje son obligatorios." });
  res.status(201).json(
    await crearAviso({
      autorId: usuario.id,
      autorNombre: usuario.nombre,
      titulo,
      mensaje,
      destinatarioRol,
      destinatarioId,
      imagenUrl,
    }),
  );
};

const editarAvisoHandler = async (req, res) => {
  if (!esAdministrador(req) && !esDesarrollador(req))
    return res
      .status(403)
      .json({ error: "Solo el desarrollador o el autor administrador puede editar avisos." });

  const usuario = identidad(req);
  if (!usuario.id)
    return res.status(401).json({ error: "La sesiÃ³n no es vÃ¡lida." });
  const titulo = String(req.body.titulo || "").trim();
  const mensaje = String(req.body.mensaje || "").trim();
  const destinatarioRol = normalizarRolDestinatario(String(req.body.destinatarioRol || "todos")
    .trim()
    .toLowerCase());
  const destinatarioId = req.body.destinatarioId || null;
  const imagenUrl = req.body.imagenUrl || null;
  
  // Validar URL de imagen si se proporciona
  if (imagenUrl) {
    try {
      new URL(imagenUrl);
    } catch {
      return res.status(400).json({ error: "La URL de la imagen no es válida." });
    }
  }
  
  if (!titulo || !mensaje)
    return res
      .status(400)
      .json({ error: "Título y mensaje son obligatorios." });
  
  const avisoEditado = await editarAviso(req.params.id, {
    titulo,
    mensaje,
    destinatarioRol,
    destinatarioId,
    usuarioId: usuario.id,
    esDesarrollador: esDesarrollador(req),
    imagenUrl,
  });
  
  if (!avisoEditado)
    return res.status(404).json({ error: "Aviso no encontrado o no tienes permiso para editarlo." });
  
  res.json(avisoEditado);
};

const cambiarEstado = async (req, res) => {
  if (!esDesarrollador(req))
    return res
      .status(403)
      .json({ error: "Solo el desarrollador puede cambiar problemas." });
  const estado = String(req.body.estado || "");
  if (!["en_proceso", "resuelto"].includes(estado))
    return res.status(400).json({ error: "Estado no válido." });
  const problema = await actualizarEstadoProblema(req.params.id, estado);
  if (!problema)
    return res.status(404).json({ error: "Problema no encontrado." });
  res.json(problema);
};

const marcarComoLeida = async (req, res) => {
  const usuario = identidad(req);
  if (!usuario.id)
    return res.status(401).json({ error: "La sesión no es válida." });
  await marcarLeida(req.params.id, usuario.id, usuario.rol);
  res.status(204).send();
};

const limpiarTodas = async (req, res) => {
  if (!esDesarrollador(req))
    return res.status(403).json({
      error: "Solo el desarrollador puede limpiar todas las notificaciones.",
    });
  await limpiarNotificaciones();
  return res.status(204).send();

  return res.status(405).json({
    error: "El borrado masivo de notificaciones está deshabilitado. Elimina cada aviso desde el historial.",
  });
};

const eliminarMiProblema = async (req, res) => {
  if (esDesarrollador(req))
    return res
      .status(403)
      .json({ error: "El desarrollador no puede eliminar reportes." });
  const usuario = identidad(req);
  if (!usuario.id)
    return res.status(401).json({ error: "La sesión no es válida." });
  const eliminado = await eliminarProblemaDeUsuario(req.params.id, usuario.id);
  if (!eliminado)
    return res
      .status(404)
      .json({ error: "No se encontró tu reporte de problema." });
  res.status(204).send();
};

const eliminarNotificacionPorId = async (req, res) => {
  if (!esAdministrador(req) && !esDesarrollador(req))
    return res
      .status(403)
      .json({ error: "Solo el desarrollador o administrador puede eliminar avisos." });
  const usuario = identidad(req);
  if (!usuario.id)
    return res.status(401).json({ error: "La sesiÃ³n no es vÃ¡lida." });
  const eliminado = await eliminarNotificacion(
    req.params.id,
    usuario.id,
    esDesarrollador(req),
  );
  if (!eliminado)
    return res.status(403).json({ error: "Aviso no encontrado o no tienes permiso para eliminarlo." });
  res.status(204).send();
};

module.exports = {
  listarNotificaciones,
  listarAvisosEnviados,
  listarProblemas,
  listarMisProblemas,
  reportarProblema,
  enviarAviso,
  editarAviso: editarAvisoHandler,
  cambiarEstado,
  marcarComoLeida,
  limpiarTodas,
  eliminarMiProblema,
  eliminarNotificacionPorId,
};
