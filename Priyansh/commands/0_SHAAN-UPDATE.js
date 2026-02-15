const axios = require("axios");
const { execSync } = require("child_process");
const logger = require("../../utils/log");
const config = require("../../config.json");

module.exports.config = {
  name: "update",
  version: "1.0.0",
  hasPermssion: 2,
  credits: "ARIF BABU",
  description: "Update bot from original GitLab repo",
  commandCategory: "system",
  usages: "update",
  cooldowns: 10
};

// 🔥 ORIGINAL GITLAB RAW CONFIG (DO NOT CHANGE FOR FORKS)
const REMOTE_CONFIG_URL =
  "https://gitlab.com/rajputmukku02/ARIF-BABU-v2/-/raw/main/config.json";

module.exports.run = async function ({ api, event }) {
  try {
    // 🔒 Admin check extra safety
    if (!config.ADMINBOT.includes(event.senderID)) {
      return api.sendMessage(
        "❌ Sirf bot owner update chala sakta hai",
        event.threadID
      );
    }

    api.sendMessage("🔍 Update check ho raha hai...", event.threadID);

    const res = await axios.get(REMOTE_CONFIG_URL, { timeout: 10000 });

    const remoteVersion = res.data.version;
    const localVersion = config.version;

    if (!remoteVersion) {
      return api.sendMessage(
        "❌ Remote version nahi mili",
        event.threadID
      );
    }

    if (remoteVersion === localVersion) {
      return api.sendMessage(
        `✅ Bot already latest hai (v${localVersion})`,
        event.threadID
      );
    }

    api.sendMessage(
      `⚠️ Update mil gaya!\n\nCurrent: ${localVersion}\nNew: ${remoteVersion}\n\n⏳ Updating...`,
      event.threadID
    );

    // 🔁 GIT UPDATE
    execSync("git fetch --all", { stdio: "inherit" });
    execSync("git reset --hard origin/main", { stdio: "inherit" });
    execSync("npm install", { stdio: "inherit" });

    api.sendMessage(
      "✅ Update complete!\n♻️ Bot restart ho raha hai...",
      event.threadID
    );

    logger(
      `Updated from ${localVersion} to ${remoteVersion}`,
      "[ UPDATE ]"
    );

    // ♻️ Restart bot
    process.exit(1);

  } catch (err) {
    api.sendMessage(
      "❌ Update failed!\n" + err.message,
      event.threadID
    );
    logger(err.message, "[ UPDATE ERROR ]");
  }
};