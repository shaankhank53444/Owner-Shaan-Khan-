module.exports = {
  config: {
    name: "linkAutoDownload",
    version: "1.4.0",
    hasPermssion: 0,
    credits: "Shaan Khan",
    description: "Auto download links from social media (FB, IG, TikTok, etc.)",
    commandCategory: "Utilities",
    usages: "",
    cooldowns: 5,
  },

  // 🔓 Sabhi locks aur base64 checks hata diye gaye hain
  onLoad: async function () {
    console.log("------------------------------------------");
    console.log("✅ linkAutoDownload by Shaan Khan Loaded!");
    console.log("------------------------------------------");
  },

  run: async function ({ api, event, args }) {
    // Ye function khali rahega kyunki hum handleEvent use kar rahe hain
    return api.sendMessage("Yeh module automatically links detect karta hai. Bas link copy-paste karein.", event.threadID);
  },

  handleEvent: async function ({ api, event }) {
    const axios = require("axios");
    const fs = require("fs-extra");
    const path = require("path");
    
    // Mirai specific: arif-babu-downloader package install hona chahiye
    const { alldown } = require("arif-babu-downloader");

    const body = (event.body || "");

    // Check if message contains a link
    if (!body.startsWith("https://")) return;

    try {
      // Reaction for processing
      api.setMessageReaction("⏳", event.messageID, () => {}, true);

      // Fetch data using the downloader
      const data = await alldown(body);

      if (!data || !data.data || !data.data.high) {
        // Agar link support nahi hai ya video nahi mili
        return; 
      }

      const videoURL = data.data.high;
      const cacheDir = path.join(__dirname, "cache");
      
      // Cache folder check
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
      
      const filePath = path.join(cacheDir, `download_${event.senderID}.mp4`);

      // Download the video buffer
      const response = await axios.get(videoURL, { responseType: "arraybuffer" });
      fs.writeFileSync(filePath, Buffer.from(response.data, "utf-8"));

      api.setMessageReaction("✅", event.messageID, () => {}, true);

      // Sending the video
      return api.sendMessage(
        {
          body: `🎥 Video Downloaded Success!\n👤 Credits: Shaan Khan`,
          attachment: fs.createReadStream(filePath),
        },
        event.threadID,
        () => {
          // File delete after sending to save space
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        },
        event.messageID
      );
    } catch (err) {
      console.error(err);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
    }
  },
};
