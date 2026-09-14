const axios = require("axios");
const fs = require("fs");
const path = require("path");

const API_BASE = "https://tenzo.is-a.dev/api/tools/4k";
const CACHE_DIR = path.join(__dirname, "cache");

function extractImageUrl(args, event) {
  let imageUrl = args.find(arg => arg.startsWith("http"));
  if (!imageUrl && event.type === "message_reply" && event.messageReply.attachments?.length > 0) {
    const img = event.messageReply.attachments.find(a => a.type === "photo" || a.type === "image");
    if (img?.url) imageUrl = img.url;
  }
  return imageUrl;
}

module.exports.config = {
  name: "4k",
  version: "4.1",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Image ko 4K quality mein upscale karein",
  commandCategory: "image",
  usages: "[URL ya image reply karein]",
  cooldowns: 15
};

module.exports.run = async function ({ api, event, args }) {
  const imageUrl = extractImageUrl(args, event);
  if (!imageUrl) return api.sendMessage("❌ Please provide an image URL or reply to an image.", event.threadID, event.messageID);

  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
  api.setMessageReaction("⏳", event.messageID, (err) => {}, true);

  let filePath;
  try {
    const response = await axios.get(`${API_BASE}?url=${encodeURIComponent(imageUrl)}`, {
      responseType: "stream",
      timeout: 120000
    });

    filePath = path.join(CACHE_DIR, `4k_${Date.now()}.jpg`);
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    api.setMessageReaction("🎀", event.messageID, (err) => {}, true);
    
    api.sendMessage({
      body: "✅ | Your image has been upscaled\n\n👤 𝗢𝘄𝗻𝗲𝗿 : 𝗦𝗵𝗮𝗮𝗻 𝗞𝗵𝗮𝗻",
      attachment: fs.createReadStream(filePath)
    }, event.threadID, () => {
      setTimeout(() => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }, 10000);
    }, event.messageID);

  } catch (e) {
    api.setMessageReaction("❌", event.messageID, (err) => {}, true);
    api.sendMessage(`❌ Error: ${e.message}\n\n👤 𝗢𝘄𝗻𝗲𝗿 : 𝗦𝗵𝗮𝗮𝗻 𝗞𝗵𝗮𝗻`, event.threadID, event.messageID);
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
};
