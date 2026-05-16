const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "VM",
  version: "5.6.0", 
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "YouTube Video Downloader (Uzair Rajput API Optimized)",
  commandCategory: "media",
  usages: "[song name / video link]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const query = args.join(" ");

  if (!query) return api.sendMessage("❌ | Please enter a video name or YouTube link.", threadID, messageID);

  try {
    api.setMessageReaction("⏳", messageID, () => {}, true);
    api.sendMessage("🔎 | Searching & Processing via Uzair Rajput API...", threadID, messageID);

    // New API Endpoint Connection
    const apiUrl = `https://uzairrajputapis.qzz.io/api/downloader/youtube?url=${encodeURIComponent(query)}`;
    const res = await axios.get(apiUrl);
    const data = res.data;

    // Dynamic Response Mapping for Uzair's API Structure
    const downloadLink = data.downloadUrl || data.url || (data.result && data.result.downloadUrl) || (data.result && data.result.url) || (data.data && data.data.download);
    const title = data.title || (data.result && data.result.title) || (data.data && data.data.title) || "Video";

    if (!downloadLink) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage("⚠️ | Video link API response mein nahi mila. Host ne format change kiya ho sakta hai.", threadID, messageID);
    }

    const filePath = path.join(__dirname, "cache", `${Date.now()}.mp4`);

    // Ensure cache directory exists
    await fs.ensureDir(path.join(__dirname, "cache"));

    // Fast buffer-based stream download 
    const response = await axios({
      method: 'get',
      url: downloadLink,
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });

    // Write to memory instantly 
    await fs.writeFile(filePath, Buffer.from(response.data));

    // Send payload immediately
    api.setMessageReaction("✅", messageID, () => {}, true);
    
    await api.sendMessage({
      body: `✅ Downloaded Successfully!\n\n📌 Title: ${title}\n\n»»𝑶𝑾𝑵𝑬𝑹««★™ 𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵🥀`, 
      attachment: fs.createReadStream(filePath)
    }, threadID, messageID);

    // Clean cache instantly
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

  } catch (err) {
    console.error(err);
    api.setMessageReaction("❌", messageID, () => {}, true);
    return api.sendMessage("❌ | New API Error: Server down hai ya query invalid hai.", threadID, messageID);
  }
};
