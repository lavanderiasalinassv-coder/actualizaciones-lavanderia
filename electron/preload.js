const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  reiniciarElectron: () => ipcRenderer.invoke("reiniciar-electron"),
  abrirCarpetaRespaldo: () => ipcRenderer.invoke("abrir-carpeta-respaldo"),
  abrirWhatsAppDesktop: (url) =>
    ipcRenderer.invoke("abrir-whatsapp-desktop", url),
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
  obtenerVersionAplicacion: () => ipcRenderer.invoke("obtener-version-aplicacion"),
});
