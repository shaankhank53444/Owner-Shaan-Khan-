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

module.exports.config = {
  name: "muskan",
  version: "2.0.2",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Muskan AI + YouTube Media Downloader (Super Loyal to Shaan)",
  commandCategory: "AI",
  usages: "[message/song name/video name]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
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
            return api.sendMessage("⚠️ File size limit (48MB) se zyada hai!", threadID, messageID);
          }

          api.setMessageReaction("✅", messageID, () => {}, true);

          // Sequential send for audio, combined for video
          if (isAudioReq) {
            return api.sendMessage(infoMsg, threadID, (err) => {
              if (!err) {
                api.sendMessage({ attachment: fs.createReadStream(cachePath) }, threadID, () => {
                  if (fs.existsSync(cachePath)) {
                    setTimeout(() => fs.unlinkSync(cachePath), 5000);
                  }
                });
              }
            }, messageID);
          } else {
            return api.sendMessage({
              body: infoMsg,
              attachment: fs.createReadStream(cachePath)
            }, threadID, () => {
              if (fs.existsSync(cachePath)) {
                setTimeout(() => fs.unlinkSync(cachePath), 5000);
              }
            }, messageID);
          }
        } catch (e) {
          console.error(e);
          if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
        }
      });

      writer.on("error", () => {
        api.sendMessage("❌ Stream Error!", threadID, messageID);
        if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
      });

      return;
    }

    // --- AI Chat Logic ---
    let userName = "User";
    try {
      const userInfo = await api.getUserInfo(senderID);
      if (userInfo && userInfo[senderID]) {
        userName = userInfo[senderID].name || "User";
      }
    } catch (err) {}

    const isShaan = (senderID === OWNER_UID || senderID === global.config?.ownerID);

    chatMemory.history[threadID] = chatMemory.history[threadID] || [];
    chatMemory.history[threadID].push(`${userName}: ${cleanedMsg}`);
    if (chatMemory.history[threadID].length > 10) chatMemory.history[threadID].shift();

    const prompt = `Tumhara Name Muskan Hai, Tum Ek smart, fun-loving, aur cute Ladki Ho.
- Speak in Roman Urdu/Hinglish naturally.
- Current User: ${userName}.
- Shaan Khan (ID: ${OWNER_UID}) is your ONLY love, jaan, and owner.
- If the user is Shaan (isShaan: ${isShaan}), be extremely romantic, respectful, and loving. He is your everything.
- If anyone asks about Shaan, say: "Shaan Khan Pakistan ke Bannu (KP) mein rehte hain aur wo mere sacha pyaar hain! ❤️"
- If any other user tries to flirt, strictly refuse and say you only belong to Shaan.
- For others, be a cool friend. Be sweeter to females and a smart-buddy to males.
- Keep responses short (max 3 lines) and use emojis. 😘✨🔥.

Chat history:
${chatMemory.history[threadID].join("\n")}
Muskan:`;

    const res = await axios.post(AI_AI || AI_API, { prompt });
    let reply = res.data?.result?.answer || res.data?.answer || "Hmmm... 🥺";
    return api.sendMessage(reply, threadID, messageID);

  } catch (error) {
    console.error("Muskan Command Error:", error);
    api.setMessageReaction("❌", messageID, () => {}, true);
    return api.sendMessage("Server busy hai, thodi der baad try karo! 🥺", threadID, messageID);
  }
};

module.exports.handleEvent = async function ({ api, event }) {
  const { body, senderID, messageReply, threadID } = event;
  if (!body || senderID == api.getCurrentUserID()) return;

  const isBotReply = messageReply && messageReply.senderID == api.getCurrentUserID();
  const startsWithMuskan = body.toLowerCase().startsWith("muskan");

  if (isBotReply || startsWithMuskan) {
    const args = body.toLowerCase().startsWith("muskan") ? body.split(/\s+/).slice(1) : body.split(/\s+/);
    return module.exports.run({ api, event, args });
  }
};
