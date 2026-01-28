const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "youtube",
  version: "1.5.0",
  hasPermission: 0,
  credits: "Shaan Khan",
  description: "Audio & Video Downloader (Fixed API)",
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
    // Logic 1: Search using Popcat (As per your first file)
    const search = await axios.get(`https://api.popcat.xyz/yt/search?q=${encodeURIComponent(query)}`);
    if (!search.data || !search.data[0]) return api.sendMessage("Song nahi mila!", threadID, messageID);
    
    const videoUrl = search.data[0].url;
    const title = search.data[0].title;

    // Logic 2: Download using Box09 API (Stable & Fast)
    const type = isVideo ? "mp4" : "mp3";
    const downloadRes = await axios.get(`https://api.box09.biz/yt/download?url=${encodeURIComponent(videoUrl)}&type=${type}`);
    const downloadUrl = downloadRes.data.downloadUrl;

    if (!downloadUrl) throw new Error("Download URL missing");

    const ext = isVideo ? "mp4" : "mp3";
    const cachePath = path.join(__dirname, "cache");
    if (!fs.existsSync(cachePath)) fs.mkdirSync(cachePath, { recursive: true });
    const filePath = path.join(cachePath, `${Date.now()}.${ext}`);

    // Logic 3: Stream download (Same as your first file)
    const response = await axios({
      url: downloadUrl,
      method: "GET",
      responseType: "stream"
    });

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    writer.on("finish", () => {
      api.sendMessage({
        body: `${isVideo ? "🎬" : "🎧"} ${title}\n\n»»𝑶𝑾𝑵𝑬𝑹««★™\n»»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««\n🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉 MUSIC-VIDEO`,
        attachment: fs.createReadStream(filePath)
      }, threadID, () => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }, messageID);
    });

    writer.on("error", (err) => {
      console.error(err);
      api.sendMessage("Download fail ho gaya.", threadID, messageID);
    });

  } catch (e) {
    console.error(e);
    api.sendMessage("⚠️ Server busy hai ya file size badi hai. Dusra song try karein.", threadID, messageID);
  }
};
