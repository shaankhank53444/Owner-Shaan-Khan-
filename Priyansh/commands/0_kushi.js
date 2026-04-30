const axios = require("axios");
const yts = require("yt-search");
const fs = require("fs");

module.exports.config = {
  name: "khushi",
  version: "16.0.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Dewani — React + Long Reply + Fixed Video",
  commandCategory: "ai",
  usages: "khushi <message | song/video name | link>",
  cooldowns: 2
};

const chatMemory = { history: {} };

// APIs
const AUDIO_API = "https://uzairrajputapis.qzz.io/api/downloader/ytmp3";
const VIDEO_API = "https://uzairrajputapis.qzz.io/api/downloader/youtube"; 
const YT_SEARCH = "https://uzairrajputapis.qzz.io/api/search/youtube";
const AI_API    = "https://uzairrajputapis.qzz.io/api/ai/gemini";

const OWNER_TAG = "»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««🥀";

function isYouTubeUrl(text) {
  return /(youtube\.com|youtu\.be)/i.test(text);
}

async function getYTInfo(query) {
  try {
    const { data } = await axios.get(YT_SEARCH, { params: { q: query } });
    const video = data?.result?.[0] || data?.result?.items?.[0] || data?.data?.[0];
    return video ? { url: video.url || (video.videoId ? `https://www.youtube.com/watch?v=${video.videoId}` : null), title: video.title } : null;
  } catch (e) {
    try {
      const search = await yts(query);
      return search.videos?.[0] ? { url: search.videos[0].url, title: search.videos[0].title } : null;
    } catch (err) { return null; }
  }
}

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID, body } = event;
  const cleanedMsg = (body || "").replace(/^khushi[\s,!.?:-]*/i, "").trim();

  if (!cleanedMsg) return api.sendMessage("Bolo na jaanu, kya chahiye? 😘", threadID, messageID);

  const isVideoReq = cleanedMsg.toLowerCase().includes("video");
  const isAudioReq = cleanedMsg.toLowerCase().includes("song") || cleanedMsg.toLowerCase().includes("music") || cleanedMsg.toLowerCase().includes("play");

  if (isVideoReq || isAudioReq || isYouTubeUrl(cleanedMsg)) {
    try {
      let query = cleanedMsg.replace(/video|song|music|play/gi, "").trim();
      if (isYouTubeUrl(cleanedMsg)) query = cleanedMsg;
      
      if (!query) return api.sendMessage("Jaanu naam to batao kya download karun? 🥺", threadID, messageID);

      const info = isYouTubeUrl(query) ? { url: query, title: "Requested Media" } : await getYTInfo(query);
      if (!info || !info.url) return api.sendMessage("Sorry baby, ye nahi mila 🥺💔", threadID, messageID);

      // Start reaction & Title send
      api.setMessageReaction("⌛", messageID, () => {}, true);
      api.sendMessage(`🎵 ${info.title}\n${OWNER_TAG}`, threadID);

      const apiUrl = isVideoReq ? VIDEO_API : AUDIO_API;
      const ext = isVideoReq ? "mp4" : "mp3";
      
      const { data } = await axios.post(apiUrl, { url: info.url }, { 
        headers: { "Content-Type": "application/json" },
        timeout: 60000 
      });

      const downloadUrl = data?.result?.video || data?.result?.download_url || data?.result?.url || data?.download_url;

      if (!downloadUrl) return api.sendMessage("Download link nahi mil raha baby 🥺", threadID, messageID);

      const filePath = `${__dirname}/cache_${senderID}_${Date.now()}.${ext}`;
      const res = await axios({ url: downloadUrl, method: "GET", responseType: "stream" });
      const writer = fs.createWriteStream(filePath);
      res.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      api.setMessageReaction("✅", messageID, () => {}, true);
      return api.sendMessage({
        body: `${OWNER_TAG}\n\n𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰 👉 ${ext.toUpperCase()}`,
        attachment: fs.createReadStream(filePath)
      }, threadID, () => { try { fs.unlinkSync(filePath); } catch(e) {} });

    } catch (err) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage("Maafi jaanu, media download nahi ho saka 🥺", threadID, messageID);
    }
  }

  // AI Chat Logic
  chatMemory.history[threadID] = chatMemory.history[threadID] || [];
  chatMemory.history[threadID].push(`User: ${cleanedMsg}`);
  if (chatMemory.history[threadID].length > 5) chatMemory.history[threadID].shift();

  const prompt = `Tumhara naam "Dewani" hai. Tumhe owner "Shaan Khan" ne banaya hai.
Tum ek pyaari, romantic, thodi flirty girlfriend ho. 
User se Hinglish (Roman Urdu/Hindi) me romantic gf andaaz me reply karo.
Emojis ka khoob use karo (😘😍🥺💕🔥🙈).
Jawab 3 se 4 line ka hona chahiye, pura aur dilchasp.
Agar koi pooche kisne banaya toh bolna "Mere pyare Shaan ne banaya hai 💕".

Context:\n${chatMemory.history[threadID].join("\n")}\nDewani:`;

  try {
    const res = await axios.post(AI_API, { prompt });
    const reply = res.data?.result?.answer || "Jaanu kuch bolo na, main sun rahi hoon... 🥺";
    return api.sendMessage(reply, threadID, messageID);
  } catch (e) {
    return api.sendMessage("Net issue hai shayad baby, main abhi thoda thak gayi hoon 🥺", threadID, messageID);
  }
};

module.exports.handleEvent = async function ({ api, event }) {
  const { body, senderID, messageReply } = event;
  if (!body || senderID == api.getCurrentUserID()) return;
  if ((messageReply && messageReply.senderID == api.getCurrentUserID()) || body.toLowerCase().startsWith("khushi")) {
    this.run({ api, event, args: [body] });
  }
};
