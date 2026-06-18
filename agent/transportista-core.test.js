const test = require("node:test");
const assert = require("node:assert/strict");
const {
  isTripCompletion,
  MAX_VALID_TRIP_DURATION_MS,
  parseTripDestination,
  parseTripOrigin,
  TransportistaAgent,
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

test("renews an expired Firebase session and retries the request", async () => {
  const originalFetch = global.fetch;
  const calls = [];
  global.fetch = async (url, options) => {
    calls.push({ url, options });

    if (calls.length === 1) {
      return new Response('{ "error": "Permission denied" }', { status: 401 });
    }

    if (calls.length === 2) {
      return Response.json({ idToken: "renewed-token", localId: "user-id" });
    }

    return Response.json({ ok: true });
  };

  try {
    const agent = new TransportistaAgent({
      auth: { email: "user@example.com", password: "secret" },
      firebase: {
        apiKey: "api-key",
        databaseURL: "https://example.firebaseio.com",
      },
      groupId: "group-id",
    });
    agent.idToken = "expired-token";

    await agent.request("PUT", "groups/group-id/transportista/trips/trip-id", {
      origin: "Bayside",
    });

    assert.equal(calls.length, 3);
    assert.match(calls[0].url, /auth=expired-token/);
    assert.match(calls[1].url, /signInWithPassword/);
    assert.match(calls[2].url, /auth=renewed-token/);
  } finally {
    global.fetch = originalFetch;
  }
});
