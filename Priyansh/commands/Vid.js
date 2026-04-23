module.exports.config = {
  name: "vid",
  version: "1.0.4",
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
    // API URL - Yahan se video stream download hogi
    const apiUrl = `https://uzair-new-music-api.onrender.com/download/video?q=${encodeURIComponent(query)}`;
    
    // File path setup
    const path = __dirname + `/cache/${Date.now()}.mp4`;
    if (!fs.existsSync(__dirname + "/cache")) {
      fs.mkdirSync(__dirname + "/cache", { recursive: true });
    }

    // Video stream download karna
    const response = await axios({
      method: 'get',
      url: apiUrl,
      responseType: 'stream'
    });

    // Agar API headers mein title bhejti hai to wo nikalne ki koshish (Optional)
    const title = query.length > 30 ? "Video Result" : query; 

    const writer = fs.createWriteStream(path);
    response.data.pipe(writer);

    writer.on('finish', () => {
      const msgBody = `🎥 𝑻𝒊𝒕𝒍𝒆: ${title}\n\n»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««🥀\n𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉 VIDEO`;

      return api.sendMessage({
        body: msgBody,
        attachment: fs.createReadStream(path)
      }, threadID, () => fs.unlinkSync(path), messageID);
    });

    writer.on('error', (err) => {
      throw err;
    });

  } catch (error) {
    console.error(error);
    return api.sendMessage("❌ Error: Video download ya fetch nahi ho saki. API limit ya server check karein.", threadID, messageID);
  }
};
