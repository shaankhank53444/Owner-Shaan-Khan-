const axios = require("axios");
const yts = require("yt-search");

// 🔒 CREDIT LOCK SYSTEM
const CREDIT = "Shaan Khan";
if (module.exports?.config?.credits && module.exports.config.credits !== CREDIT) {
  throw new Error("\n❌ CREDIT LOCK ACTIVATED!\nOnly Shaan Khan is allowed to edit this file.\n");
}

/* ⚙ CONFIG */
module.exports.config = {
  name: "video",
  version: "3.0.0",
  credits: "Shaan Khan",
  hasPermssion: 0,
  cooldowns: 5,
  description: "YouTube video downloader with new API",
  commandCategory: "media",
  usages: "video <name | link>"
};

/* ================= RUN ================= */
module.exports.run = async function ({ api, args, event }) {
  try {
    if (!args[0]) return api.sendMessage("❌ Video ka naam ya YouTube link do", event.threadID, event.messageID);

    const input = args.join(" ");
    const loading = await api.sendMessage("✅ Request process ho rahi hai, please wait...", event.threadID);

    // YouTube Search
    const res = await yts(input);
    const video = res.videos[0];
    if (!video) return api.sendMessage("❌ Video nahi mili.", event.threadID, event.messageID);

    // NEW API CALL (RyzenDesu API)
    // Yeh API direct download link deti hai
    const apiUrl = `https://api.ryzendesu.vip/api/downloader/ytmp4?url=${video.url}`;
    const response = await axios.get(apiUrl);
    const data = response.data;

    if (!data.url) throw new Error("Download link nahi mila.");

    api.unsendMessage(loading.messageID);

    // File Send Karein
    return api.sendMessage({
      body: `🎬 Title: ${video.title}\n»»𝑶𝑾𝑵𝑬𝑹««★™ »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««🥀\n\n📥 Link: ${data.url}`,
      attachment: await require("axios").get(data.url, { responseType: "stream" }).then(res => res.data)
    }, event.threadID, event.messageID);

  } catch (err) {
    console.error("New API Error:", err);
    return api.sendMessage("⚠️ API down hai ya link generate nahi ho paya.", event.threadID, event.messageID);
  }
};
