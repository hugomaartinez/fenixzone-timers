const fields = {
  agentName: document.querySelector("#agentName"),
  chatlogPath: document.querySelector("#chatlogPath"),
  email: document.querySelector("#email"),
  groupId: document.querySelector("#groupId"),
  password: document.querySelector("#password"),
};
const accountEmail = document.querySelector("#account-email");
const appView = document.querySelector("#app-view");
const loginView = document.querySelector("#login-view");
const pathLabel = document.querySelector("#path");
const state = document.querySelector("#state");
const log = document.querySelector("#log");
const loginError = document.querySelector("#login-error");

let currentConfig = null;
let currentPassword = "";

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

function showLogin() {
  appView.classList.add("hidden");
  loginView.classList.remove("hidden");
  fields.password.value = "";
}

function showApp() {
  loginView.classList.add("hidden");
  appView.classList.remove("hidden");
}

function setGroupOptions(groups, selectedGroupId = "") {
  fields.groupId.innerHTML = "";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = groups.length > 0 ? "Selecciona un grupo" : "Sin grupos disponibles";
  fields.groupId.append(placeholder);

  for (const group of groups) {
    const option = document.createElement("option");
    option.value = group.id;
    option.textContent = group.name;
    fields.groupId.append(option);
  }

  fields.groupId.value = selectedGroupId;
}

function getConfigFromState() {
  return {
    ...currentConfig,
    agentName: fields.agentName.value.trim(),
    auth: {
      email: fields.email.value.trim(),
      password: currentPassword,
    },
    chatlogPath: fields.chatlogPath.value.trim(),
    fallbackIntervalMs: 306000,
    groupId: fields.groupId.value.trim(),
    heartbeatIntervalMs: 30000,
    maxIntervalMs: 325000,
    minIntervalMs: 285000,
    pollIntervalMs: 1000,
    readExistingOnStart: false,
  };
}

function fillConfig(config) {
  currentConfig = config;
  currentPassword = config.auth?.password ?? "";
  fields.agentName.value = config.agentName ?? "";
  fields.chatlogPath.value = config.chatlogPath ?? "";
  fields.email.value = config.auth?.email ?? "";
  accountEmail.textContent = config.auth?.email ?? "-";
  setGroupOptions([], config.groupId ?? "");
}

async function saveCurrentConfig() {
  const config = getConfigFromState();
  await window.transportistaAgent.saveConfig(config);
  currentConfig = config;
}

async function loadGroups({ silent = false } = {}) {
  await saveCurrentConfig();
  const groups = await window.transportistaAgent.loadGroups(getConfigFromState());
  const selectedGroupId = fields.groupId.value || currentConfig?.groupId || "";
  setGroupOptions(groups, selectedGroupId);

  if (groups.length === 1 && !selectedGroupId) {
    fields.groupId.value = groups[0].id;
    await saveCurrentConfig();
  }

  if (!silent) {
    addLog(`${groups.length} grupos cargados.`);
  }

  return groups;
}

async function connectWithCredentials(email, password) {
  fields.email.value = email;
  currentPassword = password;
  accountEmail.textContent = email;
  await loadGroups({ silent: true });
  showApp();
}

document.querySelector("#login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  loginError.classList.add("hidden");
  try {
    await connectWithCredentials(fields.email.value.trim(), fields.password.value);
    addLog("Sesion iniciada.");
  } catch (error) {
    loginError.textContent = error.message;
    loginError.classList.remove("hidden");
    addLog(error.message);
  }
});

document.querySelector("#change-account").addEventListener("click", async () => {
  await window.transportistaAgent.stop();
  currentPassword = "";
  showLogin();
});

document.querySelector("#pick-chatlog").addEventListener("click", async () => {
  const filePath = await window.transportistaAgent.pickChatlog();
  if (filePath) {
    fields.chatlogPath.value = filePath;
    await saveCurrentConfig();
  }
});

document.querySelector("#load-groups").addEventListener("click", async () => {
  try {
    await loadGroups();
  } catch (error) {
    addLog(error.message);
  }
});

fields.groupId.addEventListener("change", async () => {
  await saveCurrentConfig();
});

fields.agentName.addEventListener("change", saveCurrentConfig);
fields.chatlogPath.addEventListener("change", saveCurrentConfig);

document.querySelector("#start").addEventListener("click", async () => {
  try {
    await saveCurrentConfig();
    await window.transportistaAgent.start();
  } catch (error) {
    addLog(error.message);
  }
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

window.transportistaAgent.getConfig().then(async ({ config, resolvedChatlogPath, status }) => {
  fillConfig(config);
  setStatus({ ...status, chatlogPath: resolvedChatlogPath });

  if (config.auth?.email && config.auth?.password) {
    try {
      await connectWithCredentials(config.auth.email, config.auth.password);
    } catch {
      showLogin();
    }
  } else {
    showLogin();
  }
});
