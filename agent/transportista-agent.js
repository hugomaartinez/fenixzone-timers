const path = require("path");
const fs = require("fs");
const { TransportistaAgent, loadConfig } = require("./transportista-core");

const CONFIG_PATH = path.join(__dirname, "transportista-agent.config.json");
const EXAMPLE_CONFIG_PATH = path.join(__dirname, "transportista-agent.config.example.json");

async function main() {
  if (!fs.existsSync(CONFIG_PATH)) {
    throw new Error(
      `Missing config file: ${CONFIG_PATH}. Use ${EXAMPLE_CONFIG_PATH} as a template.`
    );
  }

  const agent = new TransportistaAgent(loadConfig(CONFIG_PATH));

  agent.on("status", (status) => {
    console.log(`Status: ${status.state}. Watching: ${status.chatlogPath}`);
  });
  agent.on("accepted", ({ calledAt }) => {
    console.log(`Accepted transportista call at ${new Date(calledAt).toLocaleTimeString()}`);
  });
  agent.on("rejected", ({ intervalMs, reason }) => {
    console.log(`Rejected transportista call: ${reason} (${intervalMs}ms)`);
  });
  agent.on("error", (error) => {
    console.error(error.message);
  });

  await agent.start();
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
