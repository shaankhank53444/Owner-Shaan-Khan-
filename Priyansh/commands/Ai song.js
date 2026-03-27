const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "aisong",
  version: "5.3.0",
  hasPermission: 0,
  credits: "Uzair Rajput",
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
      "║   🎵  AI SONG    ║\n" +
      "╚══════════════════╝\n\n" +
      "📖 Usage:\n" +
      "🎧 Name: aisong shape of you\n" +
      "😌 Mood: aisong sad romantic\n\n" +
      "━━━━━━━━━━━━━━━━━━━━\n" +
      "🔑 Powered by Uzair API",
      threadID, messageID
    );
  }

  const cacheDir = path.join(__dirname, "cache");
  const tmpPath = path.join(cacheDir, `aisong_${Date.now()}.mp3`);
  
  const waitMsg = await api.sendMessage(`🔎 Searching for: "${query}"...\n⏳ Please wait, processing audio.`, threadID);

  try {
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    // Step 1: Fetch Audio Stream
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
      return api.sendMessage(`❌ Size Limit! File size ${fileSizeMB}MB hai jo Facebook limit se zyada hai.`, threadID, messageID);
    }

    // --- NEW LOGIC: Sequence Sending ---

    // 1. Unsend the searching message first
    api.unsendMessage(waitMsg.messageID);

    // 2. Pehle Title aur Details send karega
    const infoMessage = `🎵 **SONG FOUND** 🎵\n━━━━━━━━━━━━━━━━━━━━\n📌 **Title:** ${query.toUpperCase()}\n📦 **Size:** ${fileSizeMB} MB\n🤖 **AI Source:** Uzair API\n━━━━━━━━━━━━━━━━━━━━\n📥 *Sending audio file now...*`;
    
    await api.sendMessage(infoMessage, threadID);

    // 3. Phir Audio File send karega (Separately)
    return api.sendMessage({
      attachment: fs.createReadStream(tmpPath)
    }, threadID, () => {
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    }, messageID);

  } catch (error) {
    console.error("[AISONG ERROR]:", error);
    if (waitMsg.messageID) api.unsendMessage(waitMsg.messageID);
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);

    return api.sendMessage(
      `❌ Error: Song nahi mil saka.\nNote: Render server start hone mein 30-40 seconds le sakta hai.`,
      threadID, messageID
    );
  }
};
