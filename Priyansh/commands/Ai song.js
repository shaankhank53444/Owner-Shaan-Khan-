const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "aisong",
  version: "5.3.0",
  hasPermission: 0,
  credits: "Shaan Khan",
  description: "AI se song dhundho aur title ke saath download karo",
  commandCategory: "media",
  usages: "[song name / mood]",
  cooldowns: 10
};

const BASE_API = "https://uzairapi.onrender.com";
const API_KEY  = "uzairmtx";

module.exports.run = async function ({ api, event, args }) {
  const { threadID } = event; 
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
      threadID
    );
  }

  const cacheDir = path.join(__dirname, "cache");
  const tmpPath = path.join(cacheDir, `aisong_${Date.now()}.mp3`);

  // Searching message without query
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

    const stats = fs.statSync(tmpPath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    if (stats.size > 26214400) {
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
      return api.sendMessage(`Size Limit! File size ${fileSizeMB}MB hai jo Facebook limit se zyada hai.`, threadID);
    }

    // 1. Unsend searching message
    api.unsendMessage(waitMsg.messageID);

    // 2. Info Message without stars or bold
    const infoMessage = `SONG FOUND\n━━━━━━━━━━━━━━━━━━━━\nTitle: ${query.toUpperCase()}\nSize: ${fileSizeMB} MB\nAI Source: Shaan Khan\n━━━━━━━━━━━━━━━━━━━━\nSending audio file now...`;

    await api.sendMessage(infoMessage, threadID);

    // 3. Send Audio (Directly, no reply)
    return api.sendMessage({
      attachment: fs.createReadStream(tmpPath)
    }, threadID, () => {
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    });

  } catch (error) {
    console.error("[AISONG ERROR]:", error);
    if (waitMsg.messageID) api.unsendMessage(waitMsg.messageID);
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);

    return api.sendMessage(
      "Error: Song nahi mil saka. Shaan Khan server busy ho sakta hai.",
      threadID
    );
  }
};
