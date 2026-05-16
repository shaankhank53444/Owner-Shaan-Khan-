const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "vm",
  version: "5.5.0", 
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "YouTube Video Downloader (New API Integrated)",
  commandCategory: "media",
  usages: "[song name or video link]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const query = args.join(" ");

  if (!query) return api.sendMessage("❌ | Please enter a video name or YouTube link.", threadID, messageID);

  const cacheDir = path.join(__dirname, "cache");
  const filePath = path.join(cacheDir, `${Date.now()}.mp4`);

  try {
    api.setMessageReaction("⏳", messageID, () => {}, true);
    api.sendMessage("🔎 | Nayi API se video dhundhi ja rahi hai...", threadID, messageID);

    // Nayi API URL lagayi gayi hai
    const apiUrl = `https://uzairrajputapis.qzz.io/api/downloader/youtube?url=${encodeURIComponent(query)}`;
    
    // API request with timeout
    const res = await axios.get(apiUrl, { timeout: 20000 });
    const data = res.data;

    // Nayi API ke response keys ke mutabik checking (Common structures handled)
    const downloadLink = data.downloadUrl || data.url || data.link || (data.result && (data.result.downloadUrl || data.result.url || data.result.link || data.result.download_url));
    const title = data.title || (data.result && data.result.title) || "YouTube Video";

    if (!downloadLink) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      console.log("API Response Data:", data); // Debugging ke liye log
      return api.sendMessage("⚠️ | Nayi API se video ka download link nahi mil saka.", threadID, messageID);
    }

    // Ensure cache folder exists
    await fs.ensureDir(cacheDir);

    // High speed video stream downloading
    const videoRes = await axios({
      method: 'get',
      url: downloadLink,
      responseType: 'stream',
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 60000 // 1 minute download limit
    });

    const writer = fs.createWriteStream(filePath);
    videoRes.data.pipe(writer);

    writer.on('finish', () => {
      api.setMessageReaction("✅", messageID, () => {}, true);
      api.sendMessage({
        body: `✅ Downloaded Successfully via New API!\n\n📌 Title: ${title}\n\n»»𝑶𝑾𝑵𝑬𝑹««★™ 𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵🥀`,
        attachment: fs.createReadStream(filePath)
      }, threadID, () => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }, messageID);
    });

    writer.on('error', (err) => {
      console.error(err);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      api.sendMessage("❌ | File ko cache mein save karte waqt error aya.", threadID, messageID);
    });

  } catch (err) {
    console.error(err);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    api.setMessageReaction("❌", messageID, () => {}, true);
    return api.sendMessage("❌ | API Error: Nayi API response nahi de rahi ya server down hai.", threadID, messageID);
  }
};
