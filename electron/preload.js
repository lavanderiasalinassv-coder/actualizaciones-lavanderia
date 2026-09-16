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
  instalarActualizacion: () => ipcRenderer.invoke("instalar-actualizacion"),
  buscarActualizaciones: () => ipcRenderer.invoke("buscar-actualizaciones"),
});
