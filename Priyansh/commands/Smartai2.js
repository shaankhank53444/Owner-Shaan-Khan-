const axios = require("axios");
const yts = require("yt-search");
const fs = require("fs");
const path = require("path");

// Global memory for chat history
const chatMemory = { history: {} };
const AI_API = "https://uzairrajputapis.qzz.io/api/ai/gemini";
const DOWNLOAD_API = "https://priyanshuapi.qzz.io/api/runner/youtube-downloader-v2/download";

const OWNER_TAG = "»»𝑶𝑾𝑵𝑬𝑹««★™ »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««";
const OWNER_UID = "100016828397863";

module.exports = {
  config: {
    name: "muskan",
    aliases: [],
    version: "2.0.2",
    description: "Muskan AI + YouTube Media Downloader (Super Loyal to Shaan)",
    usage: "{prefix}muskan [message/song name/video name]",
    credit: "𝐏𝐫𝐢𝐲𝐚𝐧𝐬𝐡 𝐑𝐚𝐣𝐩𝐮𝐭 & Updated for Shaan",
    hasPrefix: true,
    permission: "PUBLIC",
    cooldown: 5,
    category: "AI"
  },

  run: async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;

    // 🔑 Fetch API Key securely from global config with fallback
    const PRIYANSHU_API_KEY = global.config?.apiKeys?.priyanshuApi || global.config?.PRIYANSHU_API_KEY || "apim_CHxiCUER2oGsy5qcntUV2BFmIh-1bo3KJzG4Ujx4hoo";

    try {
      let cleanedMsg = (args.join(" ") || "").trim();
      if (!cleanedMsg) {
        return api.sendMessage("Bolo na Shaan, kya baat karni hai? 😘", threadID, messageID);
      }

      const isVideoReq = /\b(video|vdo|mp4|film|movie)\b/i.test(cleanedMsg);
      const isAudioReq = /\b(song|music|audio|mp3|play|gaana|gane|ghana)\b/i.test(cleanedMsg);
      const isUrl = /(youtube\.com|youtu\.be)/i.test(cleanedMsg);

      // --- Media Downloader Logic ---
      if (isVideoReq || isAudioReq || isUrl) {
        api.setMessageReaction("⌛", messageID, () => {}, true);

        let query = cleanedMsg.replace(/video|vdo|mp4|song|music|audio|mp3|play|gaana|gane|ghana/gi, "").trim();
        if (isUrl) query = cleanedMsg;
        if (!query) return api.sendMessage("Naam to batao kya download karun? 🥺", threadID, messageID);

        const searchResult = await yts(query);
        if (!searchResult || !searchResult.videos.length) {
          api.setMessageReaction("❌", messageID, () => {}, true);
          return api.sendMessage("Maafi, ye video ya song nahi mila 🥺💔", threadID, messageID);
        }

        const video = searchResult.videos[0];
        const videoUrl = video.url;
        const format = isVideoReq ? "mp4" : "mp3";

        const response = await axios.post(DOWNLOAD_API, {
          url: videoUrl,
          format: format,
          quality: isVideoReq ? "360" : "320"
        }, {
          headers: {
            'Authorization': `Bearer ${PRIYANSHU_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 120000
        });

        const downloadUrl = response.data?.data?.downloadUrl;
        if (!downloadUrl) {
          api.setMessageReaction("❌", messageID, () => {}, true);
          return api.sendMessage("Download link nahi mil paaya, API issue ho sakta hai. 🥺", threadID, messageID);
        }

        const cacheDir = path.join(__dirname, "cache");
        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

        const fileName = `muskan_${Date.now()}_${senderID}.${format}`;
        const cachePath = path.resolve(cacheDir, fileName);

        const infoMsg = `🖤 𝗧𝗶𝘁𝗹𝗲: ${video.title}\n👤 𝗔𝗿𝘁𝗶𝘀𝘁: ${video.author.name}\n\n${OWNER_TAG}\n🥀 𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉 ${format.toUpperCase()}`;

        const writer = fs.createWriteStream(cachePath);
        const streamResponse = await axios({
          url: downloadUrl,
          method: 'GET',
          responseType: 'stream',
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        streamResponse.data.pipe(writer);

        writer.on("finish", async () => {
          try {
            if (!fs.existsSync(cachePath)) throw new Error("File not found");
            const stats = fs.statSync(cachePath);
            const fileSizeInMB = stats.size / (1024 * 1024);

            if (stats.size === 0) {
              if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
              return api.sendMessage("❌ File empty download hui.", threadID, messageID);
            }

            if (fileSizeInMB > 48) {
              api.setMessageReaction("❌", messageID, () => {}, true);
              if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
              return api.sendMessage("⚠️ File size limit (48MB) se zy
