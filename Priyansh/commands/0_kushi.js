const axios = require("axios");
const yts = require("yt-search");
const fs = require("fs");

module.exports.config = {
  name: "khushi",
  version: "17.0.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Dewani — Short AI + Fixed Video/Audio Downloader",
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

function isYouTubeUrl(text) {
  return /(youtube\.com|youtu\.be)/i.test(text);
}

async function getYTInfo(query) {
  try {
    const { data } = await axios.get(YT_SEARCH, { params: { q: query } });
    const video = data?.result?.[0] || data?.result?.items?.[0];
    return video ? { url: video.url, title: video.title } : null;
  } catch (e) { return null; }
}

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID, body } = event;
  let cleanedMsg = (body || "").replace(/^khushi[\s,!.?:-]*/i, "").trim();

  if (!cleanedMsg) return api.sendMessage("Bolo na jaanu, kya chahiye? 😘", threadID, messageID);

  const isVideoReq = /\b(video|vdo|mp4)\b/i.test(cleanedMsg);
  const isAudioReq = /\b(song|music|audio|mp3|play)\b/i.test(cleanedMsg);

  if (isVideoReq || isAudioReq || isYouTubeUrl(cleanedMsg)) {
    let query = cleanedMsg.replace(/video|vdo|mp4|song|music|audio|mp3|play/gi, "").trim();
    if (isYouTubeUrl(cleanedMsg)) query = cleanedMsg;

    if (!query) return api.sendMessage("Jaanu naam to batao kya download karun? 🥺", threadID, messageID);

    const info = isYouTubeUrl(query) ? { url: query, title: "Requested Media" } : await getYTInfo(query);
    if (!info || !info.url) return api.sendMessage("Maafi jaanu, ye video nahi mili 🥺💔", threadID, messageID);

    api.setMessageReaction("⌛", messageID, () => {}, true);

    const apiUrl = isVideoReq ? VIDEO_API : AUDIO_API;
    const ext = isVideoReq ? "mp4" : "mp3";

    try {
      const { data } = await axios.post(apiUrl, { url: info.url });
      const downloadUrl = data?.result?.video || data?.result?.download_url || data?.result?.url || data?.download_url;

      if (!downloadUrl) {
          api.setMessageReaction("❌", messageID, () => {}, true);
          return api.sendMessage("Maafi jaanu, iska download link nahi mil raha 🥺", threadID, messageID);
      }

      const filePath = `${__dirname}/cache_${senderID}_${Date.now()}.${ext}`;
      const res = await axios({ url: downloadUrl, method: "GET", responseType: "stream" });
      const writer = fs.createWriteStream(filePath);
      res.data.pipe(writer);

      writer.on("finish", async () => {
        api.setMessageReaction("✅", messageID, () => {}, true);

        // Pehle Title
        await api.sendMessage(`${OWNER_TAG}\n\n🎵 𝑻𝒊𝒕𝒍𝒆: ${info.title}`, threadID);

        // Phir File
        return api.sendMessage({
          body: `𝒀𝑬 𝑳𝑶 𝑩𝑨𝑩𝒀 𝑨𝑷𝑲𝑰👉 ${ext.toUpperCase()} file tayar hai! 💖`,
          attachment: fs.createReadStream(filePath)
        }, threadID, () => { try { fs.unlinkSync(filePath); } catch(e) {} });
      });

    } catch (err) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage("Jaanu server busy hai, thodi der baad try karna 🥺", threadID, messageID);
    }
    return;
  }

  chatMemory.history[threadID] = chatMemory.history[threadID] || [];
  chatMemory.history[threadID].push(`User: ${cleanedMsg}`);
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
  if ((messageReply && messageReply.senderID == api.getCurrentUserID()) || body.toLowerCase().startsWith("khushi")) {
    this.run({ api, event, args: [body] });
  }
};