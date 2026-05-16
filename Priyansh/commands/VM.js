const axios = require("axios");

module.exports.config = {
  name: "vm",
  version: "5.5.0", // Updated version for optimization
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "YouTube Video Downloader (High-Speed Stream Optimized)",
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
    const statusMsg = await api.sendMessage("🔎 | Searching & Processing...", threadID, messageID);

    // Optimized API URL
    const apiUrl = `https://uzair-mtx-all-in-one-api-o213.onrender.com/download/mp4?q=${encodeURIComponent(query)}`;
    const res = await axios.get(apiUrl);
    const data = res.data;

    // API structures checking
    const downloadLink = data.downloadUrl || data.url || (data.result && data.result.downloadUrl) || (data.result && data.result.url);
    const title = data.title || (data.result && data.result.title) || "Video";

    if (!downloadLink) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage("⚠️ | Video link API response mein nahi mila.", threadID, messageID);
    }

    // Direct Buffer Stream Fetching (Super Fast)
    const videoRes = await axios.get(downloadLink, { responseType: 'stream' });

    api.setMessageReaction("✅", messageID, () => {}, true);

    // Direct stream to Facebook API without saving to local storage
    await api.sendMessage({
      body: `✅ Downloaded Successfully!\n\n📌 Title: ${title}\n\n»»𝑶𝑾𝑵𝑬𝑹««★™ 𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵🥀`,
      attachment: videoRes.data
    }, threadID, messageID);

  } catch (err) {
    console.error(err);
    api.setMessageReaction("❌", messageID, () => {}, true);
    return api.sendMessage("❌ | API Error: Video size zyada ho sakti hai ya server down hai.", threadID, messageID);
  }
};
