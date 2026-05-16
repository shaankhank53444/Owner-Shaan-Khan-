const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "video",
  version: "5.5.0", // Upgraded version
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "YouTube Video Downloader (Speed Optimized)",
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
    const infoMessage = await api.sendMessage("🔎 | Searching & Processing...", threadID, messageID);

    // Fetch API Data
    const apiUrl = `https://uzair-mtx-all-in-one-api-o213.onrender.com/download/mp4?q=${encodeURIComponent(query)}`;
    const res = await axios.get(apiUrl);
    const data = res.data;

    // API fallback structures
    const downloadLink = data.downloadUrl || data.url || (data.result && data.result.downloadUrl) || (data.result && data.result.url);
    const title = data.title || (data.result && data.result.title) || "Video";

    if (!downloadLink) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage("⚠️ | Video link API response mein nahi mila.", threadID, messageID);
    }

    const filePath = path.join(__dirname, "cache", `${Date.now()}.mp4`);

    // Ensure cache directory exists
    await fs.ensureDir(path.join(__dirname, "cache"));

    // Fast download direct to buffer/file path
    const response = await axios({
      method: 'get',
      url: downloadLink,
      responseType: 'arraybuffer', // Arraybuffer integration for faster I/O speed
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });

    // Write file instantly from buffer (Much faster than piping stream for small/medium files)
    await fs.writeFile(filePath, Buffer.from(response.data));

    // Send the video instantly
    api.setMessageReaction("✅", messageID, () => {}, true);
    
    await api.sendMessage({
      body: `✅ Downloaded Successfully!\n\n📌 Title: ${title}\n\n»»𝑶𝑾𝑵𝑬𝑹««★™ 𝑨𝑹𝑺𝑯-𝑨𝑹𝑺𝑯𝑰🥀`, 
      attachment: fs.createReadStream(filePath)
    }, threadID, messageID);

    // Delete file immediately after sending
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

  } catch (err) {
    console.error(err);
    api.setMessageReaction("❌", messageID, () => {}, true);
    return api.sendMessage("❌ | Speed Error: Server busy hai ya video size limit se zyada hai.", threadID, messageID);
  }
};
