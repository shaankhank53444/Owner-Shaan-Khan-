const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "aisong",
  version: "5.3.1",
  hasPermission: 0,
  credits: "Shaan Khan", // Updated creator
  description: "AI se song dhundho aur title ke saath download karo",
  commandCategory: "media",
  usages: "[song name / mood]",
  cooldowns: 10
};

const BASE_API = "https://uzairapi.onrender.com";
const API_KEY  = "uzairmtx";

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event; 
  const query = args.join(" ").trim();

  if (!query) {
    return api.sendMessage(
      "╔══════════════════╗\n" +
      "║     AI SONG      ║\n" +
      "╚══════════════════╝\n\n" +
      "Usage:\n" +
      "Name: aisong shape of you\n" +
      "Mood: aisong sad romantic\n\n" +
      "━━━━━━━━━━━━━━━━━━━━\n" +
      "Powered by Shaan Khan",
      threadID,
      messageID
    );
  }

  const cacheDir = path.join(__dirname, "cache");
  const tmpPath = path.join(cacheDir, `aisong_${Date.now()}.mp3`);

  // Searching message
  const waitMsg = await api.sendMessage("✅ Apki Request Jari Hai Please Wait...", threadID);

  try {
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    const response = await axios({
      method: 'get',
      url: `${BASE_API}/play/aisong`,
      params: { query: query, apikey: API_KEY },
      responseType: 'stream',
      timeout: 120000 
    });

    const writer = fs.createWriteStream(tmpPath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    if (!fs.existsSync(tmpPath)) {
        throw new Error("File download fail ho gayi.");
    }

    const stats = fs.statSync(tmpPath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    // Facebook limit usually around 25MB
    if (stats.size > 26214400) {
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
      api.unsendMessage(waitMsg.messageID);
      return api.sendMessage(`Size Limit! File size ${fileSizeMB}MB hai jo limit se zyada hai.`, threadID);
    }

    // Unsend searching message
    api.unsendMessage(waitMsg.messageID);

    const infoMessage = `SONG FOUND\n━━━━━━━━━━━━━━━━━━━━\nTitle: ${query.toUpperCase()}\nSize: ${fileSizeMB} MB\nAI Source: Shaan Khan\n━━━━━━━━━━━━━━━━━━━━\nSending audio file now...`;

    await api.sendMessage(infoMessage, threadID);

    // Send Audio
    return api.sendMessage({
      attachment: fs.createReadStream(tmpPath)
    }, threadID, () => {
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    });

  } catch (error) {
    console.error("[AISONG ERROR]:", error);
    if (waitMsg && waitMsg.messageID) api.unsendMessage(waitMsg.messageID);
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);

    return api.sendMessage(
      "Error: Song nahi mil saka. Shaan Khan server busy ho sakta hai ya API key ka issue ho sakta hai.",
      threadID
    );
  }
};
