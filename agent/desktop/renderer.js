const fields = {
  agentName: document.querySelector("#agentName"),
  apiKey: document.querySelector("#apiKey"),
  chatlogPath: document.querySelector("#chatlogPath"),
  databaseURL: document.querySelector("#databaseURL"),
  email: document.querySelector("#email"),
  groupId: document.querySelector("#groupId"),
  password: document.querySelector("#password"),
};
const state = document.querySelector("#state");
const pathLabel = document.querySelector("#path");
const log = document.querySelector("#log");

function addLog(message) {
  const line = document.createElement("div");
  line.className = "log-line";
  line.textContent = `${new Date().toLocaleTimeString()} - ${message}`;
  log.prepend(line);
}

function setStatus(status) {
  state.textContent = status.running || status.state === "running" ? "Iniciado" : "Parado";
  state.classList.toggle("running", status.running || status.state === "running");
  pathLabel.textContent = status.chatlogPath ?? "Chatlog automatico";

  if (status.error) {
    addLog(status.error);
  }
}

function fillForm(config) {
  fields.agentName.value = config.agentName ?? "";
  fields.apiKey.value = config.firebase?.apiKey ?? "";
  fields.chatlogPath.value = config.chatlogPath ?? "";
  fields.databaseURL.value = config.firebase?.databaseURL ?? "";
  fields.email.value = config.auth?.email ?? "";
  fields.groupId.value = config.groupId ?? "";
  fields.password.value = config.auth?.password ?? "";
}

function readForm() {
  return {
    agentName: fields.agentName.value.trim(),
    auth: {
      email: fields.email.value.trim(),
      password: fields.password.value,
    },
    chatlogPath: fields.chatlogPath.value.trim(),
    fallbackIntervalMs: 306000,
    firebase: {
      apiKey: fields.apiKey.value.trim(),
      databaseURL: fields.databaseURL.value.trim(),
    },
    groupId: fields.groupId.value.trim(),
    heartbeatIntervalMs: 30000,
    maxIntervalMs: 325000,
    minIntervalMs: 285000,
    pollIntervalMs: 1000,
    readExistingOnStart: false,
  };
}

document.querySelector("#config-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  await window.transportistaAgent.saveConfig(readForm());
  addLog("Configuracion guardada.");
});

document.querySelector("#pick-chatlog").addEventListener("click", async () => {
  const filePath = await window.transportistaAgent.pickChatlog();
  if (filePath) {
    fields.chatlogPath.value = filePath;
  }
});

document.querySelector("#start").addEventListener("click", async () => {
  await window.transportistaAgent.saveConfig(readForm());
  await window.transportistaAgent.start();
});

document.querySelector("#stop").addEventListener("click", async () => {
  await window.transportistaAgent.stop();
});

window.transportistaAgent.onStatus(setStatus);
window.transportistaAgent.onEvent((event) => {
  if (event.type === "accepted") {
    addLog("Llamada aceptada.");
  } else {
    addLog(`Llamada descartada: ${event.reason}`);
  }
});

window.transportistaAgent.getConfig().then(({ config, resolvedChatlogPath, status }) => {
  fillForm(config);
  setStatus({ ...status, chatlogPath: resolvedChatlogPath });
});
