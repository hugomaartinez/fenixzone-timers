const fs = require("fs");
const path = require("path");
const {
  app,
  BrowserWindow,
  Menu,
  Tray,
  ipcMain,
  dialog,
  nativeImage,
} = require("electron");
const {
  TransportistaAgent,
  loadUserGroups,
  resolveChatlogPath,
} = require("../transportista-core");

const BUNDLED_FIREBASE_PATH = path.join(__dirname, "firebase-public-config.json");
let tray = null;
let window = null;
let agent = null;
let latestStatus = { running: false, state: "stopped" };

function getConfigPath() {
  return path.join(app.getPath("userData"), "transportista-agent.config.json");
}

function readBundledFirebaseConfig() {
  if (!fs.existsSync(BUNDLED_FIREBASE_PATH)) {
    return {};
  }

  return JSON.parse(fs.readFileSync(BUNDLED_FIREBASE_PATH, "utf8"));
}

function readConfig() {
  const firebase = readBundledFirebaseConfig();
  const defaultConfig = {
    agentName: app.getName(),
    auth: { email: "", password: "" },
    chatlogPath: "",
    fallbackIntervalMs: 306000,
    firebase,
    groupId: "",
    heartbeatIntervalMs: 30000,
    maxIntervalMs: 325000,
    minIntervalMs: 285000,
    pollIntervalMs: 1000,
    readExistingOnStart: false,
  };
  const configPath = getConfigPath();

  if (!fs.existsSync(configPath)) {
    return defaultConfig;
  }

  const savedConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
  return {
    ...defaultConfig,
    ...savedConfig,
    auth: { ...defaultConfig.auth, ...savedConfig.auth },
    firebase: { ...defaultConfig.firebase, ...savedConfig.firebase },
  };
}

function writeConfig(config) {
  fs.mkdirSync(path.dirname(getConfigPath()), { recursive: true });
  fs.writeFileSync(getConfigPath(), `${JSON.stringify(config, null, 2)}\n`);
}

function createTrayIcon(color = "#14b8a6") {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
    <rect width="32" height="32" rx="7" fill="#101418"/>
    <path d="M7 19h3.2l2.2-7h7.2l2.2 7H25" stroke="${color}" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="11" cy="22" r="2.4" fill="${color}"/>
    <circle cx="22" cy="22" r="2.4" fill="${color}"/>
  </svg>`;

  return nativeImage.createFromDataURL(`data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`);
}

function updateTray() {
  if (!tray) {
    return;
  }

  const running = latestStatus.running || latestStatus.state === "running";
  tray.setImage(createTrayIcon(running ? "#14b8a6" : "#737373"));
  tray.setToolTip(`Transportista Agent - ${running ? "Iniciado" : "Parado"}`);
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: running ? "Iniciado" : "Parado", enabled: false },
      { type: "separator" },
      { label: "Abrir", click: showWindow },
      { label: "Iniciar", enabled: !running, click: () => startAgent().catch(sendError) },
      { label: "Parar", enabled: running, click: stopAgent },
      { type: "separator" },
      { label: "Salir", click: () => app.quit() },
    ])
  );
}

function sendToWindow(channel, payload) {
  if (window && !window.isDestroyed()) {
    window.webContents.send(channel, payload);
  }
}

function sendStatus(status) {
  latestStatus = { ...latestStatus, ...status };
  sendToWindow("agent:status", latestStatus);
  updateTray();
}

function sendError(error) {
  sendStatus({ error: error.message, state: "error", running: false });
}

function createWindow() {
  window = new BrowserWindow({
    height: 680,
    show: false,
    title: "Transportista Agent",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.js"),
    },
    width: 520,
  });
  window.loadFile(path.join(__dirname, "renderer.html"));
  window.on("close", (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      window.hide();
    }
  });
}

function showWindow() {
  if (!window) {
    createWindow();
  }

  window.show();
  window.focus();
}

async function startAgent() {
  if (agent) {
    agent.stop();
  }

  agent = new TransportistaAgent(readConfig());
  agent.on("status", sendStatus);
  agent.on("accepted", (event) => sendToWindow("agent:event", { type: "accepted", ...event }));
  agent.on("rejected", (event) => sendToWindow("agent:event", { type: "rejected", ...event }));
  agent.on("error", sendError);
  await agent.start();
  sendStatus(agent.getStatus("running"));
}

function stopAgent() {
  if (agent) {
    agent.stop();
    agent = null;
  }

  sendStatus({ running: false, state: "stopped" });
}

ipcMain.handle("config:get", () => ({
  config: readConfig(),
  configPath: getConfigPath(),
  resolvedChatlogPath: resolveChatlogPath(readConfig().chatlogPath),
  status: latestStatus,
}));

ipcMain.handle("config:save", (_event, config) => {
  writeConfig(config);
  sendStatus({ state: "saved" });
  return { ok: true, configPath: getConfigPath() };
});

ipcMain.handle("auth:groups", async (_event, config) => {
  const nextConfig = {
    ...readConfig(),
    ...config,
    auth: { ...readConfig().auth, ...config.auth },
    firebase: { ...readConfig().firebase, ...config.firebase },
  };

  const result = await loadUserGroups(
    nextConfig.firebase?.apiKey,
    nextConfig.firebase?.databaseURL,
    nextConfig.auth?.email,
    nextConfig.auth?.password
  );

  return result.groups;
});

ipcMain.handle("chatlog:pick", async () => {
  const result = await dialog.showOpenDialog(window, {
    filters: [{ extensions: ["txt", "log"], name: "SAMP chatlog" }],
    properties: ["openFile"],
  });

  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle("agent:start", () => startAgent().then(() => ({ ok: true })));
ipcMain.handle("agent:stop", () => {
  stopAgent();
  return { ok: true };
});

app.whenReady().then(() => {
  tray = new Tray(createTrayIcon("#737373"));
  tray.on("double-click", showWindow);
  createWindow();
  updateTray();
  showWindow();
});

app.on("before-quit", () => {
  app.isQuitting = true;
  stopAgent();
});
