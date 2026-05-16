const axios = require("axios");

module.exports.config = {
  name: "vm",
  version: "5.6.0", 
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "YouTube Video Downloader (High-Speed Buffer Optimized)",
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

    // API URL
    const apiUrl = `https://uzair-mtx-all-in-one-api-o213.onrender.com/download/mp4?q=${encodeURIComponent(query)}`;
    const res = await axios.get(apiUrl);
    const data = res.data;

    // API structure check
    const downloadLink = data.downloadUrl || data.url || (data.result && data.result.downloadUrl) || (data.result && data.result.url);
    const title = data.title || (data.result && data.result.title) || "Video";

    if (!downloadLink) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage("⚠️ | Video link API response mein nahi mila.", threadID, messageID);
    }

    // Video ko direct Memory Buffer mein download karna (No Hard Disk Use = Super Fast)
    const videoResponse = await axios.get(downloadLink, { responseType: 'arraybuffer' });
    const videoBuffer = Buffer.from(videoResponse.data, 'binary');

    // Check if buffer size is too large for Facebook (Max 25MB approx)
    if (videoBuffer.length > 26214400) { 
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage("⚠️ | Video file bohot barhi hai, Facebook limits se zyada hai.", threadID, messageID);
    }

    api.setMessageReaction("✅", messageID, () => {}, true);

    // Sending as actual MP4 video file from memory
    await api.sendMessage({
      body: `✅ Downloaded Successfully!\n\n📌 Title: ${title}\n\n»»𝑶𝑾𝑵𝑬𝑹««★™ 𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵🥀`,
      attachment: videoBuffer
    }, threadID, messageID);

  } catch (err) {
    console.error(err);
    api.setMessageReaction("❌", messageID, () => {}, true);
    return api.sendMessage("❌ | Error: Video processing fail ho gayi ya size barha hai.", threadID, messageID);
  }
};
