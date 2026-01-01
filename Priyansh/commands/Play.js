const axios = require("axios");
const fs = require("fs");
const ytSearch = require("yt-search");
const path = require("path");

const CACHE_DIR = path.join(__dirname, "cache");

module.exports = {
  config: {
    name: "play",
    version: "1.3",
    author: "Shaan",
    countDown: 5,
    role: 0,
    shortDescription: { en: "YouTube se mp3 gaane download karein." },
    longDescription: { en: "Search and download audio from YouTube in MP3 format." },
    category: "media",
    guide: { en: "{pn} <gaane ka naam>\n\nExample:\n{pn} tery bin" }
  },

  onStart: async function ({ api, args, event }) {
    if (!args[0])
      return api.sendMessage("❌ Baraye meherbani gaane ka naam likhein.", event.threadID, event.messageID);

    // Pehla message jab user search kare
    api.sendMessage("✅ Apki Request Jari Hai Please wait...", event.threadID, event.messageID);
    api.setMessageReaction("🎶", event.messageID, () => {}, true);

    try {
      const query = args.join(" ");
      const searchResult = await ytSearch(query);
      const videos = searchResult.videos.slice(0, 6);

      if (videos.length === 0) {
        api.setMessageReaction("❌", event.messageID, () => {}, true);
        return api.sendMessage("❌ Maaf kijiyega, YouTube par koi result nahi mila.", event.threadID, event.messageID);
      }

      if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

      let attachments = [];
      let msg = `🎶 Aapke search " ${query} " ke nataij:\n\n`;

      for (let i = 0; i < videos.length; i++) {
        const v = videos[i];
        msg += `${i + 1}. ${v.title}\n⏱️ Waqt: ${v.timestamp} | 👤 ${v.author.name}\n\n`;

        try {
          const thumbPath = path.join(CACHE_DIR, `thumb_${Date.now()}_${i}.jpg`);
          const thumbRes = await axios.get(v.thumbnail, { responseType: "arraybuffer" });
          fs.writeFileSync(thumbPath, Buffer.from(thumbRes.data));
          attachments.push(fs.createReadStream(thumbPath));
        } catch (e) {
          console.error("Thumbnail error:", e.message);
        }
      }

      msg += "👉 Kisi bhi gaane ko download karne ke liye uske number (1-6) se reply karein.";

      return api.sendMessage({ body: msg, attachment: attachments }, event.threadID, (err, info) => {
        if (err) return;

        global.GoatBot.onReply.set(info.messageID, {
          commandName: this.config.name,
          type: "chooseSong",
          messageID: info.messageID,
          videos
        });

        // Temporary thumbnails ko delete karna
        attachments.forEach(att => {
          if (fs.existsSync(att.path)) {
            setTimeout(() => { try { fs.unlinkSync(att.path); } catch(e) {} }, 5000);
          }
        });
      }, event.messageID);

    } catch (err) {
      api.sendMessage("❌ Maaf kijiyega, search ke dauran koi masla pesh aaya.", event.threadID);
    }
  },

  onReply: async function ({ api, event, Reply }) {
    const { videos, messageID: replyMsgID } = Reply;
    const choice = parseInt(event.body.trim());

    if (isNaN(choice) || choice < 1 || choice > videos.length) {
      return api.sendMessage("❌ Galat number! Baraye meherbani 1 se 6 ke darmiyan koi number likhein.", event.threadID, event.messageID);
    }

    const video = videos[choice - 1];
    
    // Purana list message delete karein
    try { api.unsendMessage(replyMsgID); } catch(e) {}
    
    api.sendMessage(`⏳ "${video.title}" download ho raha hai, thora intezar karein...`, event.threadID, event.messageID);
    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    try {
      const apiUrl = `https://shizuapi.onrender.com/api/ytmp3?url=${encodeURIComponent(video.url)}`;
      const res = await axios.get(apiUrl);
      
      const downloadUrl = res.data.downloadUrl || res.data.directLink || (res.data.result ? res.data.result.download : null);

      if (!downloadUrl) {
        throw new Error("Download link invalid.");
      }

      const filepath = path.join(CACHE_DIR, `${Date.now()}.mp3`);
      const dlRes = await axios.get(downloadUrl, { responseType: "stream" });
      const writer = fs.createWriteStream(filepath);

      dlRes.data.pipe(writer);

      writer.on("finish", () => {
        api.sendMessage({
          body: `✅  »»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««
          🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉!\n\n🎵 Title: ${video.title}\n👤 Singer: ${video.author.name}\n\nBy: Shaan`,
          attachment: fs.createReadStream(filepath)
        }, event.threadID, () => {
          if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
        }, event.messageID);
        
        api.setMessageReaction("✅", event.messageID, () => {}, true);
      });

    } catch (err) {
      api.sendMessage("❌ Mazrat! API is waqt busy hai ya link kaam nahi kar raha.", event.threadID);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
    }
  }
};