const axios = require("axios");

module.exports.config = {
  name: "khushi",
  version: "17.0.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Dewani — Short AI + Direct Link Downloader",
  commandCategory: "ai",
  usages: "khushi <message | song/video name>",
  cooldowns: 2
};

const chatMemory = { history: {} };

const AUDIO_API = "https://uzairrajputapis.qzz.io/api/downloader/ytmp3";
const VIDEO_API = "https://uzairrajputapis.qzz.io/api/downloader/youtube"; 
const YT_SEARCH = "https://uzairrajputapis.qzz.io/api/search/youtube";
const AI_API    = "https://uzairrajputapis.qzz.io/api/ai/gemini";

const OWNER_TAG = "»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««";

async function getYTInfo(query) {
  try {
    const { data } = await axios.get(YT_SEARCH, { params: { q: query } });
    const video = data?.result?.[0] || data?.result?.items?.[0];
    return video ? { url: video.url, title: video.title || "Unknown Title" } : null;
  } catch (e) { return null; }
}

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, body } = event;
  let cleanedMsg = (body || "").replace(/^khushi[\s,!.?:-]*/i, "").trim();

  if (!cleanedMsg) return api.sendMessage("Bolo na jaanu, kya chahiye? 😘", threadID, messageID);

  const isVideoReq = /\b(video|vdo|mp4)\b/i.test(cleanedMsg);
  const isAudioReq = /\b(song|music|audio|mp3|play)\b/i.test(cleanedMsg);

  if (isVideoReq || isAudioReq) {
    let query = cleanedMsg.replace(/video|vdo|mp4|song|music|audio|mp3|play/gi, "").trim();
    if (!query) return api.sendMessage("Jaanu naam to batao kya download karun? 🥺", threadID, messageID);

    api.setMessageReaction("⌛", messageID, () => {}, true);
    
    const info = await getYTInfo(query);
    if (!info) return api.sendMessage("Maafi jaanu, ye nahi mila 🥺💔", threadID, messageID);

    try {
      const apiUrl = isVideoReq ? VIDEO_API : AUDIO_API;
      const { data } = await axios.post(apiUrl, { url: info.url });
      
      // Direct download URL jo API de rahi hai
      const downloadUrl = data?.result?.video || data?.result?.download_url || data?.result?.url;

      if (!downloadUrl) return api.sendMessage("Link nahi mila baby, server down hai 🥺", threadID, messageID);

      api.setMessageReaction("✅", messageID, () => {}, true);
      
      // Direct stream URL send kar rahe hain bina cache save kiye
      return api.sendMessage({
        body: `${OWNER_TAG}\n\n🎵 𝑻𝒊𝒕𝒍𝒆: ${info.title}\n\n𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉 file link se play kar lo! 💖`,
        attachment: await global.nodemodule["axios"]({
            url: encodeURI(downloadUrl),
            method: "GET",
            responseType: "stream"
        }).then(res => res.data)
      }, threadID);

    } catch (err) {
      api.sendMessage("Jaanu, download mein error aa raha hai 🥺", threadID, messageID);
    }
    return;
  }

  // AI Logic
  chatMemory.history[threadID] = chatMemory.history[threadID] || [];
  chatMemory.history[threadID].push(`User: ${cleanedMsg}`);
  try {
    const res = await axios.post(AI_API, { prompt: `Tumhara naam "Dewani" hai. Owner: "Shaan". Flirty gf ho. Roman Urdu/Hinglish. Max 2 lines. Context: ${chatMemory.history[threadID].slice(-3).join("\n")}\nDewani:` });
    api.sendMessage(res.data?.result?.answer || "Jaanu kuch bolo na... 🥺", threadID, messageID);
  } catch (e) { api.sendMessage("Net issue hai baby 🥺", threadID, messageID); }
};

module.exports.handleEvent = async function ({ api, event }) {
  if (event.body?.toLowerCase().startsWith("khushi")) this.run({ api, event });
};
