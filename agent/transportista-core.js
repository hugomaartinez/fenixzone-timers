const fs = require("fs");
const path = require("path");
const os = require("os");
const { EventEmitter } = require("events");

const DEFAULT_MIN_INTERVAL_MS = 4 * 60 * 1000 + 45 * 1000;
const DEFAULT_MAX_INTERVAL_MS = 5 * 60 * 1000 + 25 * 1000;
const DEFAULT_FALLBACK_INTERVAL_MS = 306000;

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  return fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .reduce((env, line) => {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith("#")) {
        return env;
      }

      const separatorIndex = trimmedLine.indexOf("=");
      if (separatorIndex === -1) {
        return env;
      }

      const key = trimmedLine.slice(0, separatorIndex).trim();
      const value = trimmedLine.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, "");
      env[key] = value;
      return env;
    }, {});
}

function getDocumentsCandidates() {
  const candidates = [];
  const homeDir = os.homedir();

  if (process.env.USERPROFILE) {
    candidates.push(path.join(process.env.USERPROFILE, "Documents"));
    candidates.push(path.join(process.env.USERPROFILE, "OneDrive", "Documents"));
  }

  if (process.env.OneDrive) {
    candidates.push(path.join(process.env.OneDrive, "Documents"));
  }

  candidates.push(path.join(homeDir, "Documents"));

  return [...new Set(candidates)];
}

function resolveChatlogPath(configPath) {
  if (configPath) {
    return path.resolve(configPath);
  }

  const relativeChatlog = path.join(
    "GTA San Andreas User Files",
    "SAMP",
    "chatlog.txt"
  );
  const foundPath = getDocumentsCandidates()
    .map((documentsPath) => path.join(documentsPath, relativeChatlog))
    .find((candidate) => fs.existsSync(candidate));

  if (foundPath) {
    return foundPath;
  }

  return path.join(getDocumentsCandidates()[0], relativeChatlog);
}

function normalizeLine(line) {
  return line
    .replace(/\{[0-9a-fA-F]{6}\}/g, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function isTransportistaCall(line) {
  const normalizedLine = normalizeLine(line);
  return (
    normalizedLine.includes("llamando por telefono") &&
    normalizedLine.includes("4825")
  );
}

function loadConfig(configPath, envDir = path.join(__dirname, "..")) {
  const localEnv = {
    ...readEnvFile(path.join(envDir, ".env")),
    ...readEnvFile(path.join(envDir, ".env.local")),
  };
  const config = readJson(configPath);

  return {
    ...config,
    firebase: {
      ...config.firebase,
      apiKey: config.firebase?.apiKey || localEnv.NEXT_PUBLIC_FIREBASE_API_KEY,
      databaseURL:
        config.firebase?.databaseURL || localEnv.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    },
  };
}

async function firebaseRequest(databaseURL, idToken, method, firebasePath, body) {
  const cleanDatabaseURL = databaseURL.replace(/\/$/, "");
  const url = `${cleanDatabaseURL}/${firebasePath}.json?auth=${encodeURIComponent(idToken)}`;
  const response = await fetch(url, {
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method,
  });

  if (!response.ok) {
    throw new Error(`Firebase ${method} ${firebasePath} failed: ${response.status} ${await response.text()}`);
  }

  return response.json();
}

async function signIn(apiKey, email, password) {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`,
    {
      body: JSON.stringify({ email, password, returnSecureToken: true }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    }
  );

  if (!response.ok) {
    throw new Error(`Firebase Auth failed: ${response.status} ${await response.text()}`);
  }

  return response.json();
}

async function loadLastAcceptedCall(databaseURL, idToken, groupId) {
  const events = await firebaseRequest(
    databaseURL,
    idToken,
    "GET",
    `groups/${groupId}/transportista/events`
  );

  if (!events) {
    return null;
  }

  return Object.values(events)
    .filter((event) => typeof event.calledAt === "number")
    .sort((a, b) => b.calledAt - a.calledAt)[0] ?? null;
}

class TransportistaAgent extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.idToken = null;
    this.lastAcceptedCallAt = null;
    this.fileOffset = 0;
    this.pollTimer = null;
    this.heartbeatTimer = null;
    this.running = false;
    this.chatlogPath = resolveChatlogPath(config.chatlogPath);
  }

  getSettings() {
    return {
      agentName: this.config.agentName || os.hostname(),
      apiKey: this.config.firebase?.apiKey,
      databaseURL: this.config.firebase?.databaseURL,
      email: this.config.auth?.email,
      groupId: this.config.groupId,
      heartbeatIntervalMs: this.config.heartbeatIntervalMs ?? 30000,
      maxIntervalMs: this.config.maxIntervalMs ?? DEFAULT_MAX_INTERVAL_MS,
      minIntervalMs: this.config.minIntervalMs ?? DEFAULT_MIN_INTERVAL_MS,
      fallbackIntervalMs: this.config.fallbackIntervalMs ?? DEFAULT_FALLBACK_INTERVAL_MS,
      pollIntervalMs: this.config.pollIntervalMs ?? 1000,
      readExistingOnStart: Boolean(this.config.readExistingOnStart),
    };
  }

  validateConfig() {
    const settings = this.getSettings();
    if (
      !settings.apiKey ||
      !settings.databaseURL ||
      !settings.groupId ||
      !this.config.auth?.email ||
      !this.config.auth?.password
    ) {
      throw new Error("Faltan apiKey/databaseURL, groupId, email o password.");
    }
  }

  async start() {
    if (this.running) {
      return;
    }

    this.validateConfig();
    const settings = this.getSettings();
    const session = await signIn(
      settings.apiKey,
      this.config.auth.email,
      this.config.auth.password
    );
    this.idToken = session.idToken;

    const lastAcceptedEvent = await loadLastAcceptedCall(
      settings.databaseURL,
      this.idToken,
      settings.groupId
    );
    this.lastAcceptedCallAt = lastAcceptedEvent?.calledAt ?? null;

    if (fs.existsSync(this.chatlogPath) && !settings.readExistingOnStart) {
      this.fileOffset = fs.statSync(this.chatlogPath).size;
    }

    await this.writeStatus();
    this.running = true;
    this.emit("status", this.getStatus("running"));

    this.heartbeatTimer = setInterval(() => {
      this.writeStatus().catch((error) => this.emitError(error));
    }, settings.heartbeatIntervalMs);

    this.pollTimer = setInterval(() => {
      this.readNewLines().catch((error) => this.emitError(error));
    }, settings.pollIntervalMs);
  }

  stop() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
    }

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    this.pollTimer = null;
    this.heartbeatTimer = null;
    this.running = false;
    this.emit("status", this.getStatus("stopped"));
  }

  getStatus(state = this.running ? "running" : "stopped") {
    return {
      chatlogPath: this.chatlogPath,
      running: this.running,
      state,
      ...this.getSettings(),
    };
  }

  async writeStatus(extra = {}) {
    const settings = this.getSettings();
    await firebaseRequest(
      settings.databaseURL,
      this.idToken,
      "PATCH",
      `groups/${settings.groupId}/transportista/status`,
      {
        agentName: settings.agentName,
        chatlogPath: this.chatlogPath,
        fallbackIntervalMs: settings.fallbackIntervalMs,
        lastSeenAt: Date.now(),
        maxIntervalMs: settings.maxIntervalMs,
        minIntervalMs: settings.minIntervalMs,
        ...extra,
      }
    );
  }

  async acceptCall(line, calledAt, intervalMs) {
    const settings = this.getSettings();
    await firebaseRequest(
      settings.databaseURL,
      this.idToken,
      "POST",
      `groups/${settings.groupId}/transportista/events`,
      {
        agentName: settings.agentName,
        calledAt,
        detectedAt: Date.now(),
        intervalMs,
        line: line.slice(0, 300),
        source: "chatlog",
      }
    );
    this.lastAcceptedCallAt = calledAt;
    await this.writeStatus({
      lastAcceptedAt: calledAt,
      lastRejectedReason: null,
    });
    this.emit("accepted", { calledAt, intervalMs });
  }

  async rejectCall(calledAt, intervalMs, reason) {
    await this.writeStatus({
      lastRejectedAt: calledAt,
      lastRejectedIntervalMs: intervalMs,
      lastRejectedReason: reason,
    });
    this.emit("rejected", { calledAt, intervalMs, reason });
  }

  async processLine(line) {
    if (!isTransportistaCall(line)) {
      return;
    }

    const settings = this.getSettings();
    const calledAt = Date.now();
    const intervalMs = this.lastAcceptedCallAt ? calledAt - this.lastAcceptedCallAt : null;

    if (
      intervalMs !== null &&
      (intervalMs < settings.minIntervalMs || intervalMs > settings.maxIntervalMs)
    ) {
      await this.rejectCall(calledAt, intervalMs, "Interval outside realistic range");
      return;
    }

    await this.acceptCall(line, calledAt, intervalMs);
  }

  async readNewLines() {
    if (!fs.existsSync(this.chatlogPath)) {
      await this.writeStatus({ lastError: "chatlog.txt not found" });
      this.emit("status", this.getStatus("missing-chatlog"));
      return;
    }

    const stats = fs.statSync(this.chatlogPath);
    if (stats.size < this.fileOffset) {
      this.fileOffset = 0;
    }

    if (stats.size === this.fileOffset) {
      return;
    }

    const stream = fs.createReadStream(this.chatlogPath, {
      encoding: "utf8",
      start: this.fileOffset,
      end: stats.size - 1,
    });
    let chunk = "";

    for await (const data of stream) {
      chunk += data;
    }

    this.fileOffset = stats.size;
    const lines = chunk.split(/\r?\n/).filter(Boolean);

    for (const line of lines) {
      await this.processLine(line);
    }
  }

  emitError(error) {
    this.emit("error", error);
    this.emit("status", {
      ...this.getStatus("error"),
      error: error.message,
    });
  }
}

module.exports = {
  DEFAULT_FALLBACK_INTERVAL_MS,
  DEFAULT_MAX_INTERVAL_MS,
  DEFAULT_MIN_INTERVAL_MS,
  TransportistaAgent,
  getDocumentsCandidates,
  isTransportistaCall,
  loadConfig,
  readJson,
  resolveChatlogPath,
};
