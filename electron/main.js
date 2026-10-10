const {
  app,
  BrowserWindow,
  clipboard,
  ipcMain,
  nativeImage,
  shell,
  session,
  webContents,
} = require("electron");
const { autoUpdater } = require("electron-updater");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const https = require("https");

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

  console.log(
    "🔄 [MAIN] Configurando auto-updater con app version:",
    app.getVersion(),
  );
  console.log("🔄 [MAIN] Publisher config:", {
    provider: "github",
    owner: "lavanderiasalinassv-coder",
    repo: "actualizaciones-lavanderia",
  });

  // Configuración explícita para asegurar que busque en el repositorio correcto
  autoUpdater.setFeedURL({
    provider: "github",
    owner: "lavanderiasalinassv-coder",
    repo: "actualizaciones-lavanderia",
  });

  console.log("🔄 [MAIN] Feed URL configurado");

  // La descarga se inicia únicamente cuando la persona elige instalarla.
  // Así puede posponer una actualización recién detectada.
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;

  console.log("🔄 [MAIN] autoDownload:", autoUpdater.autoDownload);
  console.log(
    "🔄 [MAIN] autoInstallOnAppQuit:",
    autoUpdater.autoInstallOnAppQuit,
  );

  autoUpdater.on("checking-for-update", () => {
    console.log("🔍 [MAIN] Buscando actualizaciones...");
    if (ventanaPrincipal) {
      ventanaPrincipal.webContents.send(
        "log-main",
        "🔍 Buscando actualizaciones...",
      );
    }
  });

  autoUpdater.on("update-available", (info) => {
    console.log("✅ [MAIN] Actualización disponible:", info.version);
    console.log(
      "✅ [MAIN] Detalles completos de actualización:",
      JSON.stringify(info, null, 2),
    );
    if (ventanaPrincipal) {
      ventanaPrincipal.webContents.send("update-disponible", info);
      ventanaPrincipal.webContents.send(
        "log-main",
        `✅ Actualización disponible: ${info.version}`,
      );
    }
  });

  autoUpdater.on("update-not-available", (info) => {
    console.log("ℹ️ [MAIN] La app está en la última versión.");
    console.log(
      "ℹ️ [MAIN] Info de versión actual:",
      JSON.stringify(info, null, 2),
    );
    if (ventanaPrincipal) {
      ventanaPrincipal.webContents.send("update-no-disponible");
      ventanaPrincipal.webContents.send(
        "log-main",
        "ℹ️ La app está en la última versión",
      );
    }
  });

  autoUpdater.on("download-progress", (progress) => {
    console.log("📥 [MAIN] Progreso de descarga:", progress.percent);
    if (ventanaPrincipal) {
      ventanaPrincipal.webContents.send("update-progreso", progress.percent);
      ventanaPrincipal.webContents.send(
        "log-main",
        `📥 Progreso de descarga: ${progress.percent}%`,
      );
    }
  });

  autoUpdater.on("update-downloaded", (info) => {
    console.log("🎉 [MAIN] Actualización descargada:", info.version);
    if (ventanaPrincipal) {
      ventanaPrincipal.webContents.send("update-lista", info);
      ventanaPrincipal.webContents.send(
        "log-main",
        `🎉 Actualización descargada: ${info.version}`,
      );
    }
  });

  autoUpdater.on("error", (err) => {
    console.error("❌ [MAIN] Error en auto-updater:", err);
    console.error(
      "❌ [MAIN] Detalles del error:",
      JSON.stringify(err, null, 2),
    );
    if (ventanaPrincipal) {
      ventanaPrincipal.webContents.send(
        "update-error",
        err?.message || "Error desconocido",
      );
      ventanaPrincipal.webContents.send(
        "log-main",
        `❌ Error: ${err?.message || "Error desconocido"}`,
      );
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

const repoGithub = {
  owner: "lavanderiasalinassv-coder",
  repo: "actualizaciones-lavanderia",
};

function obtenerRaizProyecto() {
  if (app.isPackaged) return null;
  const raiz = app.getAppPath();
  return fs.existsSync(path.join(raiz, "package.json")) &&
    fs.existsSync(path.join(raiz, "electron"))
    ? raiz
    : null;
}

ipcMain.handle("puede-publicar-actualizacion", () =>
  Boolean(obtenerRaizProyecto()),
);

function leerTokenGithub(raiz) {
  const rutaEnv = path.join(raiz, ".env");
  if (!fs.existsSync(rutaEnv)) return "";
  const linea = fs
    .readFileSync(rutaEnv, "utf8")
    .split(/\r?\n/)
    .find((lineaEnv) => /^\s*GH_TOKEN\s*=/.test(lineaEnv));
  if (!linea) return "";
  return linea
    .replace(/^\s*GH_TOKEN\s*=\s*/, "")
    .replace(/\s+#.*$/, "")
    .trim()
    .replace(/^(['"])(.*)\1$/, "$2");
}

function consultarVersionPublicada(version) {
  return new Promise((resolve, reject) => {
    const request = https.get(
      {
        hostname: "api.github.com",
        path: `/repos/${repoGithub.owner}/${repoGithub.repo}/releases/tags/v${encodeURIComponent(version)}`,
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "Lavanderia-Desktop",
        },
      },
      (response) => {
        response.resume();
        if (response.statusCode === 200) return resolve(true);
        if (response.statusCode === 404) return resolve(false);
        reject(
          new Error(
            `GitHub respondió con estado ${response.statusCode || "desconocido"}.`,
          ),
        );
      },
    );
    request.setTimeout(15000, () =>
      request.destroy(
        new Error("La consulta a GitHub excedió el tiempo límite."),
      ),
    );
    request.on("error", reject);
  });
}

ipcMain.handle("comprobar-version-publicacion", async () => {
  const raiz = obtenerRaizProyecto();
  if (!raiz)
    return {
      available: false,
      reason:
        "Abre la aplicación desde el proyecto de desarrollo para publicar.",
    };
  const version = require(path.join(raiz, "package.json")).version;
  const publicada = await consultarVersionPublicada(version);
  return { available: true, version, publicada };
});

ipcMain.handle("publicar-actualizacion", async () => {
  const raiz = obtenerRaizProyecto();
  if (!raiz)
    throw new Error(
      "La publicación solo está disponible al abrir la aplicación desde el proyecto de desarrollo.",
    );
  const version = require(path.join(raiz, "package.json")).version;
  if (await consultarVersionPublicada(version)) {
    throw new Error(
      `La versión ${version} ya existe como publicación en GitHub. Actualiza package.json antes de publicar.`,
    );
  }
  const token = leerTokenGithub(raiz);
  if (!token)
    throw new Error("No se encontró GH_TOKEN en el archivo .env del proyecto.");

  return new Promise((resolve, reject) => {
    const proceso = spawn(
      process.platform === "win32" ? "npm.cmd" : "npm",
      ["run", "electron:publish"],
      {
        cwd: raiz,
        env: { ...process.env, GH_TOKEN: token },
        windowsHide: true,
        shell: process.platform === "win32",
      },
    );
    let salida = "";
    let progreso = 5;
    let finalizado = false;
    const emitir = (texto, porcentaje = progreso) => {
      progreso = Math.max(progreso, Math.min(100, porcentaje));
      if (ventanaPrincipal && !ventanaPrincipal.isDestroyed()) {
        ventanaPrincipal.webContents.send("progreso-publicacion", {
          texto: texto.replaceAll(token, "[oculto]").trim(),
          porcentaje: progreso,
        });
      }
    };
    const timeout = setTimeout(() => proceso.kill(), 30 * 60 * 1000);
    const procesarSalida = (fragmento) => {
      salida = (salida + fragmento.toString()).slice(-12000);
      const lineas = salida.split(/\r?\n/);
      salida = lineas.pop() || "";
      for (const linea of lineas) {
        const texto = linea.replaceAll(token, "[oculto]").trim();
        if (!texto) continue;
        let porcentaje = progreso;
        const porcentajePublicado = texto.match(/\b(\d{1,3})%/);
        if (/upload|release|github/i.test(texto) && porcentajePublicado) {
          porcentaje = 60 + Math.round(Number(porcentajePublicado[1]) * 0.39);
        } else if (/vite build|building|compiling/i.test(texto))
          porcentaje = 25;
        else if (/electron-builder|packaging|building nsis/i.test(texto))
          porcentaje = 48;
        else if (/publish|upload/i.test(texto)) porcentaje = 60;
        emitir(texto.slice(-240), porcentaje);
      }
    };
    proceso.stdout.on("data", procesarSalida);
    proceso.stderr.on("data", procesarSalida);
    proceso.on("error", (error) => {
      if (finalizado) return;
      finalizado = true;
      clearTimeout(timeout);
      reject(new Error(`No se pudo iniciar la publicación: ${error.message}`));
    });
    proceso.on("close", (codigo) => {
      if (finalizado) return;
      finalizado = true;
      clearTimeout(timeout);
      if (codigo !== 0) {
        const detalle = salida.replaceAll(token, "[oculto]").slice(-2000);
        emitir(
          `Error al publicar (código ${codigo ?? "desconocido"}). ${detalle}`,
          progreso,
        );
        return reject(
          new Error(`No se pudo publicar la versión ${version}. ${detalle}`),
        );
      }
      emitir(`Publicación de la versión ${version} completada.`, 100);
      resolve({ version });
    });
  });
});

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

ipcMain.handle("obtener-configuracion-base-datos-predeterminada", () => {
  const archivoConfiguracion = app.isPackaged
    ? path.join(
        process.resourcesPath,
        "backend",
        "database",
        "databaseConfig.js",
      )
    : path.join(
        __dirname,
        "..",
        "Server-Lavanderia",
        "database",
        "databaseConfig.js",
      );
  const { leerConfiguracionPredeterminada } = require(archivoConfiguracion);
  return leerConfiguracionPredeterminada();
});

ipcMain.handle("abrir-carpeta-respaldo", async () => {
  const error = await shell.openPath(process.env.BACKUP_DIR);
  if (error) throw new Error(error);
});

ipcMain.handle("abrir-whatsapp-desktop", async (_event, url) => {
  await shell.openExternal(url);
});

ipcMain.handle("copiar-imagen-cupon-whatsapp", (_event, dataUrl) => {
  if (typeof dataUrl !== "string" || dataUrl.length > 2_000_000) {
    throw new Error(
      "La imagen del cupón no es válida o excede el tamaño permitido.",
    );
  }

  const coincidencia = /^data:image\/png;base64,([A-Za-z0-9+/]+={0,2})$/.exec(
    dataUrl,
  );
  if (!coincidencia)
    throw new Error("Solo se pueden copiar imágenes PNG de cupones.");

  const imagen = nativeImage.createFromDataURL(dataUrl);
  if (imagen.isEmpty())
    throw new Error("No se pudo preparar la imagen del cupón.");
  clipboard.writeImage(imagen);
  return true;
});

ipcMain.handle("adjuntar-pdf-whatsapp", async (event, webContentsId, data, nombre) => {
  if (ventanaPrincipal && event.sender !== ventanaPrincipal.webContents) {
    throw new Error("No se autorizó la solicitud para adjuntar la factura.");
  }
  if (typeof data !== "string" || data.length > 30_000_000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(data)) {
    throw new Error("El PDF de la factura no es válido o excede el tamaño permitido.");
  }
  const contenidoPdf = Buffer.from(data, "base64");
  if (contenidoPdf.subarray(0, 5).toString("ascii") !== "%PDF-") {
    throw new Error("El archivo recibido no es un PDF válido.");
  }

  const destino = webContents.fromId(Number(webContentsId));
  if (!destino || !destino.getURL().startsWith("https://web.whatsapp.com")) {
    throw new Error("No se encontró el panel de WhatsApp abierto.");
  }

  const nombreSeguro = String(nombre || "factura.pdf").replace(/[^a-zA-Z0-9._-]/g, "_");
  const rutaPdf = path.join(app.getPath("temp"), `whatsapp-${Date.now()}-${nombreSeguro}`);
  await fs.promises.writeFile(rutaPdf, contenidoPdf);

  const yaAdjunto = destino.debugger.isAttached();
  try {
    if (!yaAdjunto) destino.debugger.attach("1.3");
    await destino.debugger.sendCommand("DOM.enable");
    const espera = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    let nodoArchivo = null;
    for (let intento = 0; intento < 30 && !nodoArchivo; intento += 1) {
      const { root } = await destino.debugger.sendCommand("DOM.getDocument", { depth: -1 });
      const { nodeIds } = await destino.debugger.sendCommand("DOM.querySelectorAll", {
        nodeId: root.nodeId,
        selector: 'input[type="file"]',
      });
      for (const nodeId of nodeIds) {
        const { node } = await destino.debugger.sendCommand("DOM.describeNode", { nodeId });
        const atributos = node.attributes || [];
        const indiceAccept = atributos.indexOf("accept");
        const accept = indiceAccept >= 0 ? atributos[indiceAccept + 1].toLowerCase() : "";
        if (!accept || /pdf|application|\.doc|\.xls|\.ppt/i.test(accept) || accept === "*/*" || accept === "*") {
          nodoArchivo = nodeId;
          break;
        }
      }
      if (!nodoArchivo) await espera(300);
    }
    if (!nodoArchivo) throw new Error("WhatsApp no mostró el control para adjuntar documentos.");
    await destino.debugger.sendCommand("DOM.setFileInputFiles", {
      nodeId: nodoArchivo,
      files: [rutaPdf],
    });
    return true;
  } finally {
    if (!yaAdjunto && destino.debugger.isAttached()) destino.debugger.detach();
  }
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
    (_webContents, permission, callback, details) => {
      let origen = "";
      try {
        origen = new URL(details.requestingUrl).origin;
      } catch {}

      const origenLocal = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
      ].includes(origen);
      const solicitaCamara =
        permission === "media" && details.mediaTypes?.includes("video");
      callback(Boolean(origenLocal && solicitaCamara));
    },
  );

  // Configurar Content Security Policy para permitir imágenes de cualquier origen
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = details.responseHeaders;
    responseHeaders["Access-Control-Allow-Origin"] = "*";
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

  // Configurar CORS para permitir imágenes externas
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders["User-Agent"] =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    callback({ cancel: false, requestHeaders: details.requestHeaders });
  });

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = details.responseHeaders;
    if (responseHeaders) {
      responseHeaders["Access-Control-Allow-Origin"] = ["*"];
      responseHeaders["Access-Control-Allow-Methods"] = [
        "GET",
        "POST",
        "PUT",
        "DELETE",
        "OPTIONS",
      ];
      responseHeaders["Access-Control-Allow-Headers"] = ["*"];
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
