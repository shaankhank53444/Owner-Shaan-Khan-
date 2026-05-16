const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "vm",
  version: "6.1.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "YouTube Video Downloader (Speed Fixed)",
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

    const apiUrl = `https://uzair-mtx-all-in-one-api-o213.onrender.com/download/mp4?q=${encodeURIComponent(query)}`;
    const res = await axios.get(apiUrl);
    const data = res.data;

    const downloadLink = data.downloadUrl || data.url || (data.result && data.result.downloadUrl) || (data.result && data.result.url);
    const title = data.title || (data.result && data.result.title) || "Video";

    if (!downloadLink) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage("⚠️ | Video link API response mein nahi mila.", threadID, messageID);
    }

    const cacheDir = path.join(__dirname, "cache");
    const filePath = path.join(cacheDir, `${Date.now()}.mp4`);

    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir);
    }

    // Fast downloading connection with specific headers
    const videoRes = await axios({
      method: 'get',
      url: downloadLink,
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'video/mp4,video/*;q=0.9,*/*;q=0.8'
      }
    });

    // 4MB High Water Mark chunks processing ko fast karne ke liye
    const writer = fs.createWriteStream(filePath, { highWaterMark: 4 * 1024 * 1024 });
    videoRes.data.pipe(writer);

    writer.on('finish', () => {
      api.setMessageReaction("✅", messageID, () => {}, true);
      
      // Proper readable stream for Facebook attachment to force Video player
      const fileStream = fs.createReadStream(filePath);

      api.sendMessage({
        body: `✅ Downloaded Successfully!\n\n📌 Title: ${title}\n\n»»𝑶𝑾𝑵𝑬𝑹««★™ 𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵🥀`,
        attachment: fileStream
      }, threadID, () => {
        // File send hote hi space free karne ke liye delete
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }, messageID);
    });

    writer.on('error', (err) => {
      console.error(err);
      api.sendMessage("❌ | File save karne mein error aya.", threadID, messageID);
    });

  } catch (err) {
    console.error(err);
    api.setMessageReaction("❌", messageID, () => {}, true);
    return api.sendMessage("❌ | API Error: Server response slow hai ya video zyada bari hai.", threadID, messageID);
  }
};
