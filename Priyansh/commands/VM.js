const axios = require("axios");

module.exports.config = {
  name: "vm",
  version: "5.9.0", 
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "YouTube Video Downloader (360p Max 100MB Buffer)",
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
    api.sendMessage("🔎 | Searching & Processing (360p)...", threadID, messageID);

    // API URL mein quality parameter add kar diya gaya hai (360p forced)
    const apiUrl = `https://uzair-mtx-all-in-one-api-o213.onrender.com/download/mp4?q=${encodeURIComponent(query)}&quality=360`;
    const res = await axios.get(apiUrl);
    const data = res.data;

    // API structure checking
    const downloadLink = data.downloadUrl || data.url || (data.result && data.result.downloadUrl) || (data.result && data.result.url);
    const title = data.title || (data.result && data.result.title) || "Video";

    if (!downloadLink) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage("⚠️ | Video link API response mein nahi mila.", threadID, messageID);
    }

    // Size check directly from headers first to prevent crashing on >100MB
    const checkHeader = await axios.head(downloadLink).catch(() => null);
    if (checkHeader && checkHeader.headers['content-length']) {
      const fileSizeInMB = checkHeader.headers['content-length'] / (1024 * 1024);
      if (fileSizeInMB > 100) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage(`⚠️ | Video size (${fileSizeInMB.toFixed(1)}MB) 360p hone ke bawajood 100MB se barha hai.`, threadID, messageID);
      }
    }

    // Direct High-Speed Memory Buffer (100MB strict network limit)
    const videoResponse = await axios.get(downloadLink, { 
      responseType: 'arraybuffer',
      maxContentLength: 104857600, 
      maxBodyLength: 104857600
    });
    
    const videoBuffer = Buffer.from(videoResponse.data, 'binary');

    api.setMessageReaction("✅", messageID, () => {}, true);

    // Sending directly as 360p video attachment
    await api.sendMessage({
      body: `✅ Downloaded Successfully (360p)!\n\n📌 Title: ${title}\n\n»»𝑶𝑾𝑵𝑬𝑹««★™ 𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵🥀`,
      attachment: videoBuffer
    }, threadID, messageID);

  } catch (err) {
    console.error(err);
    api.setMessageReaction("❌", messageID, () => {}, true);
    return api.sendMessage("❌ | Error: Video processing fail ho gayi ya file size 100MB se barha hai.", threadID, messageID);
  }
};
