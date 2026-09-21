const { app, BrowserWindow, ipcMain, shell, session } = require("electron");
const { autoUpdater } = require("electron-updater");
const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");

let backendCargado = false;
let ventanaPrincipal = null;

const credencialesPorDefecto = {
  host:
    process.env.DB_HOST ||
    "lavanderia-db-lavanderiasalinassv-7707.l.aivencloud.com",
  port: process.env.DB_PORT || 22672,
  user: process.env.DB_USER || "avnadmin",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "defaultdb",
};

function prepararConfiguracionBaseDatos() {
  const ruta = path.join(app.getPath("userData"), "database.json");
  if (!fs.existsSync(ruta)) {
    fs.writeFileSync(
      ruta,
      `${JSON.stringify(credencialesPorDefecto, null, 2)}\n`,
      "utf8",
    );
  }
  process.env.DATABASE_CONFIG_PATH = ruta;
  process.env.BACKUP_DIR = path.join(
    app.getPath("userData"),
    "respaldo lavanderia-salinas",
  );
}

function configurarAutoUpdater() {
  console.log("🔄 [MAIN] Iniciando configuración de auto-updater");
  console.log("🔄 [MAIN] app.isPackaged:", app.isPackaged);
  console.log("🔄 [MAIN] app.getVersion():", app.getVersion());

  if (!app.isPackaged) {
    console.log("🔄 [MAIN] Auto-updater desactivado en modo desarrollo");
    return;
  }

  console.log("🔄 [MAIN] Configurando auto-updater con app version:", app.getVersion());
  console.log("🔄 [MAIN] Publisher config:", {
    provider: "github",
    owner: "lavanderiasalinassv-coder",
    repo: "actualizaciones-lavanderia"
  });

  // Configuración explícita para asegurar que busque en el repositorio correcto
  autoUpdater.setFeedURL({
    provider: "github",
    owner: "lavanderiasalinassv-coder",
    repo: "actualizaciones-lavanderia"
  });

  console.log("🔄 [MAIN] Feed URL configurado");

  // La descarga se inicia únicamente cuando la persona elige instalarla.
  // Así puede posponer una actualización recién detectada.
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;

  console.log("🔄 [MAIN] autoDownload:", autoUpdater.autoDownload);
  console.log("🔄 [MAIN] autoInstallOnAppQuit:", autoUpdater.autoInstallOnAppQuit);

  autoUpdater.on("checking-for-update", () => {
    console.log("🔍 [MAIN] Buscando actualizaciones...");
    if (ventanaPrincipal) {
      ventanaPrincipal.webContents.send("log-main", "🔍 Buscando actualizaciones...");
    }
  });

  autoUpdater.on("update-available", (info) => {
    console.log("✅ [MAIN] Actualización disponible:", info.version);
    console.log("✅ [MAIN] Detalles completos de actualización:", JSON.stringify(info, null, 2));
    if (ventanaPrincipal) {
      ventanaPrincipal.webContents.send("update-disponible", info);
      ventanaPrincipal.webContents.send("log-main", `✅ Actualización disponible: ${info.version}`);
    }
  });

  autoUpdater.on("update-not-available", (info) => {
    console.log("ℹ️ [MAIN] La app está en la última versión.");
    console.log("ℹ️ [MAIN] Info de versión actual:", JSON.stringify(info, null, 2));
    if (ventanaPrincipal) {
      ventanaPrincipal.webContents.send("update-no-disponible");
      ventanaPrincipal.webContents.send("log-main", "ℹ️ La app está en la última versión");
    }
  });

  autoUpdater.on("download-progress", (progress) => {
    console.log("📥 [MAIN] Progreso de descarga:", progress.percent);
    if (ventanaPrincipal) {
      ventanaPrincipal.webContents.send("update-progreso", progress.percent);
      ventanaPrincipal.webContents.send("log-main", `📥 Progreso de descarga: ${progress.percent}%`);
    }
  });

  autoUpdater.on("update-downloaded", (info) => {
    console.log("🎉 [MAIN] Actualización descargada:", info.version);
    if (ventanaPrincipal) {
      ventanaPrincipal.webContents.send("update-lista", info);
      ventanaPrincipal.webContents.send("log-main", `🎉 Actualización descargada: ${info.version}`);
    }
  });

  autoUpdater.on("error", (err) => {
    console.error("❌ [MAIN] Error en auto-updater:", err);
    console.error("❌ [MAIN] Detalles del error:", JSON.stringify(err, null, 2));
    if (ventanaPrincipal) {
      ventanaPrincipal.webContents.send(
        "update-error",
        err?.message || "Error desconocido",
      );
      ventanaPrincipal.webContents.send("log-main", `❌ Error: ${err?.message || "Error desconocido"}`);
    }
  });

  console.log("🚀 [MAIN] Iniciando checkForUpdates()");
  autoUpdater.checkForUpdates();
  console.log("🚀 [MAIN] checkForUpdates() iniciado");
}

ipcMain.handle("instalar-actualizacion", () => {
  autoUpdater.quitAndInstall();
});

ipcMain.handle("descargar-e-instalar-actualizacion", async () => {
  if (!app.isPackaged) return { supported: false };
  await autoUpdater.downloadUpdate();
  autoUpdater.quitAndInstall();
});

ipcMain.handle("buscar-actualizaciones", async () => {
  if (app.isPackaged) {
    const resultado = await autoUpdater.checkForUpdates();
    return {
      supported: true,
      updateAvailable: Boolean(resultado?.isUpdateAvailable),
      version: resultado?.updateInfo?.version || "",
    };
  }
  return { supported: false };
});

ipcMain.handle("obtener-version-aplicacion", () => app.getVersion());

ipcMain.handle("reiniciar-electron", () => {
  for (const ventana of BrowserWindow.getAllWindows()) {
    ventana.removeAllListeners("close");
    ventana.close();
  }
  app.relaunch({
    args: process.argv.slice(1),
    execPath: process.execPath,
  });
  app.exit(0);
});

ipcMain.handle("abrir-carpeta-respaldo", async () => {
  const error = await shell.openPath(process.env.BACKUP_DIR);
  if (error) throw new Error(error);
});

ipcMain.handle("abrir-whatsapp-desktop", async (_event, url) => {
  await shell.openExternal(url);
});

function iniciarBackend() {
  if (backendCargado) return;
  backendCargado = true;

  process.env.NODE_ENV = app.isPackaged ? "production" : "development";
  if (!process.env.PORT) process.env.PORT = "3000";

  if (app.isPackaged) {
    process.env.RESOURCES_PATH = process.resourcesPath;
  }

  const backendEntry = app.isPackaged
    ? path.join(process.resourcesPath, "backend", "server.js")
    : path.join(__dirname, "../Server-Lavanderia/server.js");

  require(backendEntry);
}

function createWindow() {
  session.defaultSession.setPermissionRequestHandler(
    (webContents, permission, callback) => {
      console.log("Solicitud de permiso:", permission);
      if (
        permission === "media" ||
        permission === "audio-capture" ||
        permission === "video-capture"
      ) {
        console.log("Permitiendo acceso al micrófono");
        callback(true);
      } else {
        console.log("Denegando permiso:", permission);
        callback(false);
      }
    },
  );

  session.defaultSession.setDevicePermissionHandler((details) => {
    console.log("Permiso de dispositivo solicitado:", details);
    if (details.deviceType === "audio") {
      console.log("Permitiendo dispositivo de audio");
      return true;
    }
    return false;
  });

  session.defaultSession.setPermissionCheckHandler(
    (webContents, permission, requestingOrigin, details) => {
      console.log(
        "Verificación de permiso:",
        permission,
        "para:",
        requestingOrigin,
      );
      if (
        permission === "media" ||
        permission === "audio-capture" ||
        permission === "video-capture"
      ) {
        console.log("Permitiendo verificación de permiso de micrófono");
        return true;
      }
      return false;
    },
  );

  // Configurar Content Security Policy para permitir imágenes de cualquier origen
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = details.responseHeaders;
    responseHeaders['Access-Control-Allow-Origin'] = '*';
    callback({ cancel: false, responseHeaders });
  });

  const win = new BrowserWindow({
    fullscreen: true,
    frame: false,
    autoHideMenuBar: true,
    icon: app.isPackaged
      ? path.join(process.resourcesPath, "logoapp.png")
      : path.join(__dirname, "../logoapp.png"),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.js"),
      webviewTag: true,
      webSecurity: false,
      sandbox: false,
      allowRunningInsecureContent: true,
      webgl: true,
      experimentalFeatures: true,
    },
  });

  ventanaPrincipal = win;

  const urlDev = process.env.ELECTRON_START_URL;
  const puertoBackend = process.env.PORT || 3000;

  if (urlDev) {
    win.loadURL(urlDev);
  } else {
    win.loadURL(`http://localhost:${puertoBackend}`);
  }

  win.on("focus", () => {
    win.webContents.focus();
  });

  win.on("closed", () => {
    ventanaPrincipal = null;
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
}

app.whenReady().then(() => {
  app.commandLine.appendSwitch("enable-speech-dispatcher");
  app.commandLine.appendSwitch("enable-features", "WebHid,WebBluetooth");
  app.commandLine.appendSwitch("enable-media-stream");
  app.commandLine.appendSwitch("enable-usermedia-screen-capturing");
  app.commandLine.appendSwitch("enable-experimental-web-platform-features");
  app.commandLine.appendSwitch("enable-webassembly");
  app.commandLine.appendSwitch("enable-javascript-harmony");
  app.commandLine.appendSwitch("disable-web-security");

  if (process.platform === "win32") {
    app.commandLine.appendSwitch("no-sandbox");
    app.commandLine.appendSwitch("disable-gpu");
    app.commandLine.appendSwitch("disable-software-rasterizer");
  }

  console.log("Electron iniciándose con configuración de micrófono habilitada");

  // Configurar CORS para permitir imágenes externas
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    callback({ cancel: false, requestHeaders: details.requestHeaders });
  });

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = details.responseHeaders;
    if (responseHeaders) {
      responseHeaders['Access-Control-Allow-Origin'] = ['*'];
      responseHeaders['Access-Control-Allow-Methods'] = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];
      responseHeaders['Access-Control-Allow-Headers'] = ['*'];
    }
    callback({ cancel: false, responseHeaders });
  });

  prepararConfiguracionBaseDatos();
  if (!process.env.ELECTRON_START_URL) {
    iniciarBackend();
    setTimeout(() => {
      createWindow();
      configurarAutoUpdater();
    }, 800);
  } else {
    createWindow();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
