const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.join(__dirname, "..");
const OUTPUT_PATH = path.join(__dirname, "desktop", "firebase-public-config.json");

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

const env = {
  ...readEnvFile(path.join(ROOT_DIR, ".env")),
  ...readEnvFile(path.join(ROOT_DIR, ".env.local")),
};
const config = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  databaseURL: env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ?? "",
};

fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(config, null, 2)}\n`);
console.log(`Wrote ${OUTPUT_PATH}`);
