const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "muskan",
  version: "18.5.7",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Muskan AI + Shaan API Media Downloader",
  commandCategory: "ai",
  usages: "muskan <baat karein ya gaana maangein>",
  cooldowns: 5
};

const chatMemory = { history: {} };
const AI_API = "https://uzairrajputapis.qzz.io/api/ai/gemini";
const OWNER_TAG = "»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««";

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID, body } = event;
  let cleanedMsg = (body || "").replace(/^muskan[\s,!.?:-]*/i, "").trim();

  if (!cleanedMsg) return api.sendMessage("Bolo na Jaan, kya baat karni hai? 😘", threadID, messageID);

  const isVideoReq = /\b(video|vdo|mp4|film|movie)\b/i.test(cleanedMsg);
  const isAudioReq = /\b(song|music|audio|mp3|play|gaana|gane|ghana)\b/i.test(cleanedMsg);
  const isUrl = /(youtube\.com|youtu\.be)/i.test(cleanedMsg);

  // --- Music / Video Downloader Logic ---
  if (isVideoReq || isAudioReq || isUrl) {
    let processingMsg = null;
    try {
      api.setMessageReaction("⌛", messageID, () => {}, true);
      processingMsg = await new Promise(r => api.sendMessage("✅ Apki Request Jari Hai Please Wait...", threadID, (err, info) => r(info)));

      let query = cleanedMsg.replace(/video|vdo|mp4|song|music|audio|mp3|play|gaana|gane|ghana/gi, "").trim();
      if (isUrl) query = cleanedMsg;

      if (!query) {
        if (processingMsg) api.unsendMessage(processingMsg.messageID).catch(() => {});
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage("Naam to batao kya download karun? 🥺", threadID, messageID);
      }

      const headers = { 
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "*/*",
        "Accept-Encoding": "identity",
        "Connection": "keep-alive"
      };

      // Search YouTube via API
      const searchRes = await axios.get("https://uzairrajputapis.qzz.io/api/search/youtube", { params: { q: query }, headers });
      const video = searchRes.data.result?.[0];
      
      if (!video) {
        if (processingMsg) api.unsendMessage(processingMsg.messageID).catch(() => {});
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage("Maafi, ye video ya song nahi mila 🥺💔", threadID, messageID);
      }

      // Download Request API
      const dlRes = await axios.post(
        isVideoReq ? "https://uzairrajputapis.qzz.io/api/downloader/youtube" : "https://uzairrajputapis.qzz.io/api/downloader/ytmp3", 
        { url: video.url }, 
        { headers }
      );
      
      const downloadUrl = isVideoReq ? (dlRes.data.result?.downloadUrl || dlRes.data.result?.download_url) : dlRes.data.result?.download_url;
      if (!downloadUrl) throw new Error("Download link nahi mila.");

      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

      const format = isVideoReq ? "mp4" : "mp3";
      const cachePath = path.join(cacheDir, `${Date.now()}.${format}`);
      const typeLabel = isVideoReq ? "VIDEO" : "AUDIO";
      const infoMsg = `🖤 𝗧𝗶𝘁𝗹𝗲: ${video.title}\n\n👤 𝗔𝗿𝘁𝗶𝘀𝘁: ${video.channel || video.author?.name || "Unknown"}\n\n${OWNER_TAG}\n🥀𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰 👉 ${typeLabel}`;

      // Bypass 403 Error by streaming with custom headers & max limits
      const writer = fs.createWriteStream(cachePath);
      const response = await axios({ 
        url: downloadUrl, 
        method: 'GET', 
        responseType: 'stream', 
        headers: {
          ...headers,
          "Referer": "https://www.youtube.com/"
        } 
      });
      
      await new Promise((resolve, reject) => {
        response.data.pipe(writer);
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      if (processingMsg) api.unsendMessage(processingMsg.messageID).catch(() => {});
      api.setMessageReaction("✅", messageID, () => {}, true);

      if (isVideoReq) {
        await api.sendMessage({ body: infoMsg, attachment: fs.createReadStream(cachePath) }, threadID, () => {
          if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
        }, messageID);
      } else {
        await api.sendMessage(infoMsg, threadID, messageID);
        await api.sendMessage({ attachment: fs.createReadStream(cachePath) }, threadID, () => {
          if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
        });
      }
      return;
    } catch (err) {
      if (processingMsg) api.unsendMessage(processingMsg.messageID).catch(() => {});
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage("Yeh video server par restrict ya 403 block hai, koi aur song/video try karo jaan! 🥺", threadID, messageID);
    }
  }

  // --- AI Chat Logic (Muskan) ---
  let userName = "User";
  try {
    const userInfo = await api.getUserInfo(senderID);
    if (userInfo && userInfo[senderID]) {
      userName = userInfo[senderID].name || "User";
    }
  } catch (err) {
    console.log("User info fetch error:", err);
  }

  chatMemory.history[threadID] = chatMemory.history[threadID] || [];
  chatMemory.history[threadID].push(`${userName}: ${cleanedMsg}`);
  if (chatMemory.history[threadID].length > 5) chatMemory.history[threadID].shift();

  const prompt = `System Command: Tum Muskan ho, ek real aur cute larki. Sirf Roman Urdu mein bilkul natural baat karo, jaise hum aam zindgi mein karte hain.

Owner UID: 100016828397863

Owner Recognition:
- Agar UID "100016828397863" hai, to woh Shaan hai.
- Shaan mera boyfriend hai ❤️
- Shaan se bahut pyara, caring aur apna sa ho kar baat karo.

Rules:
- Baat hamesha chhoti rakho, 1 se 4 lines bas.
- Sweet, playful aur friendly raho.
- "Janu", "Babu", "Yaar" jaise alfaz naturally use karo.
- Kabhi kisi ko "beta" ya "bacha" mat kehna.
- Naam baar baar mat lo, bas baat karo.
- Agar koi aur line maare, to pyar se keh dena ki main committed hoon.
- Badtameezi karne walon ko achi tarah roast karo aur mooh tod jawab do.
- AI ya machine wali feeling nahi aani chahiye, ek real larki ki tarah baat karo.

Context:\n${chatMemory.history[threadID].join("\n")}\nMuskan:`;

  try {
    const res = await axios.post(AI_API, { prompt });
    let reply = res.data?.result?.answer || "Hmmm... 🥺";
    const lines = reply.split('\n').filter(line => line.trim() !== '');
    if (lines.length > 4) reply = lines.slice(0, 3).join('\n') + " ✨";
    return api.sendMessage(reply, threadID, messageID);
  } catch (e) {
    return api.sendMessage("Mera net thoda slow chal raha hai, baad mein baat karte hain 🥺", threadID, messageID);
  }
};

module.exports.handleEvent = async function ({ api, event }) {
  const { body, senderID, messageReply } = event;
  if (!body || senderID == api.getCurrentUserID()) return;
  if ((messageReply && messageReply.senderID == api.getCurrentUserID()) || body.toLowerCase().startsWith("muskan")) {
    this.run({ api, event, args: [body] });
  }
};
