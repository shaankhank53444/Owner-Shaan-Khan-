const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

let yts = null;
try {
  yts = require("yt-search");
} catch (e) {}

const API = "https://yt-mian-amir.vercel.app/api/link";
const MAX_FILE_MB = 25;
const CACHE_DIR = path.join(__dirname, "cache");
fs.ensureDirSync(CACHE_DIR);

const YT_URL = /^https?:\/\/(?:www\.|m\.|music\.)?(?:youtube\.com|youtu\.be)\/\S+/i;

module.exports.config = {
  name: "mp3",
  version: "1.2.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Gaana mp3 mein ya video 360p mein bhejo",
  commandCategory: "media",
  usages: "mp3 <gaane ka naam> | mp3video <gaane ka naam>",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, body } = event;
  const input = args.join(" ").trim();
  
  // Check if it's mp3video command or regular mp3
  const isVideo = body && body.toLowerCase().includes("mp3video");

  if (!input) {
    return api.sendMessage(
      "🎵 **MP3 / Video Player**\n\n• Use: mp3 <gaane ka naam>\n• Use: mp3video <video ka naam>\n\n»» 𝐒𝐇𝐀𝐀𝐍 𝐊𝐇𝐀𝐍 ««",
      threadID,
      messageID
    );
  }

  try {
    api.setMessageReaction("⏳", messageID, () => {}, true);

    let videoUrl = "";
    let title = isVideo ? "YouTube Video" : "YouTube Audio";
    let info = "";

    if (YT_URL.test(input)) {
      videoUrl = input;
    } else {
      if (!yts) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage("❌ yt-search package installed nahi hai Termux mein.", threadID, messageID);
      }

      const searchResults = await yts(input);
      const video = (searchResults.videos || []).find(v => v.seconds > 0);
      
      if (!video) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage(`❌ "${input}" ka koi result nahi mila!`, threadID, messageID);
      }

      videoUrl = video.url;
      title = video.title;
      info = `\n⏱️ ${video.timestamp}` + (video.author && video.author.name ? `\n👤 ${video.author.name}` : "");
    }

    const format = isVideo ? "360" : "mp3";
    const downloadApiUrl = `${API}?url=${encodeURIComponent(videoUrl)}&format=${format}`;

    // Fetching link / buffer
    const res = await axios.get(downloadApiUrl, {
      responseType: "arraybuffer",
      timeout: 60000,
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    let buffer = Buffer.from(res.data);
    const contentType = String(res.headers["content-type"] || "");

    // Agar API ne JSON ya direct link return kiya ho
    if (/json|text/i.test(contentType)) {
      try {
        const jsonText = buffer.toString("utf8");
        const parsed = JSON.parse(jsonText);
        const directLink = parsed.url || parsed.download || parsed.link || parsed.result;
        
        if (directLink) {
          const fileRes = await axios.get(directLink, {
            responseType: "arraybuffer",
            timeout: 120000
          });
          buffer = Buffer.from(fileRes.data);
        }
      } catch (err) {}
    }

    if (!buffer || buffer.length < 1000) {
      throw new Error("Empty buffer received");
    }

    const sizeMB = buffer.length / (1024 * 1024);
    if (sizeMB > MAX_FILE_MB) {
      api.setMessageReaction("✅", messageID, () => {}, true);
      return api.sendMessage(
        `${isVideo ? "🎬" : "🎵"} ${title}${info}\n\n⚠️ File size (${sizeMB.toFixed(1)} MB) zyada hai, yahan se download karein:\n${downloadApiUrl}\n\n»» 𝐒𝐇𝐀𝐀𝐍 𝐊𝐇𝐀𝐍 ««`,
        threadID,
        messageID
      );
    }

    const filePath = path.join(CACHE_DIR, `media_${Date.now()}.${isVideo ? "mp4" : "mp3"}`);
    await fs.writeFile(filePath, buffer);

    api.setMessageReaction("✅", messageID, () => {}, true);
    return api.sendMessage(
      {
        body: `${isVideo ? "🎬" : "🎵"} ${title}${info}\n\n»» 𝐒𝐇𝐀𝐀𝐍 𝐊𝐇𝐀𝐍 ««`,
        attachment: fs.createReadStream(filePath)
      },
      threadID,
      () => fs.remove(filePath).catch(() => {}),
      messageID
    );

  } catch (error) {
    console.error("MP3 Command Error:", error.message);
    api.setMessageReaction("❌", messageID, () => {}, true);
    return api.sendMessage(
      "❌ Download fail ho gaya. API ya network mein masla ho sakta hai.\n\n»» 𝐒𝐇𝐀𝐀𝐍 𝐊𝐇𝐀𝐍 ««",
      threadID,
      messageID
    );
  }
};
