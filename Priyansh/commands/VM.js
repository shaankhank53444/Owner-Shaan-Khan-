const axios = require("axios");

module.exports.config = {
  name: "vm",
  version: "5.7.0", 
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "YouTube Video Downloader (Direct URL Streaming)",
  commandCategory: "media",
  usages: "[song name]",
  cooldowns: 4
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const query = args.join(" ");

  if (!query) return api.sendMessage("❌ | Please enter a video name.", threadID, messageID);

  try {
    api.setMessageReaction("⏳", messageID, () => {}, true);
    api.sendMessage("🚀 | API se direct link fetch kiya ja raha hai...", threadID, messageID);

    // Aapki original API
    const apiUrl = `https://uzair-mtx-all-in-one-api-o213.onrender.com/download/mp4?q=${encodeURIComponent(query)}`;
    
    const res = await axios.get(apiUrl, { timeout: 15000 });
    const data = res.data;

    // API response check
    const downloadLink = data.downloadUrl || data.url || (data.result && data.result.downloadUrl) || (data.result && data.result.url);
    const title = data.title || (data.result && data.result.title) || "Video";

    if (!downloadLink) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage("⚠️ | Video link API response mein nahi mila.", threadID, messageID);
    }

    api.setMessageReaction("✅", messageID, () => {}, true);

    // [SPEED ULTRA MAX] Bot download nahi karega, FB server direct API se video uthayega
    return api.sendMessage({
      body: `✅ Processed via API!\n\n📌 Title: ${title}\n\n»»𝑶𝑾𝑵𝑬𝑹««★™ 𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵🥀`,
      attachment: await axios.get(downloadLink, { responseType: 'stream' }).then(res => res.data).catch(() => downloadLink)
    }, threadID, messageID);

  } catch (err) {
    console.error(err);
    api.setMessageReaction("❌", messageID, () => {}, true);
    return api.sendMessage("❌ | API Error: Server bohot slow hai ya response nahi de raha.", threadID, messageID);
  }
};
