const test = require("node:test");
const assert = require("node:assert/strict");

const dbPath = require.resolve("../database/MySQLConexion");
let conexionesSolicitadas = 0;
let consultasRealizadas = 0;
let conexionesLiberadas = 0;

const conexion = {
  query: async () => {
    consultasRealizadas += 1;
    return [[]];
  },
  release: () => {
    conexionesLiberadas += 1;
  },
  destroy: () => {
    assert.fail("La conexión sana no debe destruirse.");
  },
};

require.cache[dbPath] = {
  exports: {
    pool: {
      getConnection: async () => {
        conexionesSolicitadas += 1;
        if (conexionesSolicitadas === 1) {
          const error = new Error("connect ETIMEDOUT");
          error.code = "ETIMEDOUT";
          error.fatal = true;
          throw error;
        }
        return conexion;
      },
    },
  },
};

const { obtenerEstado } = require("../querys/horarios.query.js");

test("reintenta la carga de horarios si falla al conectar con la base de datos", async () => {
  const estado = await obtenerEstado();

  assert.equal(conexionesSolicitadas, 2);
  assert.equal(consultasRealizadas, 6);
  assert.equal(conexionesLiberadas, 1);
  assert.deepEqual(estado, {
    registros: [],
    turnos: [],
    pagos: [],
    notificaciones: [],
    pagoPorHora: {},
    periodoPago: "semanal",
  });
});
