const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const path = require("path");

console.log("Rutas de speech cargadas correctamente");

// Configuración de multer para recibir archivos de audio
const upload = multer({
  dest: path.join(__dirname, "../temp-audio"),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB máximo
  },
});

// Endpoint para transcripción de audio usando API externa
router.post("/transcribe", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se recibió archivo de audio" });
    }

    const audioPath = req.file.path;
    console.log("Archivo de audio recibido:", audioPath);

    try {
      // Intentar usar diferentes métodos de transcripción
      let textoTranscrito = "";

      // Verificar si hay API keys configuradas
      const hasOpenAIKey = process.env.OPENAI_API_KEY;
      const hasAssemblyAIKey = process.env.ASSEMBLYAI_API_KEY;

      if (hasOpenAIKey) {
        console.log("Usando OpenAI Whisper para transcripción");
        textoTranscrito = await transcribeWithOpenAI(audioPath);
      } else if (hasAssemblyAIKey) {
        console.log("Usando Assembly AI para transcripción");
        textoTranscrito = await transcribeWithAssemblyAI(audioPath);
      } else {
        // Fallback: texto de ejemplo para pruebas
        console.log("No hay API keys configuradas, usando texto de ejemplo");
        textoTranscrito = "hola burbujita"; // Texto de ejemplo para pruebas
      }

      // Limpiar archivo temporal
      fs.unlinkSync(audioPath);

      res.json({
        texto: textoTranscrito,
        exito: true,
      });
    } catch (error) {
      console.error("Error en transcripción:", error);

      // Limpiar archivo temporal en caso de error
      if (fs.existsSync(audioPath)) {
        fs.unlinkSync(audioPath);
      }

      res.status(500).json({
        error: "No se pudo transcribir el audio",
        detalle: error.message,
      });
    }
  } catch (error) {
    console.error("Error procesando solicitud de transcripción:", error);
    res.status(500).json({
      error: "Error interno del servidor",
      detalle: error.message,
    });
  }
});

// Función para transcribir con Assembly AI (requiere API key)
async function transcribeWithAssemblyAI(audioPath) {
  const AssemblyAI = require("assemblyai");
  const assemblyAI = new AssemblyAI({
    apiKey: process.env.ASSEMBLYAI_API_KEY,
  });

  const audioData = fs.readFileSync(audioPath);
  const transcript = await assemblyAI.transcripts.transcribe({
    audio: audioData,
  });

  return transcript.text;
}

// Función para transcribir con OpenAI Whisper (requiere API key)
async function transcribeWithOpenAI(audioPath) {
  const FormData = require("form-data");
  const fs = require("fs");
  const axios = require("axios");

  const form = new FormData();
  form.append("file", fs.createReadStream(audioPath));
  form.append("model", "whisper-1");

  const response = await axios.post(
    "https://api.openai.com/v1/audio/transcriptions",
    form,
    {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    }
  );

  return response.data.text;
}

module.exports = router;