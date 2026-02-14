const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { alldown } = require("arif-babu-downloader");

module.exports.config = {
  name: "linkAutoDownload",
  version: "1.6.0",
  hasPermssion: 0,
  credits: "Shaan Babu",
  description: "Detects links (FB, IG, YT, TT) and downloads automatically.",
  commandCategory: "Utilities",
  usages: "Bas link paste karein",
  cooldowns: 5,
};

module.exports.onLoad = function () {
  const filePath = __filename;
  const fileData = fs.readFileSync(filePath, "utf8");

  // Credit protection check
  if (!fileData.includes('credits: "Shaan Babu"')) {
    console.log("\n[ ERROR ] Credits modified! Module disabled for safety. ❌\n");
    process.exit(1);
  }

  // Cache folder check
  const dir = path.join(__dirname, "cache");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, body, senderID } = event;

  // Sirf valid links check karega
  if (!body || !body.startsWith("https://")) return;

  // Popular video sites ke keywords
  const supportedSites = ["tiktok.com", "facebook.com", "fb.watch", "instagram.com", "youtube.com", "youtu.be", "twitter.com", "x.com", "capcut.com"];
  const isVideoLink = supportedSites.some(site => body.includes(site));

  if (!isVideoLink) return;

  try {
    // Processing reaction
    api.setMessageReaction("⏳", messageID, () => {}, true);

    const data = await alldown(body);

    if (!data || !data.data || !data.data.high) {
      // Agar high quality na mile toh normal data check karein
      if (!data.data.low) return; 
    }

    const videoTitle = data.data.title || "No Title Found";
    const videoURL = data.data.high || data.data.low;
    const ext = videoURL.includes(".mp3") ? "mp3" : "mp4"; // Check if it's audio or video
    const fileName = `auto_${senderID}_${Date.now()}.${ext}`;
    const filePath = path.join(__dirname, "cache", fileName);

    const response = await axios.get(videoURL, { responseType: "arraybuffer" });
    fs.writeFileSync(filePath, Buffer.from(response.data, "utf-8"));

    // Success reaction
    api.setMessageReaction("✅", messageID, () => {}, true);

    const msg = {
      body: `✨❁ ━━ ━[ 𝐃𝐖-𝐎𝐖𝐍𝐄𝐑 ]━ ━━ ❁✨\n\n📝 ᴛɪᴛʟᴇ: ${videoTitle}\n\n✨❁ ━━ ━[ 𝑺𝑯𝑨𝑨𝑵 ]━ ━━ ❁✨`,
      attachment: fs.createReadStream(filePath)
    };

    return api.sendMessage(msg, threadID, () => {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }, messageID);

  } catch (err) {
    console.error("Download Error:", err);
    api.setMessageReaction("❌", messageID, () => {}, true);
  }
};

module.exports.run = async function ({ api, event }) {
  return api.sendMessage("Auto-downloader active hai. Bas video link bhejye!", event.threadID);
};
