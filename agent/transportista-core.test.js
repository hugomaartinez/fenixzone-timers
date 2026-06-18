const test = require("node:test");
const assert = require("node:assert/strict");
const {
  isTripCompletion,
  MAX_VALID_TRIP_DURATION_MS,
  parseTripDestination,
  parseTripOrigin,
} = require("./transportista-core");

test("limits valid route durations to ten minutes", () => {
  assert.equal(MAX_VALID_TRIP_DURATION_MS, 10 * 60 * 1000);
});

test("parses the assigned pickup location", () => {
  const line =
    "[22:14:43] Empresa de transporte(por celular): Hola, ¿podría ir a buscar una carga a la cantera de Hunter Quarry?";

  assert.equal(parseTripOrigin(line), "Cantera de Hunter Quarry");
});

test("parses the assigned destination and strips color codes", () => {
  const line =
    "[22:17:58] El camión fue {00CC00}cargado correctamente{FFFFFF}, entrega la carga en la obra en construcción de Doherty";

  assert.equal(parseTripDestination(line), "Obra en construcción de Doherty");
});

test("detects the completion message with or without accents", () => {
  assert.equal(
    isTripCompletion("[22:20:31] Habilidad de transportista aumentada +2 puntos."),
    true
  );
  assert.equal(
    isTripCompletion("[22:20:31] Habilidad de transportista aumentada +1 punto."),
    true
  );
});
