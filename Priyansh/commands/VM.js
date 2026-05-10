const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "vm",
  version: "5.3.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "YouTube Video Downloader (Advanced Check)",
  commandCategory: "media",
  usages: "[song name]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const query = args.join(" ");

  if (!query) return api.sendMessage("❌ | Please enter a video name.", threadID, messageID);

  try {
    api.setMessageReaction("⏳", messageID, () => {}, true);
    api.sendMessage("🔎 | Searching & Processing...", threadID, messageID);

    const apiUrl = `https://uzair-new-music-api-all-in-one.onrender.com/api/download/youtube?q=${encodeURIComponent(query)}`;
    const res = await axios.get(apiUrl);
    
    // Debugging logic: Check if download link exists in any common field
    const videoData = res.data;
    const downloadLink = videoData.download || (videoData.results && videoData.results.download) || videoData.url;

    if (!downloadLink) {
      console.log("API Response:", videoData); // Console check for you
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage("⚠️ | Video Not Found!\nAPI جواب نہیں دے رہی یا لنک نہیں مل رہا۔", threadID, messageID);
    }

    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
    const filePath = path.join(cacheDir, `${Date.now()}_video.mp4`);

    const response = await axios({
      method: 'get',
      url: downloadLink,
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    writer.on('finish', () => {
      api.setMessageReaction("✅", messageID, () => {}, true);
      api.sendMessage({
        body: `✅ Downloaded Successfully!\n\n📌 Title: ${videoData.title || query}\n\n»»𝑶𝑾𝑵𝑬𝑹««★™ 𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵🥀`,
        attachment: fs.createReadStream(filePath)
      }, threadID, () => fs.unlinkSync(filePath), messageID);
    });

  } catch (err) {
    api.setMessageReaction("❌", messageID, () => {}, true);
    return api.sendMessage("❌ | API Error: سرور سے رابطہ نہیں ہو سکا یا فائل بہت بڑی ہے۔", threadID, messageID);
  }
};
