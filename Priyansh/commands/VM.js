const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "vm",
  version: "5.4.0", // Updated version
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "YouTube Video Downloader (API Optimized)",
  commandCategory: "media",
  usages: "[song name]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const query = args.join(" ");

  if (!query) return api.sendMessage("❌ | Please enter a video name.", threadID, messageID);

  try {
    api.setMessageReaction("⏳", messageID, () => {}, true);
    api.sendMessage("🔎 | Searching & Processing...", threadID, messageID);

    // API Call
    const apiUrl = `https://uzair-new-music-api-all-in-one.onrender.com/api/download/youtube?q=${encodeURIComponent(query)}`;
    const res = await axios.get(apiUrl);
    
    const data = res.data;

    // API کے مختلف ممکنہ سٹرکچرز کی چیکنگ
    const downloadLink = data.downloadUrl || data.url || (data.result && data.result.downloadUrl);
    const title = data.title || "Video";

    if (!downloadLink) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage("⚠️ | Video link not found in API response.", threadID, messageID);
    }

    const filePath = path.join(__dirname, "cache", `${Date.now()}.mp4`);
    
    // Ensure cache directory exists
    if (!fs.existsSync(path.join(__dirname, "cache"))) {
      fs.mkdirSync(path.join(__dirname, "cache"));
    }

    // Downloading the file
    const videoRes = await axios({
      method: 'get',
      url: downloadLink,
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(filePath);
    videoRes.data.pipe(writer);

    writer.on('finish', () => {
      api.setMessageReaction("✅", messageID, () => {}, true);
      api.sendMessage({
        body: `✅ Downloaded Successfully!\n\n📌 Title: ${title}\n\n»»𝑶𝑾𝑵𝑬𝑹««★™ 𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵🥀`,
        attachment: fs.createReadStream(filePath)
      }, threadID, () => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }, messageID);
    });

    writer.on('error', (err) => {
      console.error(err);
      api.sendMessage("❌ | Error writing file.", threadID, messageID);
    });

  } catch (err) {
    console.error(err);
    api.setMessageReaction("❌", messageID, () => {}, true);
    return api.sendMessage("❌ | API Error: سرور سے رابطہ نہیں ہو سکا یا فائل بہت بڑی ہے۔", threadID, messageID);
  }
};
