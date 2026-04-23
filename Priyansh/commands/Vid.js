module.exports.config = {
  name: "vid",
  version: "1.0.3",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Download video with title and custom branding",
  commandCategory: "media",
  usages: "[query/URL]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const axios = require("axios");
  const fs = require("fs-extra");

  const { threadID, messageID } = event;
  let query = args.join(" ");

  if (!query) {
    return api.sendMessage("❌ Please enter a video URL or search query.", threadID, messageID);
  }

  api.sendMessage("✅ Apki Request Jari Hai Please Wait", threadID, messageID);

  try {
    // Note: Video details lene ke liye hum pehle API se data fetch karenge
    const res = await axios.get(`https://uzair-new-music-api.onrender.com/download/video?q=${encodeURIComponent(query)}`);
    const videoUrl = res.data.downloadUrl || res.config.url; // API structure ke mutabiq adjustment
    const title = res.data.title || "No Title Found";

    const path = __dirname + `/cache/${Date.now()}_video.mp4`;

    if (!fs.existsSync(__dirname + "/cache")) {
      fs.mkdirSync(__dirname + "/cache", { recursive: true });
    }

    const videoData = await axios.get(apiUrl, { responseType: "arraybuffer" });
    fs.writeFileSync(path, Buffer.from(videoData.data, "utf-8"));

    // Title ke sath customized body
    const msgBody = `🎥 𝑻𝒊𝒕𝒍𝒆: ${title}\n\n»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««🥀\n𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉 VIDEO`;

    return api.sendMessage({
      body: msgBody,
      attachment: fs.createReadStream(path)
    }, threadID, () => fs.unlinkSync(path), messageID);

  } catch (error) {
    console.error(error);
    return api.sendMessage("❌ Error: Video fetch nahi ho saki.", threadID, messageID);
  }
};
