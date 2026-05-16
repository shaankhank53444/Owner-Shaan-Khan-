const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "vm",
  version: "5.4.0", 
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "YouTube Video Downloader (API Optimized)",
  commandCategory: "media",
  usages: "[song name]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const query = args.join(" ");

  if (!query) return api.sendMessage("❌ | Please enter a video name.", threadID, messageID);

  try {
    api.setMessageReaction("⏳", messageID, () => {}, true);
    api.sendMessage("🔎 | Searching & Processing...", threadID, messageID);

    // Naya API URL lagaya gaya hai
    const apiUrl = `https://uzair-mtx-all-in-one-api-o213.onrender.com/download/mp4?q=${encodeURIComponent(query)}`;
    const res = await axios.get(apiUrl);

    const data = res.data;

    // API ke mukhtalif structures ki checking
    const downloadLink = data.downloadUrl || data.url || (data.result && data.result.downloadUrl) || (data.result && data.result.url);
    const title = data.title || (data.result && data.result.title) || "Video";

    if (!downloadLink) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage("⚠️ | Video link API response mein nahi mila.", threadID, messageID);
    }

    const filePath = path.join(__dirname, "cache", `${Date.now()}.mp4`);

    // Ensure cache directory exists
    if (!fs.existsSync(path.join(__dirname, "cache"))) {
      fs.mkdirSync(path.join(__dirname, "cache"));
    }

    // File download ho rahi hai
    const videoRes = await axios({
      method: 'get',
      url: downloadLink,
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(filePath);
    videoRes.data.pipe(writer);

    writer.on('finish', () => {
      api.setMessageReaction("✅", messageID, () => {}, true);
      api.sendMessage({
        body: `✅ Downloaded Successfully!\n\n📌 Title: ${title}\n\n»»𝑶𝑾𝑵𝑬𝑹««★™ 𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵🥀`,
        attachment: fs.createReadStream(filePath)
      }, threadID, () => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }, messageID);
    });

    writer.on('error', (err) => {
      console.error(err);
      api.sendMessage("❌ | File write karne mein error aya hai.", threadID, messageID);
    });

  } catch (err) {
    console.error(err);
    api.setMessageReaction("❌", messageID, () => {}, true);
    return api.sendMessage("❌ | API Error: Server se rabta nahi ho saka ya file bohot bari hai.", threadID, messageID);
  }
};
