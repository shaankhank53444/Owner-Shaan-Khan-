const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "convertmp3",
    aliases: ["mp3"],
    version: "1.0.0",
    role: 0,
    author: "Shaan Khan",
    shortDescription: "Convert video to MP3 🎧",
    longDescription: "Download video from URL and convert to MP3.",
    category: "media",
    guide: "{p}convertmp3 <video_url>"
  },

  onStart: async function({ api, args, event }) {
    const { threadID } = event;

    try {
      // 🔗 URL args ya replied attachment se hasil karen
      const url = args.join(" ") || event.messageReply?.attachments?.[0]?.url;
      if (!url) {
        return api.sendMessage("⚠️ ᴘʟᴇᴀsᴇ ᴘʀᴏᴠɪᴅᴇ ᴀ ᴠɪᴅᴇᴏ ᴜʀʟ!", threadID);
      }

      // ⏳ Direct message (bina messageID reply ke)
      api.sendMessage("Mᴘ3 ᴘʀᴏᴄᴇssɪɴɢ ᴘʟᴇᴀsᴇ ᴡᴀɪᴛ ⏳", threadID);

      // 📥 Video download
      const { data } = await axios.get(url, { responseType: "arraybuffer" });

      // 💾 Cache folder me save karein
      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

      const filePath = path.join(cacheDir, `${Date.now()}_video.mp3`);
      fs.writeFileSync(filePath, Buffer.from(data));

      // 📝 Custom Caption Body Text
      const bodyText = `»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰 👉 APKI MP3`;

      // 🔊 Direct Audio + Text (Bina messageID reply ke)
      api.sendMessage({
        body: bodyText,
        attachment: fs.createReadStream(filePath)
      }, threadID, () => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath); // File delete after sending
      });

    } catch (err) {
      console.error(err);
      api.sendMessage("⚠️ Fᴀɪʟᴇᴅ ᴛᴏ ᴄᴏɴᴠᴇʀᴛ ᴠɪᴅᴇᴏ!", threadID);
    }
  }
};
