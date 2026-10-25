const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  reiniciarElectron: () => ipcRenderer.invoke("reiniciar-electron"),
  obtenerConfiguracionBaseDatosPredeterminada: () =>
    ipcRenderer.invoke("obtener-configuracion-base-datos-predeterminada"),
  abrirCarpetaRespaldo: () => ipcRenderer.invoke("abrir-carpeta-respaldo"),
  abrirWhatsAppDesktop: (url) =>
    ipcRenderer.invoke("abrir-whatsapp-desktop", url),
  copiarImagenCuponWhatsApp: (dataUrl) =>
    ipcRenderer.invoke("copiar-imagen-cupon-whatsapp", dataUrl),
  adjuntarPdfWhatsApp: (webContentsId, data, nombre) =>
    ipcRenderer.invoke("adjuntar-pdf-whatsapp", webContentsId, data, nombre),
  isElectron: true,
  onUpdateDisponible: (callback) =>
    ipcRenderer.on("update-disponible", (_e, info) => callback(info)),
  onUpdateProgreso: (callback) =>
    ipcRenderer.on("update-progreso", (_e, percent) => callback(percent)),
  onUpdateLista: (callback) =>
    ipcRenderer.on("update-lista", (_e, info) => callback(info)),
  onUpdateNoDisponible: (callback) =>
    ipcRenderer.on("update-no-disponible", () => callback()),
  onUpdateError: (callback) =>
    ipcRenderer.on("update-error", (_e, mensaje) => callback(mensaje)),
  onLogMain: (callback) =>
    ipcRenderer.on("log-main", (_e, mensaje) => callback(mensaje)),
  instalarActualizacion: () => ipcRenderer.invoke("instalar-actualizacion"),
  descargarEInstalarActualizacion: () =>
    ipcRenderer.invoke("descargar-e-instalar-actualizacion"),
  buscarActualizaciones: () => ipcRenderer.invoke("buscar-actualizaciones"),
  obtenerVersionAplicacion: () =>
    ipcRenderer.invoke("obtener-version-aplicacion"),
  comprobarVersionPublicacion: () =>
    ipcRenderer.invoke("comprobar-version-publicacion"),
  publicarActualizacion: () => ipcRenderer.invoke("publicar-actualizacion"),
  puedePublicarActualizacion: () =>
    ipcRenderer.invoke("puede-publicar-actualizacion"),
  onProgresoPublicacion: (callback) => {
    const listener = (_event, detalle) => callback(detalle);
    ipcRenderer.on("progreso-publicacion", listener);
    return () => ipcRenderer.removeListener("progreso-publicacion", listener);
  },
});
