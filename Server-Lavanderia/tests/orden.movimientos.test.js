const test = require("node:test");
const assert = require("node:assert/strict");

const dbPath = require.resolve("../database/MySQLConexion");
const mockPool = {
  getConnection: async () => ({
    query: async () => [[]],
    execute: async () => [[], []],
    beginTransaction: async () => {},
    commit: async () => {},
    rollback: async () => {},
    release: () => {},
  }),
  execute: async () => [[], []],
  query: async () => [[]],
};

require.cache[dbPath] = {
  exports: { pool: mockPool },
};

const {
  construirTextoCambioCliente,
  obtenerFechaHoraNegocioMySQL,
  contarDiasMora,
  calcularPausaMoraDesdeHoy,
} = require("../querys/orden.query.js");

test("genera un movimiento específico cuando cambian nombre, correo o teléfono de la orden", () => {
  const texto = construirTextoCambioCliente({
    nombreClienteAnterior: "Ana",
    nombreClienteNuevo: "Ana Laura",
    correoAnterior: "ana@mail.com",
    correoNuevo: "ana.nueva@mail.com",
    telefonoAnterior: "123456",
    telefonoNuevo: "7654321",
  });

  assert.equal(
    texto,
    'Datos del cliente actualizados: nombre "Ana" → "Ana Laura"; correo "ana@mail.com" → "ana.nueva@mail.com"; número "123456" → "7654321"',
  );
});

test("incluye el código de país al registrar un cambio de teléfono", () => {
  const texto = construirTextoCambioCliente({
    codigoPaisAnterior: "+503",
    codigoPaisNuevo: "+1",
    telefonoAnterior: "7654321",
    telefonoNuevo: "7654321",
  });

  assert.equal(
    texto,
    'Datos del cliente actualizados: número "+503 7654321" → "+1 7654321"',
  );
});

test("formatea la fecha del pago en la zona horaria del negocio", () => {
  assert.equal(
    obtenerFechaHoraNegocioMySQL(new Date("2026-10-07T03:00:00.000Z")),
    "2026-10-06 21:00:00",
  );
});

test("inicia la mora al tercer día calendario posterior a la fecha prometida", () => {
  const orden = {
    mora_activa: true,
    fecha_entrega: "2026-10-01",
    hora_entrega: "12:00",
    estado: "pendiente",
    mora_pausa_segundos: 0,
    mora_detenida_at: null,
  };

  assert.equal(contarDiasMora(orden, "2026-10-01 23:59:59"), 0);
  assert.equal(contarDiasMora(orden, "2026-10-02 12:00:00"), 0);
  assert.equal(contarDiasMora(orden, "2026-10-03 12:00:00"), 0);
  assert.equal(contarDiasMora(orden, "2026-10-04 00:00:00"), 1);
  assert.equal(contarDiasMora(orden, "2026-10-05 00:00:00"), 2);
});

test("reinicia cargos de mora vencida sin cobrar días anteriores", () => {
  const moraPausaSegundos = calcularPausaMoraDesdeHoy(
    "2026-10-01",
    "12:00:00",
    "2026-10-10 12:00:00",
  );
  const orden = {
    mora_activa: true,
    fecha_entrega: "2026-10-01",
    hora_entrega: "12:00:00",
    estado: "pendiente",
    mora_pausa_segundos: moraPausaSegundos,
    mora_detenida_at: null,
  };

  assert.equal(contarDiasMora(orden, "2026-10-10 12:00:00"), 0);
  assert.equal(contarDiasMora(orden, "2026-10-11 00:00:00"), 1);
});

test("reiniciar mora no adelanta el cobro antes de la fecha prometida y los días de gracia", () => {
  const moraPausaSegundos = calcularPausaMoraDesdeHoy(
    "2026-10-15",
    "12:00:00",
    "2026-10-10 12:00:00",
  );
  const orden = {
    mora_activa: true,
    fecha_entrega: "2026-10-15",
    hora_entrega: "12:00:00",
    estado: "pendiente",
    mora_pausa_segundos: moraPausaSegundos,
    mora_detenida_at: null,
  };

  assert.equal(moraPausaSegundos, 0);
  assert.equal(contarDiasMora(orden, "2026-10-17 12:00:00"), 0);
  assert.equal(contarDiasMora(orden, "2026-10-18 00:00:00"), 1);
});
