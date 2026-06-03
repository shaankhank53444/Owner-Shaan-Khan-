const axios = require("axios");
const fs = require("fs");
const { resolve } = require("path");

module.exports.config = {
  name: "vm",
  version: "1.2.1",
  hasPermssion: 0,
  credits: "Shaan",
  description: "YouTube Audio + Video Downloader",
  commandCategory: "media",
  usages: "vm <song name> / vm <song name> video",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;

  let mode = "audio";
  if (args.includes("video")) {
    mode = "video";
    args = args.filter(item => item.toLowerCase() !== "video");
  }

  const query = args.join(" ");
  if (!query) return api.sendMessage("⚠️ Sahi format: vm <song name> ya vm <song name> video", threadID, messageID);

  const searching = await api.sendMessage("✅ Apki Request Jari Hai, Please Wait...", threadID);
  
  try {
    // API Endpoint badal diya gaya hai (Isse replace karein)
    const res = await axios.get(`https://api.diioffc.com/download/ytmp3?url=${encodeURIComponent(query)}`);
    
    // API response ke mutabik data extract karna
    const data = res.data.result;
    if (!data || !data.downloadUrl) return api.sendMessage("❌ Media nahi mila, phir se try karein.", threadID, messageID);

    const targetUrl = data.downloadUrl;
    const title = data.title || query;

    const path = `${__dirname}/cache/${Date.now()}.${mode === "audio" ? "mp3" : "mp4"}`;
    
    const response = await axios({
      method: 'GET',
      url: targetUrl,
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(path);
    response.data.pipe(writer);

    writer.on('finish', () => {
      api.sendMessage({
        body: `🎵 ${title}\n\n»»𝑶𝑾𝑵𝑬𝑹««★™ »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««🥀`,
        attachment: fs.createReadStream(path)
      }, threadID, () => {
        api.unsendMessage(searching.messageID);
        fs.unlinkSync(path);
      }, messageID);
    });

  } catch (err) {
    console.error(err);
    api.sendMessage("❌ Error: API response mein masla hai ya server down hai.", threadID, messageID);
  }
};
