const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "emojigif",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Get animated/HD emoji image",
  commandCategory: "FUN & SOCIAL",
  usages: "[emoji]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const emoji = args.join(" ");

  if (!emoji) {
    return api.sendMessage("❌ | Please provide an emoji.", threadID, messageID);
  }

  const cacheDir = path.join(__dirname, "cache");
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  const filePath = path.join(cacheDir, `emoji_${Date.now()}.webp`);

  try {
    const apiUrl = `https://xalman-apis.vercel.app/api/emojigif?emoji=${encodeURIComponent(emoji)}`;
    const res = await axios.get(apiUrl);
    const imageUrl = res.data?.data?.image;

    if (!imageUrl) {
      return api.sendMessage("❌ | No image found for this emoji.", threadID, messageID);
    }

    const imageBuffer = await axios.get(imageUrl, { responseType: "arraybuffer" });
    fs.writeFileSync(filePath, Buffer.from(imageBuffer.data, "utf-8"));

    return api.sendMessage(
      {
        body: `Emoji: ${emoji}`,
        attachment: fs.createReadStream(filePath)
      },
      threadID,
      () => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      },
      messageID
    );

  } catch (err) {
    console.error(err);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return api.sendMessage("❌ | API Error or failed to fetch emoji.", threadID, messageID);
  }
};
