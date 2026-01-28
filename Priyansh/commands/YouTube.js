const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "YouTube",
  version: "1.1.0",
  hasPermission: 0,
  credits: "Shaan Khan",
  description: "Audio & Video Downloader with Custom Message",
  commandCategory: "media",
  usages: "music <song> | music <song> video",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  if (!args.length) return api.sendMessage("Song ka naam likho.", event.threadID);

  api.sendMessage("✅ Apki Request Jari Hai Please wait..", event.threadID);

  const text = args.join(" ").toLowerCase();
  const isVideo = text.endsWith("video");
  const query = isVideo ? text.replace("video", "").trim() : text;

  try {
    const search = await axios.get(`https://api.popcat.xyz/yt/search?q=${encodeURIComponent(query)}`);
    const videoUrl = search.data[0].url;

    const apiEndpoint = isVideo ? "mp4" : "mp3";
    const apiUrl = `https://anabot.my.id/api/download/${apiEndpoint}?url=${encodeURIComponent(videoUrl)}&apikey=freeApikey`;

    const res = await axios.get(apiUrl);
    const downloadUrl = res.data.result.download;

    const ext = isVideo ? "mp4" : "mp3";
    const filePath = path.join(__dirname, `/cache/music.${ext}`);

    const stream = await axios({
      url: downloadUrl,
      method: "GET",
      responseType: "stream"
    });

    stream.data.pipe(fs.createWriteStream(filePath));
    stream.data.on("end", () => {
      api.sendMessage({
        body: `${isVideo ? "🎬" : "🎧"} ${res.data.result.title}\n\n»»𝑶𝑾𝑵𝑬𝑹««★™\n»»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««\n🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉 MUSIC-VIDEO`,
        attachment: fs.createReadStream(filePath)
      }, event.threadID);
    });

  } catch (e) {
    api.sendMessage("Kuch ghalti ho gayi, baad me try karo.", event.threadID);
  }
};