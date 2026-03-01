const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "autodownloader",
  version: "1.3.0",
  hasPermssion: 0,
  credits: "Raza x Shaan",
  description: "Auto download with reactions and stylish title",
  commandCategory: "Events",
  usages: "send a link",
  cooldowns: 0
};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, body } = event;
  if (!body) return;

  const capcutRegex = /https?:\/\/(www\.)?capcut\.com\/template-detail\/\d+/;
  const fbRegex = /https?:\/\/(www\.)?(facebook\.com|fb\.watch|facebook\.com\/reel)\//;
  const instaRegex = /https?:\/\/(www\.)?instagram\.com\/(p|reel|tv|stories)\//;
  const pinRegex = /https?:\/\/(pin\.it\/|www\.pinterest\.com\/pin\/)/;
  const tiktokRegex = /https?:\/\/(vm\.tiktok\.com\/|www\.tiktok\.com\/|vt\.tiktok\.com\/)/;
  const ytRegex = /https?:\/\/(youtu\.be\/|www\.youtube\.com\/watch\?v=|www\.youtube\.com\/shorts\/)/;

  let apiUrl = "";
  let downloadFunc = null;
  let platform = "";

  const urlMatch = body.match(/(https?:\/\/[^\s]+)/);
  if (!urlMatch) return;
  const url = urlMatch[0];

  // Platform detection
  if (capcutRegex.test(url)) { platform = "CapCut"; apiUrl = `https://api.kraza.qzz.io/download/capcut?url=${encodeURIComponent(url)}`; downloadFunc = async (res) => res.data.status ? { url: res.data.result.videoUrl, title: "CapCut Template" } : null; }
  else if (fbRegex.test(url)) { platform = "Facebook"; apiUrl = `https://api.kraza.qzz.io/download/facebook?url=${encodeURIComponent(url)}`; downloadFunc = async (res) => res.data.status ? { url: (res.data.result.media.video_hd || res.data.result.media.video_sd), title: res.data.result.title || "FB Video" } : null; }
  else if (instaRegex.test(url)) { platform = "Instagram"; apiUrl = `https://api.princetechn.com/api/download/instadl?apikey=prince&url=${encodeURIComponent(url)}`; downloadFunc = async (res) => res.data.success ? { url: res.data.result.download_url, title: "Insta Reel/Post" } : null; }
  else if (pinRegex.test(url)) { platform = "Pinterest"; apiUrl = `https://api.princetechn.com/api/download/pinterestdl?apikey=prince&url=${encodeURIComponent(url)}`; downloadFunc = async (res) => { if (!res.data.success) return null; const media = res.data.result.media; const video = media.find(m => m.format === "MP4" && m.type.includes("720p")) || media.find(m => m.format === "MP4"); return video ? { url: video.download_url, title: res.data.result.title || "Pinterest Video" } : null; }; }
  else if (tiktokRegex.test(url)) { platform = "TikTok"; apiUrl = `https://api.kraza.qzz.io/download/tiktok?url=${encodeURIComponent(url)}`; downloadFunc = async (res) => res.data.status ? { url: res.data.result.video_nowm, title: res.data.result.title || "TikTok Video" } : null; }
  else if (ytRegex.test(url)) { platform = "YouTube"; apiUrl = `https://api.kraza.qzz.io/download/ytdl?url=${encodeURIComponent(url)}`; downloadFunc = async (res) => res.data.status ? { url: res.data.result.mp4, title: res.data.result.title || "YT Video" } : null; }

  if (apiUrl && downloadFunc) {
    try {
      // 📥 Reaction jab link detect ho jaye
      api.setMessageReaction("📥l⌛", messageID, (err) => {}, true);

      const res = await axios.get(apiUrl);
      const data = await downloadFunc(res);
      
      if (data && data.url) {
        const cacheDir = path.join(__dirname, "cache");
        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
        const outputPath = path.join(cacheDir, `auto_${Date.now()}.mp4`);
        
        const videoRes = await axios.get(data.url, { responseType: 'arraybuffer' });
        fs.writeFileSync(outputPath, Buffer.from(videoRes.data));

        const caption = `✨❁ ━━ ━[ 𝐎𝐖𝐍𝐄𝐑 ]━ ━━ ❁✨\n\nᴛɪᴛʟᴇ: ${data.title}\nᴘʟᴀᴛғᴏʀᴍ: ${platform}\n\n✨❁ ━━ ━[ 𝑺𝑯𝑨𝑨𝑵 ]━ ━━ ❁✨`;

        api.sendMessage({
          body: caption,
          attachment: fs.createReadStream(outputPath)
        }, threadID, () => {
          // ✅ Reaction jab video send ho jaye
          api.setMessageReaction("✅", messageID, (err) => {}, true);
          if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        }, messageID);
      }
    } catch (e) {
      // ❌ Reaction agar error aaye
      api.setMessageReaction("❌", messageID, (err) => {}, true);
      console.error("AutoDownloader Error:", e.message);
    }
  }
};

module.exports.run = async function ({ api, event }) {
    return api.sendMessage("🤖 Auto-Downloader Active. Bas link bhejo!", event.threadID);
};
