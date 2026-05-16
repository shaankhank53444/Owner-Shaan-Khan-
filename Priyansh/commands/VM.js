const axios = require("axios");

module.exports.config = {
  name: "vm",
  version: "6.0.0", // Major upgrade for speed
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "YouTube Video Downloader (Instant Buffer Stream)",
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
    api.sendMessage("🔎 | Searching & Fast Processing...", threadID, messageID);

    const apiUrl = `https://uzair-mtx-all-in-one-api-o213.onrender.com/download/mp4?q=${encodeURIComponent(query)}`;
    const res = await axios.get(apiUrl);
    const data = res.data;

    const downloadLink = data.downloadUrl || data.url || (data.result && data.result.downloadUrl) || (data.result && data.result.url);
    const title = data.title || (data.result && data.result.title) || "Video";

    if (!downloadLink) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage("⚠️ | Video link API response mein nahi mila.", threadID, messageID);
    }

    // Direct stream connection without saving to disk
    const videoStream = await axios({
      method: 'get',
      url: downloadLink,
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*'
      }
    });

    api.setMessageReaction("✅", messageID, () => {}, true);

    // Direct buffer transmission to Messenger
    return api.sendMessage({
      body: `✅ Downloaded Successfully!\n\n📌 Title: ${title}\n\n»»𝑶𝑾𝑵𝑬𝑹««★™ 𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵🥀`,
      attachment: videoStream.data // Direct Stream link pass kar di
    }, threadID, messageID);

  } catch (err) {
    console.error(err);
    api.setMessageReaction("❌", messageID, () => {}, true);
    return api.sendMessage("❌ | Speed Error: Server heavy download handle nahi kar pa raha.", threadID, messageID);
  }
};
