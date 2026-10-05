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
