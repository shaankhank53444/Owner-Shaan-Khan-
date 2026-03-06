const fs = require("fs");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "linkAutoDownload",
    version: "1.7.0",
    hasPermssion: 0,
    credits: "Shaan Babu",
    description: "Downloads video and auto-creates cache folder.",
    commandCategory: "Utilities",
    usages: "",
    cooldowns: 5,
  },

  onLoad: function () {
    // Cache folder check aur create karne ka sabse safe tareeka
    const cachePath = path.join(__dirname, "cache");
    if (!fs.existsSync(cachePath)) {
      fs.mkdirSync(cachePath, { recursive: true });
      console.log("✅ [Shaan-Downloader] Cache folder created!");
    }

    const fileData = fs.readFileSync(__filename, "utf8");
    if (!fileData.includes('credits: "Shaan Babu"')) {
      console.log("❌ ERROR: Credits Changed! Bot Stopping...");
      process.exit(1);
    }
  },

  run: async function ({ api, event }) {
    // Empty run function to avoid Mirai errors
  },

  handleEvent: async function ({ api, event }) {
    const { threadID, messageID, body: msgBody, senderID } = event;
    
    if (!msgBody || !msgBody.startsWith("https://")) return;

    // Package check (Aksar log install karna bhool jate hain)
    let alldown;
    try {
      alldown = require("arif-babu-downloader").alldown;
    } catch (e) {
      return console.log("❌ Error: 'arif-babu-downloader' package missing. Run: npm install arif-babu-downloader");
    }

    const cacheDir = path.join(__dirname, "cache");
    const filePath = path.join(cacheDir, `shaan_${senderID}_${Date.now()}.mp4`);

    try {
      // Reaction dikhana process shuru hone par
      api.setMessageReaction("⏳", messageID, () => {}, true);

      const res = await alldown(msgBody);
      
      if (!res || !res.data || !res.data.high) return;

      const videoURL = res.data.high;
      const title = res.data.title || "No Title";

      // Video download stream
      const getVid = await axios.get(videoURL, { responseType: "arraybuffer" });
      fs.writeFileSync(filePath, Buffer.from(getVid.data, "utf-8"));

      api.setMessageReaction("✅", messageID, () => {}, true);

      return api.sendMessage({
        body: `✨❁ ━━ ━[ 𝐎𝐖𝐍𝐄𝐑 ]━ ━━ ❁✨\n\nᴛɪᴛʟᴇ: ${title}\n\n✨❁ ━━ ━[ 𝑺𝑯𝑨𝑨𝑵 ]━ ━━ ❁✨`,
        attachment: fs.createReadStream(filePath)
      }, threadID, () => {
        // File send hone ke 5 second baad delete karein taaki stream crash na ho
        setTimeout(() => {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }, 5000);
      }, messageID);

    } catch (err) {
      console.error("Download Error:", err);
      api.setMessageReaction("❌", messageID, () => {}, true);
    }
  }
};
