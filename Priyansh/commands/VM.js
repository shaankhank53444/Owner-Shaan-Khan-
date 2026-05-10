const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "vm",
  version: "5.1.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "YouTube Video Downloader for Mirai",
  commandCategory: "media",
  usages: "[song name]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const query = args.join(" ");

  if (!query) {
    return api.sendMessage("❌ | Please enter a song/video name.", threadID, messageID);
  }

  try {
    // Reaction and Waiting Message
    api.setMessageReaction("⏳", messageID, () => {}, true);
    api.sendMessage(
      `╭━━━〔 🔎 SEARCHING 〕━━━╮\n\n✅ Apki Request Jari Hai Please Wait...\n\n╰━━━━━━━━━━━━━━━━━━━╯`,
      threadID,
      messageID
    );

    // Fetching data from API
    const apiUrl = `https://uzair-new-music-api-all-in-one.onrender.com/api/download/youtube?q=${encodeURIComponent(query)}`;
    const res = await axios.get(apiUrl);
    const data = res.data;

    if (!data || !data.download) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage("⚠️ | Video Not Found!", threadID, messageID);
    }

    // Creating unique file path to prevent conflicts between users
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
    
    const filePath = path.join(cacheDir, `${senderID}_${Date.now()}.mp4`);

    // Downloading the video stream
    const response = await axios({
      method: 'get',
      url: data.download,
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    writer.on('finish', () => {
      api.setMessageReaction("✅", messageID, () => {}, true);

      api.sendMessage({
        body: `»»𝑶𝑾𝑵𝑬𝑹««★™\n»»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««🥀\n\n𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰 👉 MUSIC VIDEO\n\n╭━━━〔 🎬 VIDEO INFO 〕━━━╮\n\n📌 Title: ${data.title || "Unknown"}\n⏱ Duration: ${data.duration || "Unknown"}\n👀 Views: ${data.views || "Unknown"}\n📺 Channel: ${data.channel || "Unknown"}\n\n╰━━━━━━━━━━━━━━━━━━╯`,
        attachment: fs.createReadStream(filePath)
      }, threadID, () => {
        // Delete file after sending to save disk space
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }, messageID);
    });

    writer.on('error', (err) => {
      console.error(err);
      api.sendMessage("❌ | Error writing file.", threadID, messageID);
    });

  } catch (err) {
    console.error(err);
    api.setMessageReaction("❌", messageID, () => {}, true);
    return api.sendMessage(
      `╭━━━〔 ❌ ERROR 〕━━━╮\n\n⚠️ | Failed To Send Video\n\n╰━━━━━━━━━━━━━━╯\n\n»»𝑶𝑾𝑵𝑬𝑹««★™\n»»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««🥀`,
      threadID,
      messageID
    );
  }
};
