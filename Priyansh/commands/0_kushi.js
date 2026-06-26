const axios = require("axios");
const yts = require("yt-search");
const fs = require("fs");

module.exports.config = {
  name: "muskan", // Name changed to muskan
  version: "17.0.0",
  hasPermssion: 0,
  credits: "Shaan Khan",
  description: "Muskan — Short AI + Fixed Video/Audio Downloader",
  commandCategory: "ai",
  usages: "muskan <message | song/video name>",
  cooldowns: 2
};

const chatMemory = { history: {} };

const AUDIO_API = "https://uzairrajputapis.qzz.io/api/downloader/ytmp3";
const VIDEO_API = "https://uzairrajputapis.qzz.io/api/downloader/youtube"; // Updated API
const YT_SEARCH = "https://uzairrajputapis.qzz.io/api/search/youtube";
const AI_API    = "https://uzairrajputapis.qzz.io/api/ai/gemini";

const OWNER_TAG = "»»𝑶𝑾𝑵𝑬𝑹««★™  »»𝑺𝑯𝑨𝑨𝑵 𝑲𝑯𝑨𝑵««";
const OWNER_UID = "100016828397863";

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
  // Command prefix changed to muskan
  let cleanedMsg = (body || "").replace(/^muskan[\s,!.?:-]*/i, "").trim();

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
        await api.sendMessage(`${OWNER_TAG}\n\n🎵 𝑻𝒊𝒕𝒍𝒆: ${info.title}`, threadID);
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
  chatMemory.history[threadID].push(`User ${senderID}: ${cleanedMsg}`);
  if (chatMemory.history[threadID].length > 5) chatMemory.history[threadID].shift();

  const prompt = `System Command: Tum Muskan ho, ek real aur cute larki. Sirf Roman Urdu mein bilkul natural baat karo.

User ID: ${senderID}
Owner UID: ${OWNER_UID}

Rules:
- Agar User ID "${OWNER_UID}" hai, to woh Shaan hai, mera boyfriend. Unse bahut pyara, caring aur apna sa ho kar baat karo.
- Agar koi aur hai, to unse tameez se baat karo. Agar koi flirt kare to pyar se keh dena ki main committed hoon.
- Baat hamesha chhoti rakho, 1 se 2 lines bas.
- Sweet, playful aur friendly raho.
- Naam baar baar mat lo, sirf tab jab bohot zaroori ho.
- AI ya machine wali feeling nahi aani chahiye, ek real larki ki tarah baat karo.

Context:
${chatMemory.history[threadID].join("\n")}
Muskan:`;

  try {
    const res = await axios.post(AI_API, { prompt });
    let reply = res.data?.result?.answer || "Jaanu kuch bolo na... 🥺";
    return api.sendMessage(reply, threadID, messageID);
  } catch (e) {
    return api.sendMessage("Net issue hai baby, main thak gayi hoon 🥺", threadID, messageID);
  }
};

module.exports.handleEvent = async function ({ api, event }) {
  const { body, senderID, messageReply } = event;
  if (!body || senderID == api.getCurrentUserID()) return;
  // Updated prefix check to 'muskan'
  if ((messageReply && messageReply.senderID == api.getCurrentUserID()) || body.toLowerCase().startsWith("muskan")) {
    this.run({ api, event, args: [body] });
  }
};
