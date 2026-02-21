const axios = require("axios");
const fs = require("fs-extra");
const { alldown } = require("arif-babu-downloader");

const config = {
  name: "linkAutoDownload",
  version: "1.4.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Automatically detects links in messages and downloads the file.",
  commandCategory: "Utilities",
  usages: "",
  cooldowns: 5,
};

async function onLoad() {
  console.log(`[ ${config.name} ] Loaded - Credits: ${config.credits}`);
}

async function handleEvent({ api, event }) {
  const body = (event.body || "").toLowerCase();

  // Agar link nahi hai toh return ho jao
  if (!body.startsWith("https://")) return;

  try {
    // Processing reaction
    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    const data = await alldown(event.body);

    if (!data || !data.data || !data.data.high) {
      return api.sendMessage("❌ Valid download link not found.", event.threadID);
    }

    const videoURL = data.data.high;

    // Original logic: Buffer fetching
    const buffer = (
      await axios.get(videoURL, { responseType: "arraybuffer" })
    ).data;

    const filePath = __dirname + "/cache/auto.mp4";
    
    // Ensure cache directory exists
    if (!fs.existsSync(__dirname + "/cache")) {
        fs.mkdirSync(__dirname + "/cache");
    }

    fs.writeFileSync(filePath, buffer);

    api.setMessageReaction("✅", event.messageID, () => {}, true);

    return api.sendMessage(
      {
        body: `Downloaded by ${config.credits}`,
        attachment: fs.createReadStream(filePath),
      },
      event.threadID,
      () => {
        // File delete after sending to save space
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      },
      event.messageID
    );
  } catch (err) {
    api.setMessageReaction("❌", event.messageID, () => {}, true);
    return api.sendMessage("⚠️ Error downloading file.", event.threadID);
  }
}

async function run({ api, event }) {
    return api.sendMessage("Module is active. Just paste a link!", event.threadID);
}

module.exports = {
  config,
  onLoad,
  handleEvent,
  run
};
