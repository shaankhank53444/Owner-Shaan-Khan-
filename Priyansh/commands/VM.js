const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "vm",
  version: "5.6.0", 
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "YouTube Video Downloader (Ultra Fast Memory Buffer)",
  commandCategory: "media",
  usages: "[song name or video link]",
  cooldowns: 2 // Cooldown kam kar diya taake fast testing ho sake
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const query = args.join(" ");

  if (!query) return api.sendMessage("❌ | Please enter a video name or link.", threadID, messageID);

  const cacheDir = path.join(__dirname, "cache");
  const filePath = path.join(cacheDir, `${Date.now()}.mp4`);

  try {
    api.setMessageReaction("⏳", messageID, () => {}, true);
    api.sendMessage("🚀 | High-speed server se connect ho raha hai...", threadID, messageID);

    const apiUrl = `https://uzairrajputapis.qzz.io/api/downloader/youtube?url=${encodeURIComponent(query)}`;
    
    // Fast API Request
    const res = await axios.get(apiUrl, { timeout: 15000 });
    const data = res.data;

    // Keys matching
    const downloadLink = data.downloadUrl || data.url || data.link || (data.result && (data.result.downloadUrl || data.result.url || data.result.link || data.result.download_url));
    const title = data.title || (data.result && data.result.title) || "YouTube Video";

    if (!downloadLink) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage("⚠️ | Video link nahi mil saka.", threadID, messageID);
    }

    await fs.ensureDir(cacheDir);

    // [SPEED HACK] Arraybuffer use kar ke poori video ek sath fast download karna
    const videoRes = await axios({
      method: 'get',
      url: downloadLink,
      responseType: 'arraybuffer', // Stream ke bajaye direct memory buffer (Boht tez hai)
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*'
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    // Memory buffer ko jaldi se file mein convert karna
    await fs.writeFile(filePath, Buffer.from(videoRes.data));

    // Success response aur sending
    api.setMessageReaction("✅", messageID, () => {}, true);
    api.sendMessage({
      body: `🚀 Fast Downloaded!\n\n📌 Title: ${title}\n\n»»𝑶𝑾𝑵𝑬𝑹««★™ 𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵🥀`,
      attachment: fs.createReadStream(filePath)
    }, threadID, () => {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }, messageID);

  } catch (err) {
    console.error(err);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    api.setMessageReaction("❌", messageID, () => {}, true);
    return api.sendMessage("❌ | Speed Error: Ya to aapki vps/hosting slow hai ya video bohot barri hai.", threadID, messageID);
  }
};
