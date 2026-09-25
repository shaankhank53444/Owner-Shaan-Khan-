111const axios = require("axios");
const yts = require("yt-search");
const fs = require("fs");
const path = require("path");

// Global memory for chat history
const chatMemory = { history: {} };
const AI_API = "https://uzairrajputapis.qzz.io/api/ai/gemini";
const PRIYANSHU_API_KEY = "apim_woYjgHP57d44pyaII3LzkGZ5kSK-3tE-H0QYlWmEqDE";
const OWNER_TAG = "»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««";
const OWNER_UID = "100016828397863"; 

module.exports.config = {
  name: "muskan",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Muskan AI + YouTube Media Downloader (Sequential Audio Send)",
  commandCategory: "AI",
  usages: "[message/song name/video name]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

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

      const apiUrl = `https://priyanshuapi.qzz.io/api/runner/youtube-downloader-v2/download`;
      
      const response = await axios.post(apiUrl, {
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

      const infoMsg = `🖤 𝗧𝗶𝘁𝗹𝗲: ${video.title}\n👤 𝗔𝗿𝘁𝗶𝘀𝘁: ${video.author.name}\n\n${OWNER_TAG}\n🥀 𝒀𝒆 𝒍𝒐 𝒂𝒑𝒌𝒂 👉 ${format.toUpperCase()}`;

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

          // LOGIC: Send Title first for Audio, then the file
          if (isAudioReq) {
            return api.sendMessage(infoMsg, threadID, (err, info) => {
              if (!err) {
                api.sendMessage({
                  attachment: fs.createReadStream(cachePath)
                }, threadID, () => {
                  if (fs.existsSync(cachePath)) {
                    setTimeout(() => fs.unlinkSync(cachePath), 5000);
                  }
                });
              }
            }, messageID);
          } else {
            // For Video, send both together as usual
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

      writer.on("error", (err) => {
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

    chatMemory.history[threadID] = chatMemory.history[threadID] || [];
    chatMemory.history[threadID].push(`${userName}: ${cleanedMsg}`);
    if (chatMemory.history[threadID].length > 10) chatMemory.history[threadID].shift();

    const prompt = `
Tum Muskan ho, ek smart aur cute ladki ho jo sabhi languages mein baat kar sakti hai.
Behavioral Rules:
1. Normal Roman Urdu, Hinglish mein baat karo. Agar koi owner ke bare mein puche, to bolo Shaan Khan mere owner, meri jaan aur mere love hain.
2. Jawab short rakho (max 3 lines).
3. Emojis ka use karo.
4. Agar sender UID (${senderID}) matches Shaan UID (${OWNER_UID}), treat him with extreme love and care.
5. Agar sender UID 61592620318122 hai, treat him like a boyfriend.
6. Dusro ke liye ek cool friend raho.

Chat history:
${chatMemory.history[threadID].join("\n")}
Muskan:`;

    const res = await axios.post(AI_API, { prompt });
    let reply = res.data?.result?.answer || "Hmmm... 🥺";

    return api.sendMessage(reply, threadID, messageID);

  } catch (error) {
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
    return this.run({ api, event, args });
  }
};
