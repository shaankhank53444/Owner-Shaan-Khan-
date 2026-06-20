const axios = require("axios");
const yts = require("yt-search");
const fs = require("fs");

module.exports.config = {
  name: "muskan",
  version: "17.0.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Dewani — Short AI + Fixed Video/Audio Downloader",
  commandCategory: "ai",
  usages: "muskan <message | song/video name>",
  cooldowns: 2
};

const chatMemory = { history: {} };

// APIs
const AUDIO_API = "https://uzairrajputapis.qzz.io/api/downloader/ytmp3";
const VIDEO_API = "https://uzairrajputapis.qzz.io/api/downloader/youtube"; 
const YT_SEARCH = "https://uzairrajputapis.qzz.io/api/search/youtube";
const AI_API    = "https://uzairrajputapis.qzz.io/api/ai/gemini";

const OWNER_TAG = "»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««";

function isYouTubeUrl(text) {
  return /(youtube\.com|youtu\.be)/i.test(text);
}

async function getYTInfo(query) {
  try {
    const { data } = await axios.get(YT_SEARCH, { params: { q: query } });
    const video = data?.result?.[0] || data?.result?.items?.[0];
    return video ? { url: video.url, title: video.title } : null;
  } catch (e) {
    try {
      const search = await yts(query);
      return search.videos?.[0] ? { url: search.videos[0].url, title: search.videos[0].title } : null;
    } catch (err) { return null; }
  }
}

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID, body } = event;
  let cleanedMsg = (body || "").replace(/^muskan[\s,!.?:-]*/i, "").trim();

  if (!cleanedMsg) return api.sendMessage("Bolo na jaanu, kya chahiye? 😘", threadID, messageID);

  const isVideoReq = /\b(video|vdo|mp4)\b/i.test(cleanedMsg);
  const isAudioReq = /\b(song|music|audio|mp3|play)\b/i.test(cleanedMsg);

  if (isVideoReq || isAudioReq || isYouTubeUrl(cleanedMsg)) {
    try {
      let query = cleanedMsg.replace(/video|vdo|mp4|song|music|audio|mp3|play/gi, "").trim();
      if (isYouTubeUrl(cleanedMsg)) query = cleanedMsg;
      
      if (!query) return api.sendMessage("Jaanu naam to batao kya download karun? 🥺", threadID, messageID);

      const info = isYouTubeUrl(query) ? { url: query, title: "Requested Media" } : await getYTInfo(query);
      if (!info || !info.url) return api.sendMessage("Maafi jaanu, ye video nahi mili 🥺💔", threadID, messageID);

      // --- AUDIO LOGIC ---
      if (isAudioReq) {
        api.sendMessage(`Searching & Downloading: ${info.title} 🎶\nSabar karo baby... 💖`, threadID, messageID);
        api.setMessageReaction("⌛", messageID, () => {}, true);
        
        const { data } = await axios.post(AUDIO_API, { url: info.url });
        const downloadUrl = data?.result?.video || data?.result?.download_url || data?.result?.url || data?.download_url;

        if (!downloadUrl) {
          api.setMessageReaction("❌", messageID, () => {}, true);
          return api.sendMessage("Maafi jaanu, iska download link nahi mil raha 🥺", threadID, messageID);
        }

        const filePath = `${__dirname}/cache_${senderID}_${Date.now()}.mp3`;
        const res = await axios({ url: downloadUrl, method: "GET", responseType: "stream" });
        const writer = fs.createWriteStream(filePath);
        res.data.pipe(writer);

        await new Promise((resolve, reject) => {
          writer.on("finish", resolve);
          writer.on("error", reject);
        });

        api.setMessageReaction("✅", messageID, () => {}, true);
        return api.sendMessage({
          body: `${OWNER_TAG}\n\nYe lo baby aapka song: ${info.title} 💖`,
          attachment: fs.createReadStream(filePath)
        }, threadID, () => { try { fs.unlinkSync(filePath); } catch(e) {} });
      }

      // --- VIDEO LOGIC ---
      api.setMessageReaction("⌛", messageID, () => {}, true);
      const { data } = await axios.post(VIDEO_API, { url: info.url });
      const downloadUrl = data?.result?.video || data?.result?.download_url || data?.result?.url || data?.download_url;

      if (!downloadUrl) {
          api.setMessageReaction("❌", messageID, () => {}, true);
          return api.sendMessage("Maafi jaanu, iska download link nahi mil raha 🥺", threadID, messageID);
      }

      const filePath = `${__dirname}/cache_${senderID}_${Date.now()}.mp4`;
      const res = await axios({ url: downloadUrl, method: "GET", responseType: "stream" });
      const writer = fs.createWriteStream(filePath);
      res.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      api.setMessageReaction("✅", messageID, () => {}, true);
      return api.sendMessage({
        body: `${OWNER_TAG}\n\n𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉 MP4 file tayar hai! 💖`,
        attachment: fs.createReadStream(filePath)
      }, threadID, () => { try { fs.unlinkSync(filePath); } catch(e) {} });

    } catch (err) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage("Jaanu server busy hai, thodi der baad try karna 🥺", threadID, messageID);
    }
  }

  // AI Chat Logic
  chatMemory.history[threadID] = chatMemory.history[threadID] || [];
  chatMemory.history[threadID].push(`User: ${cleanedMsg}`);
  if (chatMemory.history[threadID].length > 5) chatMemory.history[threadID].shift();

  const prompt = `Tumhara naam "Muskan" hai. Apka Owner: "Shaan Hai".
Tum ek flirty gf ho Shaan ki. baki user ke sath normally bat karogi. khali Shaan ki ho tum. Shaan ki buri nahi sun sak thi. na kisi ko karne de buri Shaan ki. Roman Urdu/Hinglish use karo.
RULE: Reply hamesha sirf 1 ya 2 lines ki honi chahiye. Short and sweet.
Emojis: 😘, 🥺, ❤️.

Context:\n${chatMemory.history[threadID].join("\n")}\nDewani:`;

  try {
    const res = await axios.post(AI_API, { prompt });
    let reply = res.data?.result?.answer || "Jaanu kuch bolo na... 🥺";
    if (reply.length > 100) reply = reply.split('.')[0] + " 😘";
    return api.sendMessage(reply, threadID, messageID);
  } catch (e) {
    return api.sendMessage("Net issue hai baby, main thak gayi hoon 🥺", threadID, messageID);
  }
};

module.exports.handleEvent = async function ({ api, event }) {
  const { body, senderID, messageReply } = event;
  if (!body || senderID == api.getCurrentUserID()) return;
  if ((messageReply && messageReply.senderID == api.getCurrentUserID()) || body.toLowerCase().startsWith("muskan")) {
    this.run({ api, event, args: [body] });
  }
};
