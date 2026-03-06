const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "linkAutoDownload",
    version: "1.6.0",
    hasPermssion: 0,
    credits: "Shaan Babu",
    description: "Downloads video and auto-creates cache folder.",
    commandCategory: "Utilities",
    usages: "",
    cooldowns: 5,
  },

  onLoad: function () {
    const fsLoc = require("fs");
    const filePath = __filename;
    const fileData = fsLoc.readFileSync(filePath, "utf8");

    if (!fileData.includes('credits: "Shaan Babu"')) {
      console.log("\n❌ ERROR: Credits Badle Gaye Hain! File Disabled ❌\n");
      process.exit(1);
    }

    // Bot start hote hi cache folder check/create karega
    const cachePath = path.join(__dirname, "cache");
    if (!fs.existsSync(cachePath)) {
      fs.mkdirSync(cachePath, { recursive: true });
      console.log("[ linkAutoDownload ] - Cache folder created successfully.");
    }
  },

  run: async function () {},

  handleEvent: async function ({ api, event }) {
    const axios = require("axios");
    const { alldown } = require("arif-babu-downloader");

    const body = (event.body || "").trim();
    if (!body.startsWith("https://")) return;

    // Cache folder ka rasta (Path)
    const cacheDir = path.join(__dirname, "cache");
    const filePath = path.join(cacheDir, `auto_${event.senderID}_${Date.now()}.mp4`);

    try {
      // Ensure folder exists (Safety double check)
      fs.ensureDirSync(cacheDir);

      api.setMessageReaction("⏳", event.messageID, () => {}, true);

      const data = await alldown(body);

      if (!data || !data.data || !data.data.high) {
        return; // Silent fail agar link valid nahi hai
      }

      const videoTitle = data.data.title || "No Title Found";
      const videoURL = data.data.high;

      const response = await axios.get(videoURL, { responseType: "arraybuffer" });
      
      // File write karna
      fs.writeFileSync(filePath, Buffer.from(response.data, "utf-8"));

      api.setMessageReaction("✅", event.messageID, () => {}, true);

      return api.sendMessage(
        {
          body: `✨❁ ━━ ━[ 𝐎𝐖𝐍𝐄𝐑 ]━ ━━ ❁✨\n\nᴛɪᴛʟᴇ: ${videoTitle}\n\n✨❁ ━━ ━[ 𝑺𝑯𝑨𝑨𝑵 ]━ ━━ ❁✨`,
          attachment: fs.createReadStream(filePath),
        },
        event.threadID,
        () => {
          // Send hone ke baad file delete
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        },
        event.messageID
      );
    } catch (err) {
      console.error(err);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
    }
  },
};
