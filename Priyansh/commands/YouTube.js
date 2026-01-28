const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "youtube",
  version: "1.1.0",
  hasPermission: 0,
  credits: "Shaan Khan",
  description: "Audio & Video Downloader with Custom Message",
  commandCategory: "media",
  usages: "youtube <song> | youtube <song> video",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;
  if (!args.length) return api.sendMessage("Song ka naam likho.", threadID, messageID);

  api.sendMessage("✅ Apki Request Jari Hai Please wait..", threadID, messageID);

  const text = args.join(" ").toLowerCase();
  const isVideo = text.endsWith("video");
  const query = isVideo ? text.replace("video", "").trim() : text;

  try {
    // Search API
    const search = await axios.get(`https://api.popcat.xyz/yt/search?q=${encodeURIComponent(query)}`);
    if (!search.data || !search.data[0]) return api.sendMessage("Song nahi mila!", threadID, messageID);
    
    const videoUrl = search.data[0].url;
    const title = search.data[0].title;

    // Download API (Apki original choice)
    const apiEndpoint = isVideo ? "mp4" : "mp3";
    const apiUrl = `https://anabot.my.id/api/download/${apiEndpoint}?url=${encodeURIComponent(videoUrl)}&apikey=freeApikey`;

    const res = await axios.get(apiUrl);
    
    // Yahan check karein download link mil raha hai ya nahi
    if (!res.data || !res.data.result || !res.data.result.download) {
      return api.sendMessage("API ne download link nahi diya. Baad mein try karein.", threadID, messageID);
    }

    const downloadUrl = res.data.result.download;
    const ext = isVideo ? "mp4" : "mp3";
    
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
    const filePath = path.join(cacheDir, `${Date.now()}.${ext}`);

    // Stream download with redirect support
    const stream = await axios({
      url: downloadUrl,
      method: "GET",
      responseType: "stream",
      headers: { 'User-Agent': 'Mozilla/5.0' },
      maxRedirects: 5 // Ye redirects handle karega
    });

    const writer = fs.createWriteStream(filePath);
    stream.data.pipe(writer);

    writer.on("finish", () => {
      // File size check (Facebook 25MB se badi file allow nahi karta)
      const stats = fs.statSync(filePath);
      const fileSizeInBytes = stats.size;
      const fileSizeInMegabytes = fileSizeInBytes / (1024 * 1024);

      if (fileSizeInMegabytes > 25) {
        fs.unlinkSync(filePath);
        return api.sendMessage("File bohot badi hai (25MB+), bot send nahi kar sakta.", threadID, messageID);
      }

      api.sendMessage({
        body: `${isVideo ? "🎬" : "🎧"} ${title}\n\n»»𝑶𝑾𝑵𝑬𝑹««★™\n»»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««\n🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉 MUSIC-VIDEO`,
        attachment: fs.createReadStream(filePath)
      }, threadID, () => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }, messageID);
    });

    writer.on("error", (err) => {
      console.error(err);
      api.sendMessage("Download stream mein masla hua.", threadID, messageID);
    });

  } catch (e) {
    console.error("ERROR DETAILS:", e.response ? e.response.data : e.message);
    api.sendMessage("Kuch ghalti ho gayi, shayad API down hai.", threadID, messageID);
  }
};
