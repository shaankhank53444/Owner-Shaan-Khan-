const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports.config = {
  name: "convertmp3",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Download video from URL and convert to MP3",
  commandCategory: "media",
  usages: "[video_url]",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { threadID } = event;

  try {
    // 🔗 Get URL from args or reply attachment
    const url = args.join(" ") || event.messageReply?.attachments?.[0]?.url;
    if (!url) {
      return api.sendMessage("⚠️ ᴘʟᴇᴀsᴇ ᴘʀᴏᴠɪᴅᴇ ᴀ ᴠɪᴅᴇᴏ ᴜʀʟ!", threadID);
    }

    // ⏳ Status message (bina reply target ke)
    api.sendMessage("Mᴘ3 ᴘʀᴏᴄᴇssɪɴɢ ᴘʟᴇᴀsᴇ ᴡᴀɪᴛ ⏳", threadID);

    // 📥 Download media data
    const res = await axios.get(url, { responseType: "arraybuffer" });

    // 💾 Cache path handling
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    const filePath = path.join(cacheDir, `${Date.now()}_audio.mp3`);
    fs.writeFileSync(filePath, Buffer.from(res.data));

    // 📝 Custom Body Text
    const bodyText = `»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰 👉 APKI MP3`;

    // 🔊 Send Audio attachment without quoting user message
    return api.sendMessage({
      body: bodyText,
      attachment: fs.createReadStream(filePath)
    }, threadID, () => {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });

  } catch (err) {
    console.error(err);
    return api.sendMessage("⚠️ Fᴀɪʟᴇᴅ ᴛᴏ ᴄᴏɴᴠᴇʀᴛ ᴠɪᴅᴇᴏ!", threadID);
  }
};
