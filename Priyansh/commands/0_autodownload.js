const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "linkAutoDownload",
  version: "1.7.0",
  hasPermssion: 0,
  credits: "Shaan Babu",
  description: "Auto download videos from links (FB, TT, IG, YT)",
  commandCategory: "Utilities",
  usages: "Just paste the link",
  cooldowns: 5,
};

// 1. Dependency Check: Bot start hote hi check karega modules hain ya nahi
module.exports.onLoad = function () {
  try {
    require.resolve("arif-babu-downloader");
  } catch (e) {
    console.log("\n❌ ERROR: 'arif-babu-downloader' module missing! Run: npm install arif-babu-downloader\n");
  }
};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, body, senderID } = event;

  // Agar message link nahi hai toh ignore karo
  if (!body || !body.startsWith("http")) return;

  // Sirf video links ko filter karne ke liye
  const regex = /https?:\/\/(www\.)?(facebook|fb|tiktok|instagram|reels|x|twitter|youtube|youtu|capcut)\.(com|watch|be)\/.*/g;
  if (!regex.test(body)) return;

  try {
    const { alldown } = require("arif-babu-downloader");
    
    // Reaction trigger
    api.setMessageReaction("⏳", messageID, () => {}, true);

    const res = await alldown(body);
    
    // Check if data exists
    if (!res || !res.data) return;

    const videoUrl = res.data.high || res.data.low || res.data.url;
    const title = res.data.title || "No Title";

    if (!videoUrl) return;

    // File path setup
    const filePath = path.join(__dirname, `/cache/auto_${Date.now()}.mp4`);
    
    // Download process
    const videoData = (await axios.get(videoUrl, { responseType: "arraybuffer" })).data;
    fs.writeFileSync(filePath, Buffer.from(videoData, "utf-8"));

    api.setMessageReaction("✅", messageID, () => {}, true);

    return api.sendMessage({
      body: `✨❁ ━━ ━[ 𝐃𝐖-𝐎𝐖𝐍𝐄𝐑 ]━ ━━ ❁✨\n\n📝 ᴛɪᴛʟᴇ: ${title}\n\n✨❁ ━━ ━[ 𝑺𝑯𝑨𝑨𝑵 ]━ ━━ ❁✨`,
      attachment: fs.createReadStream(filePath)
    }, threadID, () => {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }, messageID);

  } catch (error) {
    console.error("Error in linkAutoDownload:", error);
    // Silent error taaki spam na ho
  }
};

module.exports.run = async function ({ api, event }) {
  return api.sendMessage("Auto-downloader active hai! Bas link bhejein.", event.threadID);
};
