const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("transportistaAgent", {
  getConfig: () => ipcRenderer.invoke("config:get"),
  onEvent: (callback) => ipcRenderer.on("agent:event", (_event, payload) => callback(payload)),
  onStatus: (callback) => ipcRenderer.on("agent:status", (_event, payload) => callback(payload)),
  pickChatlog: () => ipcRenderer.invoke("chatlog:pick"),
  saveConfig: (config) => ipcRenderer.invoke("config:save", config),
  start: () => ipcRenderer.invoke("agent:start"),
  stop: () => ipcRenderer.invoke("agent:stop"),
});
