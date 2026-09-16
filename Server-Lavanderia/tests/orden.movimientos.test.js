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

const { construirTextoCambioCliente } = require("../querys/orden.query.js");

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
