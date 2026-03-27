const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "aisong",
  version: "5.1.0",
  hasPermission: 0,
  credits: "Uzair Rajput",
  description: "AI se song dhundho aur MP3 download karo",
  commandCategory: "media",
  usages: "[song name / mood]",
  cooldowns: 10
};

const BASE_API = "https://90ea1d9c-8ea8-4769-8053-3ca0c5404f1e-00-2sn37r3e0w48y.spock.replit.dev";
const API_KEY  = "uzairmtx";

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const query = args.join(" ").trim();

  // 1. Check if query is empty
  if (!query) {
    return api.sendMessage(
      "╔══════════════════╗\n" +
      "║   🎵  AI SONG    ║\n" +
      "╚══════════════════╝\n\n" +
      "📖 Usage:\n" +
      "🎧 Name: aisong shape of you\n" +
      "😌 Mood: aisong sad romantic\n" +
      "🎸 Mix:  aisong punjabi party\n\n" +
      "━━━━━━━━━━━━━━━━━━━━\n" +
      "🔑 Powered by Shaan API",
      threadID, messageID
    );
  }

  // 2. Initializing temporary paths
  const tmpPath = path.join(__dirname, "cache", `aisong_${Date.now()}.mp3`);
  
  // 3. Sending Wait Message
  const waitMsg = await api.sendMessage(`✅Apki Request Jari Hai Please Wait...: "${query}"...\n⏳ AI processing your request, please wait.`, threadID);

  try {
    // Ensure cache folder exists
    if (!fs.existsSync(path.join(__dirname, "cache"))) {
      fs.mkdirSync(path.join(__dirname, "cache"), { recursive: true });
    }

    // Step 1: Get Song Info & Stream in one or parallel (Optimized)
    // Direct download request trigger
    const response = await axios({
      method: 'get',
      url: `${BASE_API}/play/aisong`,
      params: { query, apikey: API_KEY },
      responseType: 'stream',
      timeout: 60000 // 60 seconds timeout
    });

    // Step 2: Write file to cache
    const writer = fs.createWriteStream(tmpPath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    // Step 3: Check file size (Facebook limit is ~25MB)
    const stats = fs.statSync(tmpPath);
    const fileSizeMB = stats.size / (1024 * 1024);

    if (fileSizeMB > 25) {
      fs.unlinkSync(tmpPath);
      return api.sendMessage("❌ File size bahut badi hai (25MB+), please koi dusra song try karein.", threadID, messageID);
    }

    // Step 4: Final Message Construction
    const caption = `🎵 Audio Found!\n━━━━━━━━━━━━━━━━━━━━\n🔍 Query: ${query}\n📦 Size: ${fileSizeMB.toFixed(2)} MB\n🤖 Source: Shaan AI System\n━━━━━━━━━━━━━━━━━━━━`;

    // Unsend search message
    api.unsendMessage(waitMsg.messageID);

    // Step 5: Send the Audio File
    return api.sendMessage({
      body: caption,
      attachment: fs.createReadStream(tmpPath)
    }, threadID, () => {
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath); // Cleanup after sending
    }, messageID);

  } catch (error) {
    console.error("[AISONG ERROR]:", error);
    api.unsendMessage(waitMsg.messageID);
    
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    
    return api.sendMessage(
      `❌ Error: Song nahi mil saka.\n\nTips:\n• Internet check karein\n• Query thodi simple rakhein\n• API key ya server down ho sakta hai.`,
      threadID, messageID
    );
  }
};
