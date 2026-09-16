const express = require("express");
const { MsEdgeTTS, OUTPUT_FORMAT } = require("msedge-tts");

const router = express.Router();

router.post("/tts", async (req, res) => {
  const { texto, voz } = req.body;

  if (!texto || !texto.trim()) {
    return res.status(400).json({ error: "Falta el texto a convertir." });
  }

  try {
    const tts = new MsEdgeTTS();
    await tts.setMetadata(
      voz || process.env.SALI_TTS_VOICE || "es-CO-SalomeNeural",
      OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3,
    );

    res.setHeader("Content-Type", "audio/mpeg");
    const { audioStream } = tts.toStream(texto);
    audioStream.pipe(res);

    audioStream.on("error", (error) => {
      console.error("Error generando audio:", error.message);
      if (!res.headersSent) {
        res.status(500).json({ error: "No se pudo generar el audio." });
      }
    });
  } catch (error) {
    console.error("Error en /tts:", error.message);
    res.status(500).json({ error: "No se pudo generar el audio." });
  }
});

module.exports = router;
