const fs = require("fs");
const path = require("path");

const CONFIG_FIELDS = ["groqModel", "geminiModel", "geminiFallbackModel"];
const DEFAULT_MODELOS_CONFIG = {
  groqModel: "openai/gpt-oss-120b",
  geminiModel: "gemini-3.5-flash-lite",
  geminiFallbackModel: "gemini-3.5-flash-lite",
};
const fallbackPath = path.join(__dirname, "modelos-ia.json");

function getModelosConfigPath() {
  return process.env.MODELOS_CONFIG_PATH || fallbackPath;
}

function normalizarConfiguracion(configuracion) {
  return {
    groqModel: String(configuracion.groqModel || "").trim(),
    geminiModel: String(configuracion.geminiModel || "").trim(),
    geminiFallbackModel: String(configuracion.geminiFallbackModel || "").trim(),
  };
}

function leerConfiguracionModelos() {
  const ruta = getModelosConfigPath();
  if (!fs.existsSync(ruta)) {
    return normalizarConfiguracion({
      groqModel: process.env.GROQ_MODEL || DEFAULT_MODELOS_CONFIG.groqModel,
      geminiModel:
        process.env.GEMINI_MODEL || DEFAULT_MODELOS_CONFIG.geminiModel,
      geminiFallbackModel:
        process.env.GEMINI_FALLBACK_MODEL ||
        DEFAULT_MODELOS_CONFIG.geminiFallbackModel,
    });
  }

  return normalizarConfiguracion(JSON.parse(fs.readFileSync(ruta, "utf8")));
}

function validarConfiguracionModelos(configuracion) {
  const segura = normalizarConfiguracion(configuracion);
  if (!segura.groqModel || !segura.geminiModel || !segura.geminiFallbackModel) {
    throw new Error(
      "Completa el modelo de Groq, el de Gemini y el de respaldo de Gemini.",
    );
  }
  return segura;
}

function guardarConfiguracionModelos(configuracion) {
  const ruta = getModelosConfigPath();
  const segura = validarConfiguracionModelos(configuracion);
  fs.mkdirSync(path.dirname(ruta), { recursive: true });
  fs.writeFileSync(ruta, `${JSON.stringify(segura, null, 2)}\n`, "utf8");
  return segura;
}

module.exports = {
  CONFIG_FIELDS,
  DEFAULT_MODELOS_CONFIG,
  leerConfiguracionModelos,
  validarConfiguracionModelos,
  guardarConfiguracionModelos,
};
